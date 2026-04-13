// app/api/sttb/[id]/approve/route.js
//
// Alur Approval STTB (4 tahap):
//   Stage 1 — QC Penerimaan   : AUTO saat barang tiba di ArrivalMonitor
//   Stage 2 — Admin           : PATCH { stage: "admin", notes? }
//                               Role: "Admin | "SuperAdmin" 
//   Stage 3 — Supervisor      : PATCH { stage: "supervisor", notes? }
//                               Role: "Supervisor" | "Super Admin"
//   Stage 4 — Manager (Final) : PATCH { stage: "manager", warehouseId, notes? }
//                               Role: "Manager" | "Super Admin"
//                               → Stok dicatat, Receipt.warehouseId diisi
//
// Reject kapan saja            : PATCH { stage: "reject", notes }
//
// Status flow:
//   PENDING_QC → PENDING_ADMIN → PENDING_SUPERVISOR → PENDING_MANAGER → APPROVED
//   Setiap tahap bisa → REJECTED

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getAutoStatus = (qty) => {
  const q = parseFloat(qty) || 0;
  if (q <= 0)  return "EMPTY";
  if (q <= 10) return "LIMITED";
  return "READY";
};

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id }                          = await params;
    const { stage, warehouseId, notes }   = await request.json();
    const approver                        = session.user.name || session.user.email;
    const role                            = session.user.role;
    const now                             = new Date();

    // ── Load STTB ─────────────────────────────────────────────────────────────
    const sttb = await prisma.sTTB.findUnique({
      where:   { id },
      include: { receipt: true, purchasing: true },
    });
    if (!sttb) {
      return NextResponse.json({ message: "STTB tidak ditemukan" }, { status: 404 });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REJECT — bisa dilakukan oleh siapapun yang punya akses kelola STTB
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "reject") {
      if (sttb.status === "APPROVED") {
        return NextResponse.json({ message: "STTB yang sudah APPROVED tidak bisa ditolak" }, { status: 400 });
      }
      if (sttb.status === "REJECTED") {
        return NextResponse.json({ message: "STTB sudah ditolak sebelumnya" }, { status: 400 });
      }

      const canReject = ["Admin", "Supervisor", "Manager", "SuperAdmin"].includes(role);
      if (!canReject) {
        return NextResponse.json({ message: "Tidak punya akses untuk menolak STTB" }, { status: 403 });
      }

      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:        "REJECTED",
          rejectedBy:    approver,
          rejectedAt:    now,
          rejectedNotes: notes || "",
        },
      });

      return NextResponse.json({ message: `STTB ${sttb.sttbNo} ditolak.`, sttb: updated });
    }

    if (stage === "admin") {
      if (sttb.status !== "PENDING_QC") {
        return NextResponse.json({
          message: `STTB harus berstatus PENDING_QC untuk approval Admin. Status saat ini: ${sttb.status}`,
        }, { status: 400 });
      }

      if (!["Supervisor", "SuperAdmin"].includes(role)) {
        return NextResponse.json({
          message: "Tahap Admin hanya bisa di-approve oleh pengguna dengan role 'Admin'.",
        }, { status: 403 });
      }

      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:          "PENDING_SUPERVISOR",
          adminApprovedBy: approver,
          adminApprovedAt: now,
          adminNotes:      notes || "",
        },
        include: { receipt: true, purchasing: true, warehouse: true },
      });

      return NextResponse.json({
        message: `Approval Admin selesai. STTB ${sttb.sttbNo} menunggu Supervisor.`,
        sttb:    updated,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 3 — SUPERVISOR
    // Syarat: status PENDING_SUPERVISOR, role "Supervisor" atau "Super Admin"
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "supervisor") {
      if (sttb.status !== "PENDING_SUPERVISOR") {
        return NextResponse.json({
          message: `STTB harus berstatus PENDING_SUPERVISOR. Status saat ini: ${sttb.status}`,
        }, { status: 400 });
      }

      if (!["Supervisor", "SuperAdmin"].includes(role)) {
        return NextResponse.json({
          message: "Tahap Supervisor hanya bisa di-approve oleh Supervisor atau Super Admin.",
        }, { status: 403 });
      }

      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:              "PENDING_MANAGER",
          supervisorApprovedBy: approver,
          supervisorApprovedAt: now,
          supervisorNotes:      notes || "",
        },
        include: { receipt: true, purchasing: true, warehouse: true },
      });

      return NextResponse.json({
        message: `Approval Supervisor selesai. STTB ${sttb.sttbNo} menunggu Manager.`,
        sttb:    updated,
      });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STAGE 4 — MANAGER (Final) → Stok dicatat
    // Syarat: status PENDING_MANAGER, role "Manager" atau "Super Admin"
    // warehouseId WAJIB diisi
    // ═════════════════════════════════════════════════════════════════════════
    if (stage === "manager") {
      if (sttb.status !== "PENDING_MANAGER") {
        return NextResponse.json({
          message: `STTB harus berstatus PENDING_MANAGER. Status saat ini: ${sttb.status}`,
        }, { status: 400 });
      }

      if (!["Manager", "SuperAdmin"].includes(role)) {
        return NextResponse.json({
          message: "Tahap Manager hanya bisa di-approve oleh Manager atau Super Admin.",
        }, { status: 403 });
      }

      if (!warehouseId) {
        return NextResponse.json({ message: "Gudang tujuan (warehouseId) wajib diisi oleh Manager." }, { status: 400 });
      }

      // Cek warehouse
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) {
        return NextResponse.json({ message: "Warehouse tidak ditemukan." }, { status: 404 });
      }

      const purchase    = sttb.purchasing;
      const receipt     = sttb.receipt;
      const incomingQty = receipt.netWeight > 0 ? receipt.netWeight : receipt.receivedQty;
      const unitLabel   = purchase.unit || "Unit";

      // ── Transaksi final ─────────────────────────────────────────────────────
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
          include: { receipt: true, purchasing: true, warehouse: true },
        });

        // 2. Isi warehouseId pada Receipt
        await tx.receipt.update({
          where: { id: receipt.id },
          data:  { warehouseId },
        });

        // 3. Upsert Stock — unique per [name, warehouseId]
        const existing   = await tx.stock.findUnique({
          where: { name_warehouseId: { name: purchase.item, warehouseId } },
        });
        const currentQty = existing?.stock || 0;
        const finalQty   = currentQty + incomingQty;

        await tx.stock.upsert({
          where:  { name_warehouseId: { name: purchase.item, warehouseId } },
          update: {
            stock:           finalQty,
            status:          getAutoStatus(finalQty),
            price:           purchase.price,
            type:            purchase.type,
            lastPurchasedId: purchase.id,
            updatedAt:       now,
          },
          create: {
            name:            purchase.item,
            category:        purchase.category || "General",
            stock:           finalQty,
            unit:            unitLabel,
            type:            purchase.type || "STOCKS",
            price:           purchase.price,
            status:          getAutoStatus(finalQty),
            lastPurchasedId: purchase.id,
            warehouseId,
          },
        });

        // 4. Catat History
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
            notes:       `STTB: ${sttb.sttbNo} | Gudang: ${warehouse.name} | Final Approved (4-stage) oleh ${approver}`,
          },
        });

        return updatedSTTB;
      });

      return NextResponse.json({
        message: `STTB ${sttb.sttbNo} final approved. Stok ${purchase.item} +${incomingQty} ${unitLabel} di ${warehouse.name}.`,
        sttb:    result,
      });
    }

    return NextResponse.json({
      message: "Stage tidak dikenal. Gunakan: admin | supervisor | manager | reject",
    }, { status: 400 });

  } catch (error) {
    console.error("STTB_APPROVE_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}