// app/api/production/[id]/approve/route.js
//
// 4-Stage Approval dengan Soft-Reserve:
//   qc         → PENDING_QC_PROD  → PENDING_ADMIN        | Supervisor/Super Admin
//                                   + softReserveBatches() ← stok dicadangkan
//   admin      → PENDING_ADMIN    → PENDING_SUPERVISOR    | Admin SAJA
//   supervisor → PENDING_SUPERVISOR → PENDING_MANAGER    | Supervisor/Super Admin
//   manager    → PENDING_MANAGER  → COMPLETED             | Manager/Super Admin
//                                   + deductReservedBatches() (potong permanen)
//                                   + createBatch() output
//                                   + syncStockFromBatches()
//   reject     → CANCELLED                                | Admin/Supervisor/Manager/Super Admin
//                                   + releaseSoftReserve() (lepas cadangan)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  softReserveBatches,
  releaseSoftReserve,
  deductReservedBatches,
  createBatch,
  syncStockFromBatches,
} from "@/lib/productionFifoService";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { message: `Invalid JSON: ${parseError.message}` },
        { status: 400 }
      );
    }

    const { stage, warehouseId, notes } = body;
    const approver = session.user.name || session.user.email;
    const role = session.user.role;
    const now = new Date();

    // ── Load production order ─────────────────────────────────────────────────
    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        components: true,
        warehouse: { select: { id: true, name: true } },
      },
    });

    if (!production) {
      return NextResponse.json(
        { message: "Production order tidak ditemukan." },
        { status: 404 }
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REJECT — lepas reserve + tandai CANCELLED
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "reject") {
      if (production.status === "COMPLETED") {
        return NextResponse.json(
          {
            message:
              "Tidak bisa menolak production yang sudah COMPLETED.",
          },
          { status: 400 }
        );
      }

      const canReject = [
        "Admin",
        "Supervisor",
        "Manager",
        "SuperAdmin",
      ].includes(role);
      if (!canReject) {
        return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Lepas soft-reserve jika ada
        await releaseSoftReserve(tx, id);

        const updated = await tx.production.update({
          where: { id },
          data: {
            status: "CANCELLED",
            rejectedBy: approver,
            rejectedAt: now,
            rejectedNotes: notes || "",
            isReserved: false,
          },
        });

        await tx.history.create({
          data: {
            action: "PRODUCTION_REJECTED",
            item: production.productName,
            category: "Production",
            type: "STOCKS",
            quantity: production.targetQty,
            unit: production.targetUnit || "UNIT",
            user: approver,
            referenceId: id,
            notes: `Batch ${production.noBatch} ditolak oleh ${approver}. Alasan: ${notes || "-"}`,
          },
        });

        return updated;
      });

      return NextResponse.json({
        message: `Batch ${production.noBatch} ditolak. Reserve stok dilepas.`,
        production: result,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 1 — QC Produksi: PENDING_QC_PROD → PENDING_ADMIN
    //   + softReserveBatches() agar stok tidak diambil produksi lain
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "qc") {
      if (production.status !== "PENDING_QC_PROD") {
        return NextResponse.json(
          {
            message: `Status harus PENDING_QC_PROD. Saat ini: ${production.status}`,
          },
          { status: 400 }
        );
      }

      if (!["Supervisor", "SuperAdmin"].includes(role)) {
        return NextResponse.json(
          {
            message:
              "Hanya Supervisor / Super Admin yang bisa approve tahap QC.",
          },
          { status: 403 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Soft-reserve semua batch yang dialokasikan
        let reserveResult = { reserved: false, details: [] };
        try {
          reserveResult = await softReserveBatches(tx, id, approver);
        } catch (reserveErr) {
          // Jika reserve gagal (misal stok berubah), throw agar tx rollback
          throw new Error(`Soft-reserve gagal: ${reserveErr.message}`);
        }

        const updated = await tx.production.update({
          where: { id },
          data: {
            status: "PENDING_ADMIN",
            qcApprovedBy: approver,
            qcApprovedAt: now,
            qcNotes: notes || "",
            isReserved: reserveResult.reserved,
            reservedAt: reserveResult.reserved ? now : null,
            reservedBy: reserveResult.reserved ? approver : null,
          },
        });

        await tx.history.create({
          data: {
            action: "PRODUCTION_QC_APPROVED",
            item: production.productName,
            category: "Production",
            type: "STOCKS",
            quantity: production.targetQty,
            unit: production.targetUnit || "UNIT",
            user: approver,
            referenceId: id,
            notes: `QC approved oleh ${approver}. Soft-reserve: ${reserveResult.details.length} batch dicadangkan.`,
          },
        });

        return { production: updated, reserveResult };
      });

      return NextResponse.json({
        message: `QC selesai. Batch ${production.noBatch} menunggu Admin. ${result.reserveResult.details.length} batch di-reserve.`,
        production: result.production,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 2 — ADMIN: PENDING_ADMIN → PENDING_SUPERVISOR
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "admin") {
      if (production.status !== "PENDING_ADMIN") {
        return NextResponse.json(
          {
            message: `Status harus PENDING_ADMIN. Saat ini: ${production.status}`,
          },
          { status: 400 }
        );
      }

      if (role !== "Admin" && role !== "SuperAdmin") {
        return NextResponse.json(
          {
            message:
              "Tahap Admin hanya bisa di-approve oleh Admin atau Super Admin.",
          },
          { status: 403 }
        );
      }

      const updated = await prisma.production.update({
        where: { id },
        data: {
          status: "PENDING_SUPERVISOR",
          adminApprovedBy: approver,
          adminApprovedAt: now,
          adminNotes: notes || "",
        },
      });

      await prisma.history.create({
        data: {
          action: "PRODUCTION_ADMIN_APPROVED",
          item: production.productName,
          category: "Production",
          type: "STOCKS",
          quantity: production.targetQty,
          unit: production.targetUnit || "UNIT",
          user: approver,
          referenceId: id,
          notes: `Admin approved oleh ${approver}. Batch ${production.noBatch} menunggu Supervisor.`,
        },
      });

      return NextResponse.json({
        message: `Admin selesai. Batch ${production.noBatch} menunggu Supervisor.`,
        production: updated,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 3 — SUPERVISOR: PENDING_SUPERVISOR → PENDING_MANAGER
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "supervisor") {
      if (production.status !== "PENDING_SUPERVISOR") {
        return NextResponse.json(
          {
            message: `Status harus PENDING_SUPERVISOR. Saat ini: ${production.status}`,
          },
          { status: 400 }
        );
      }

      if (!["Supervisor", "SuperAdmin"].includes(role)) {
        return NextResponse.json(
          {
            message:
              "Hanya Supervisor / Super Admin yang bisa approve tahap ini.",
          },
          { status: 403 }
        );
      }

      const updated = await prisma.production.update({
        where: { id },
        data: {
          status: "PENDING_MANAGER",
          supervisorApprovedBy: approver,
          supervisorApprovedAt: now,
          supervisorNotes: notes || "",
        },
      });

      await prisma.history.create({
        data: {
          action: "PRODUCTION_SUPERVISOR_APPROVED",
          item: production.productName,
          category: "Production",
          type: "STOCKS",
          quantity: production.targetQty,
          unit: production.targetUnit || "UNIT",
          user: approver,
          referenceId: id,
          notes: `Supervisor approved oleh ${approver}. Batch ${production.noBatch} menunggu Manager.`,
        },
      });

      return NextResponse.json({
        message: `Supervisor selesai. Batch ${production.noBatch} menunggu Manager.`,
        production: updated,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 4 — MANAGER (FINAL): Deduct permanen + buat output batch
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "manager") {
      if (production.status !== "PENDING_MANAGER") {
        return NextResponse.json(
          {
            message: `Status harus PENDING_MANAGER. Saat ini: ${production.status}`,
          },
          { status: 400 }
        );
      }

      if (!["Manager", "SuperAdmin"].includes(role)) {
        return NextResponse.json(
          {
            message:
              "Hanya Manager / Super Admin yang bisa final approve.",
          },
          { status: 403 }
        );
      }

      if (!warehouseId) {
        return NextResponse.json(
          {
            message:
              "Gudang tujuan (warehouseId) wajib dipilih oleh Manager.",
          },
          { status: 400 }
        );
      }

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse) {
        return NextResponse.json(
          { message: "Warehouse tidak ditemukan." },
          { status: 404 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Deduct permanen dari batch (sekaligus lepas reserve)
        const {
          totalCost,
          hppPerUnit,
          deductedItems,
        } = await deductReservedBatches(tx, id, approver, production.noBatch);

        // 2. Hitung rendemen aktual
        const totalInput =
          production.components.reduce((s, c) => s + c.qtyNeeded, 0) || 1;
        const rendemenAkt = (production.targetQty / totalInput) * 100;
        const lossWarn = rendemenAkt < 95;

        // 3. Buat batch output barang jadi
        const outputBatch = await createBatch(
          tx,
          production.productName,
          warehouseId,
          production.targetQty,
          production.targetUnit || "UNIT",
          {
            category: "FINISHED_GOODS",
            type: "STOCKS",
            price: String(hppPerUnit),
            condition: "GOOD",
            supplierName: "PRODUKSI INTERNAL",
            noPO: production.noBatch,
            notes: `Output produksi ${production.noBatch} | HPP: Rp ${hppPerUnit.toLocaleString("id-ID")}/unit`,
          }
        );

        // 4. Sync tabel Stock barang jadi
        await syncStockFromBatches(tx, production.productName, warehouseId);

        // 5. Update Production → COMPLETED
        const updated = await tx.production.update({
          where: { id },
          data: {
            status: "COMPLETED",
            actualQty: production.targetQty,
            endDate: now,
            warehouseId,
            managerApprovedBy: approver,
            managerApprovedAt: now,
            managerNotes: notes || "",
            totalCost,
            unitCost: totalCost / (production.targetQty || 1),
            hpp: hppPerUnit,
            rendemen: rendemenAkt,
            lossWarning: lossWarn,
            isReserved: false,
          },
          include: {
            components: true,
            warehouse: { select: { id: true, name: true } },
          },
        });

        // 6. History final
        await tx.history.create({
          data: {
            action: "PRODUCTION_COMPLETED",
            item: production.productName,
            category: "FINISHED_GOODS",
            type: "STOCKS",
            quantity: production.targetQty,
            unit: production.targetUnit || "UNIT",
            user: approver,
            referenceId: id,
            batchId: outputBatch.id,
            notes: [
              `Batch ${production.noBatch} COMPLETED oleh Manager ${approver}`,
              `HPP Final: Rp ${hppPerUnit.toLocaleString("id-ID")}/unit`,
              `Total Biaya: Rp ${totalCost.toLocaleString("id-ID")}`,
              `Gudang Tujuan: ${warehouse.name}`,
              `Rendemen: ${rendemenAkt.toFixed(1)}%`,
              `Output Batch: ${outputBatch.batchNo}`,
            ].join(" | "),
          },
        });

        return {
          production: updated,
          outputBatch,
          hppPerUnit,
          rendemenAkt,
          totalCost,
          deductedItems,
        };
      });

      return NextResponse.json({
        message: [
          `Batch ${production.noBatch} COMPLETED.`,
          `HPP: Rp ${result.hppPerUnit.toLocaleString("id-ID")}/unit.`,
          `Output batch: ${result.outputBatch.batchNo} di gudang ${warehouse.name}.`,
          `Rendemen: ${result.rendemenAkt.toFixed(1)}%.`,
        ].join(" "),
        production: result.production,
        outputBatch: result.outputBatch,
        hppPerUnit: result.hppPerUnit,
        rendemenAkt: result.rendemenAkt,
        totalCost: result.totalCost,
        deductedItems: result.deductedItems,
      });
    }

    return NextResponse.json(
      {
        message:
          "Stage tidak dikenal. Gunakan: qc | admin | supervisor | manager | reject",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("PRODUCTION_APPROVE_ERROR:", err.message, err.stack);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}