// app/api/sttb/[id]/approve/route.js
// Multi-stage approval untuk STTB:
//   stage 1 (QC)         → sudah auto-diisi saat Arrival
//   stage 2 (Supervisor) → PATCH { stage: "supervisor", notes? }
//   stage 3 (Manager)    → PATCH { stage: "manager", warehouseId, notes? }
//                          → Stok dicatat ke Stock, Receipt.warehouseId diisi
//
// Reject kapan saja → PATCH { stage: "reject", notes }

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

    const { id }                 = await params;
    const { stage, warehouseId, notes } = await request.json();
    const approver               = session.user.name || session.user.email;
    const now                    = new Date();

    // ── Load STTB dengan relasi ───────────────────────────────────────────────
    const sttb = await prisma.sTTB.findUnique({
      where: { id },
      include: {
        receipt:    true,
        purchasing: true,
      },
    });
    if (!sttb) {
      return NextResponse.json({ message: "STTB tidak ditemukan" }, { status: 404 });
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (stage === "reject") {
      if (sttb.status === "APPROVED") {
        return NextResponse.json({ message: "STTB yang sudah APPROVED tidak bisa ditolak" }, { status: 400 });
      }
      const updated = await prisma.sTTB.update({
        where: { id },
        data:  {
          status:       "REJECTED",
          rejectedBy:   approver,
          rejectedAt:   now,
          rejectedNotes: notes || "",
        },
      });
      return NextResponse.json({ message: "STTB ditolak", sttb: updated });
    }

    // ── STAGE 2: SUPERVISOR ───────────────────────────────────────────────────
    if (stage === "supervisor") {
      if (sttb.status !== "PENDING_QC") {
        return NextResponse.json({
          message: `STTB harus berstatus PENDING_QC (sekarang: ${sttb.status})`,
        }, { status: 400 });
      }

      // Role check: hanya Supervisor atau Admin
      const allowed = ["Admin", "Supervisor"];
      if (!allowed.includes(session.user.role)) {
        return NextResponse.json({ message: "Hanya Supervisor/Admin yang bisa approval tahap ini" }, { status: 403 });
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
      return NextResponse.json({ message: "Approval Supervisor berhasil. Menunggu Manager.", sttb: updated });
    }

    // ── STAGE 3: MANAGER — FINAL, stok dicatat ────────────────────────────────
    if (stage === "manager") {
      if (sttb.status !== "PENDING_MANAGER") {
        return NextResponse.json({
          message: `STTB harus berstatus PENDING_MANAGER (sekarang: ${sttb.status})`,
        }, { status: 400 });
      }
      if (!warehouseId) {
        return NextResponse.json({ message: "warehouseId wajib diisi oleh Manager" }, { status: 400 });
      }

      // Role check: hanya Admin (acting as Manager) atau role Manager
      const allowed = ["Admin", "Manager"];
      if (!allowed.includes(session.user.role)) {
        return NextResponse.json({ message: "Hanya Manager/Admin yang bisa approval tahap akhir" }, { status: 403 });
      }

      // Cek warehouse valid
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) {
        return NextResponse.json({ message: "Warehouse tidak ditemukan" }, { status: 404 });
      }

      const purchase    = sttb.purchasing;
      const receipt     = sttb.receipt;
      const incomingQty = receipt.netWeight > 0 ? receipt.netWeight : receipt.receivedQty;
      const unitLabel   = purchase.unit || "Unit";

      // ── Transaksi final: update STTB + Stock + Receipt.warehouseId ──────────
      const result = await prisma.$transaction(async (tx) => {

        // Update STTB → APPROVED + stockCommitted
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

        // Isi warehouseId pada Receipt
        await tx.receipt.update({
          where: { id: receipt.id },
          data:  { warehouseId },
        });

        // Upsert Stock (unik per [name, warehouseId])
        const existing = await tx.stock.findUnique({
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

        // Catat history final
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
            notes:       `STTB: ${sttb.sttbNo} | Gudang: ${warehouse.name} | Final Approved by ${approver}`,
          },
        });

        return updatedSTTB;
      });

      return NextResponse.json({
        message: `STTB ${sttb.sttbNo} final approved. Stok ${purchase.item} +${incomingQty} ${unitLabel} di ${warehouse.name}.`,
        sttb:    result,
      });
    }

    return NextResponse.json({ message: "Stage tidak dikenal. Gunakan: supervisor | manager | reject" }, { status: 400 });

  } catch (error) {
    console.error("STTB_APPROVE_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
