// app/api/sttb/[id]/approve/route.js
//
// Alur Approval STTB (4 tahap) — mendukung STTB Barang & STTB Sapi:
//
//   Stage 1 — QC       : AUTO saat arrival
//   Stage 2 — Admin    : PATCH { stage: "admin", notes? }
//                        Role: "Admin" | "Super Admin"
//   Stage 3 — Supervisor: PATCH { stage: "supervisor", notes? }
//                        Role: "Supervisor" | "Super Admin"
//   Stage 4 — Manager  : PATCH { stage: "manager", warehouseId, notes? }
//                        Role: "Manager" | "Super Admin"
//                        ── BARANG: createBatch + syncStockFromBatches
//                        ── SAPI  : createCattleBatch + update CattleInventory status
//   Reject kapan saja  : PATCH { stage: "reject", notes }

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createBatch, syncStockFromBatches } from "@/lib/fifoService";
import { createCattleBatch } from "@/lib/cattleService";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id }                        = await params;
    const { stage, warehouseId, notes } = await request.json();
    const approver  = session.user.name || session.user.email;
    const role      = session.user.role;
    const now       = new Date();

    // ── Load STTB ──────────────────────────────────────────────────────────────
    const sttb = await prisma.sTTB.findUnique({
      where:   { id },
      include: {
        receipt:   true,
        purchasing: true,
        cattlePO: {
          include: { items: true },
        },
      },
    });
    if (!sttb) {
      return NextResponse.json({ message: "STTB tidak ditemukan" }, { status: 404 });
    }

    const isCattle = !!sttb.isCattle;

    // ── REJECT ─────────────────────────────────────────────────────────────────
    if (stage === "reject") {
      if (["APPROVED", "REJECTED"].includes(sttb.status)) {
        return NextResponse.json({ message: `STTB sudah ${sttb.status}, tidak bisa ditolak.` }, { status: 400 });
      }
      const CAN_REJECT = ["Admin", "Supervisor", "Manager", "Super Admin", "SuperAdmin"];
      if (!CAN_REJECT.includes(role)) {
        return NextResponse.json({ message: "Tidak punya akses untuk menolak STTB." }, { status: 403 });
      }
      const updated = await prisma.sTTB.update({
        where: { id },
        data:  { status: "REJECTED", rejectedBy: approver, rejectedAt: now, rejectedNotes: notes || "" },
      });
      return NextResponse.json({
        message: `STTB ${sttb.sttbNo} ditolak.`,
        sttb: updated,
      });
    }

    // ── ADMIN ──────────────────────────────────────────────────────────────────
    if (stage === "admin") {
      if (sttb.status !== "PENDING_QC") {
        return NextResponse.json({ message: `Status harus PENDING_QC. Saat ini: ${sttb.status}` }, { status: 400 });
      }
      if (!["Admin", "Super Admin", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Admin / Super Admin." }, { status: 403 });
      }
      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:          "PENDING_SUPERVISOR",
          adminApprovedBy: approver,
          adminApprovedAt: now,
          adminNotes:      notes || "",
        },
        include: { receipt: true, purchasing: true, warehouse: true, cattlePO: true },
      });
      return NextResponse.json({
        message: `Admin selesai. STTB ${sttb.sttbNo} menunggu Supervisor.`,
        sttb: updated,
      });
    }

    // ── SUPERVISOR ─────────────────────────────────────────────────────────────
    if (stage === "supervisor") {
      if (sttb.status !== "PENDING_SUPERVISOR") {
        return NextResponse.json({ message: `Status harus PENDING_SUPERVISOR. Saat ini: ${sttb.status}` }, { status: 400 });
      }
      if (!["Supervisor", "Super Admin", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Supervisor / Super Admin." }, { status: 403 });
      }
      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:              "PENDING_MANAGER",
          supervisorApprovedBy: approver,
          supervisorApprovedAt: now,
          supervisorNotes:      notes || "",
        },
        include: { receipt: true, purchasing: true, warehouse: true, cattlePO: true },
      });
      return NextResponse.json({
        message: `Supervisor selesai. STTB ${sttb.sttbNo} menunggu Manager.`,
        sttb: updated,
      });
    }

    // ── MANAGER (Final) ────────────────────────────────────────────────────────
    if (stage === "manager") {
      if (sttb.status !== "PENDING_MANAGER") {
        return NextResponse.json({ message: `Status harus PENDING_MANAGER. Saat ini: ${sttb.status}` }, { status: 400 });
      }
      if (!["Manager", "Super Admin", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Manager / Super Admin." }, { status: 403 });
      }
      if (!warehouseId) {
        return NextResponse.json({ message: "Gudang tujuan wajib dipilih oleh Manager." }, { status: 400 });
      }
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) {
        return NextResponse.json({ message: "Warehouse tidak ditemukan." }, { status: 404 });
      }

      // ── Branch: SAPI ──────────────────────────────────────────────────────────
      if (isCattle) {
        const cattlePO   = sttb.cattlePO;
        if (!cattlePO) {
          return NextResponse.json({ message: "Data PO Sapi tidak ditemukan." }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
          // 1. Update STTB → APPROVED
          const updatedSTTB = await tx.sTTB.update({
            where: { id },
            data:  {
              status:            "APPROVED",
              managerApprovedBy: approver,
              managerApprovedAt: now,
              managerNotes:      notes || "",
              warehouseId,
              stockCommitted:    true,
              stockCommittedAt:  now,
            },
            include: { warehouse: true, cattlePO: true },
          });

          // 2. Buat CattleBatch (FIFO sapi)
          const hppAwalPerEkor = cattlePO.hppPerEkor || 0;
          const avgWeight      = sttb.beratHidupRata  || (
            sttb.beratHidupTotal && sttb.jumlahEkor
              ? sttb.beratHidupTotal / sttb.jumlahEkor
              : 0
          );

          const batch = await createCattleBatch(
            tx,
            cattlePO.id,
            warehouseId,
            sttb.jumlahEkor || 0,
            avgWeight,
            hppAwalPerEkor,
            {
              vendorName:   cattlePO.vendorName,
              noPO:         cattlePO.noPO,
              priceUSD:     cattlePO.pricePerHeadUSD || 0,
              exchangeRate: cattlePO.exchangeRate    || 0,
            }
          );

          // 3. Buat CattleInventory per ekor (jika jumlah ekor tersedia)
          //    RFID bisa di-assign nanti dari CattleArrival
          if (sttb.jumlahEkor > 0) {
            for (let i = 0; i < sttb.jumlahEkor; i++) {
              await tx.cattleInventory.create({
                data: {
                  arrivalId:      sttb.cattleArrivalId || batch.id,  // fallback ke batchId
                  batchId:        batch.id,
                  warehouseId,
                  weightPurchase: sttb.beratBeli        || 0,
                  weightReceived: avgWeight,
                  weightCurrent:  avgWeight,
                  susutKg:        sttb.susutKg          || 0,
                  susutPct:       sttb.susutPct          || 0,
                  hppAwal:        hppAwalPerEkor,
                  hppKumulatif:   hppAwalPerEkor,
                  status:         "QUARANTINE",
                },
              });
            }
          }

          // 4. Update CattlePurchasing → warehouseId
          await tx.cattlePurchasing.update({
            where: { id: cattlePO.id },
            data:  { warehouseId },
          });

          // 5. History
          await tx.history.create({
            data: {
              action:      "CATTLE_STTB_APPROVED",
              item:        `${sttb.jumlahEkor} ekor - ${cattlePO.vendorName}`,
              category:    "Cattle",
              type:        "LIVESTOCK",
              quantity:    sttb.jumlahEkor || 0,
              unit:        "EKOR",
              user:        approver,
              referenceId: updatedSTTB.id,
              notes: [
                `STTB ${sttb.sttbNo} APPROVED`,
                `Batch: ${batch.batchNo}`,
                `Gudang: ${warehouse.name}`,
                `${sttb.jumlahEkor} ekor / ${(sttb.beratHidupTotal||0).toFixed(1)} kg`,
                `Susut: ${(sttb.susutPct||0).toFixed(1)}%${sttb.susutAlert ? " ⚠" : ""}`,
                `HPP: Rp ${hppAwalPerEkor.toLocaleString("id-ID")}/ekor`,
              ].join(" | "),
            },
          });

          return { updatedSTTB, batch };
        });

        return NextResponse.json({
          message: [
            `STTB ${sttb.sttbNo} APPROVED.`,
            `${sttb.jumlahEkor} ekor masuk ke kandang ${warehouse.name}.`,
            `Batch: ${result.batch.batchNo}.`,
            sttb.susutAlert ? `⚠ Susut ${(sttb.susutPct||0).toFixed(1)}% melebihi batas!` : "",
          ].filter(Boolean).join(" "),
          sttb:  result.updatedSTTB,
          batch: result.batch,
        });
      }

      // ── Branch: BARANG BIASA (logika asli tidak berubah) ─────────────────────
      const purchase    = sttb.purchasing;
      const receipt     = sttb.receipt;
      const incomingQty = receipt.netWeight > 0 ? receipt.netWeight : receipt.receivedQty;
      const unitLabel   = purchase.unit || "Unit";

      const result = await prisma.$transaction(async (tx) => {
        const updatedSTTB = await tx.sTTB.update({
          where: { id },
          data:  {
            status:            "APPROVED",
            managerApprovedBy: approver,
            managerApprovedAt: now,
            managerNotes:      notes || "",
            warehouseId,
            stockCommitted:    true,
            stockCommittedAt:  now,
          },
          include: { receipt: true, purchasing: true, warehouse: true },
        });

        await tx.receipt.update({
          where: { id: receipt.id },
          data:  { warehouseId },
        });

        const newBatch = await createBatch(
          tx,
          purchase.item,
          warehouseId,
          incomingQty,
          unitLabel,
          {
            purchasingId: purchase.id,
            receiptId:    receipt.id,
            sttbId:       sttb.id,
            supplierName: purchase.supplier  || null,
            noPO:         purchase.noPO      || null,
            suratJalan:   receipt.suratJalan || null,
            category:     purchase.category  || "General",
            type:         purchase.type      || "STOCKS",
            price:        purchase.price     || null,
            condition:    receipt.condition  || "GOOD",
            notes:        `STTB: ${sttb.sttbNo} | Gudang: ${warehouse.name}`,
          }
        );

        await syncStockFromBatches(tx, purchase.item, warehouseId);

        await tx.history.create({
          data: {
            action:      "STOCK_IN",
            item:        purchase.item,
            category:    purchase.category || "General",
            type:        purchase.type     || "STOCKS",
            quantity:    incomingQty,
            unit:        unitLabel,
            user:        approver,
            referenceId: updatedSTTB.id,
            batchId:     newBatch.id,
            notes:       `STTB: ${sttb.sttbNo} | Batch: ${newBatch.batchNo} | Gudang: ${warehouse.name} | Supplier: ${purchase.supplier || "-"}`,
          },
        });

        return updatedSTTB;
      });

      return NextResponse.json({
        message: `STTB ${sttb.sttbNo} final approved. Stok ${purchase.item} +${incomingQty} ${unitLabel} di ${warehouse.name}.`,
        sttb: result,
      });
    }

    return NextResponse.json({
      message: "Stage tidak dikenal. Gunakan: admin | supervisor | manager | reject",
    }, { status: 400 });

  } catch (error) {
    console.error("STTB_APPROVE_ERROR:", error.message, error.stack?.split("\n")[1]);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
