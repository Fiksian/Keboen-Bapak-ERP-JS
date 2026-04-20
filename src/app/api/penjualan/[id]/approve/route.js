// app/api/penjualan/[id]/approve/route.js  — FIXED & OPTIMIZED
//
// BUG FIXES dari versi sebelumnya:
//   1. Stage "admin": if (["admin","SuperAdmin"].includes(stage)) — SALAH, seharusnya cek ROLE bukan stage
//   2. Response terlalu besar — kirim hanya field yang diperlukan UI
//   3. Prisma transaction scope: semua ops dalam $transaction untuk atomicity
//
// Alur:
//   sales      → PENDING_SALES → PENDING_ADMIN       | Sales/Admin/Supervisor/Manager/Super Admin
//   admin      → PENDING_ADMIN → PENDING_SUPERVISOR  | Admin SAJA
//   supervisor → PENDING_SUPERVISOR → PENDING_MANAGER | Supervisor/Super Admin
//   manager    → PENDING_MANAGER → COMPLETED (+ FIFO deduct + catat income)
//   reject     → CANCELLED

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductSalesBatches } from "@/lib/salesFifoService";

// ─── Auto-number TRX (di dalam transaksi) ────────────────────────────────────
const generateTrxNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `TRX-${dateStr}-`;
  const last    = await tx.transaction.findFirst({
    where:   { trxNo: { startsWith: prefix } },
    orderBy: { trxNo: "desc" },
    select:  { trxNo: true },          // lean: hanya ambil field yang dibutuhkan
  });
  const next = last ? parseInt(last.trxNo.split("-").pop()) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

// ─── Lean sale summary untuk response ────────────────────────────────────────
const leanSale = (s) => ({
  id:                   s.invoiceId,
  dbId:                 s.id,
  status:               s.status,
  saleType:             s.saleType || "REGULAR",
  totalAmount:          s.totalAmount,
  paymentMethod:        s.paymentMethod,
  paidAt:               s.paidAt,
  salesApprovedBy:      s.salesApprovedBy,
  salesApprovedAt:      s.salesApprovedAt,
  adminApprovedBy:      s.adminApprovedBy,
  adminApprovedAt:      s.adminApprovedAt,
  supervisorApprovedBy: s.supervisorApprovedBy,
  supervisorApprovedAt: s.supervisorApprovedAt,
  managerApprovedBy:    s.managerApprovedBy,
  managerApprovedAt:    s.managerApprovedAt,
  rejectedBy:           s.rejectedBy,
  rejectedNotes:        s.rejectedNotes,
  isStockDeducted:      s.isStockDeducted,
});

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id }           = await params;
    const { stage, notes } = await request.json();

    const approver = session.user.name  || session.user.email;
    const role     = session.user.role;
    const now      = new Date();

    // ── Load sale — lean select ───────────────────────────────────────────────
    const sale = await prisma.penjualan.findFirst({
      where:  { OR: [{ id }, { invoiceId: id }] },
      select: {
        id: true, invoiceId: true, status: true, saleType: true,
        totalAmount: true, paymentMethod: true, isStockDeducted: true,
        items: true,
        customer: { select: { name: true } },
        // approval stamps — needed for response
        salesApprovedBy: true, salesApprovedAt: true,
        adminApprovedBy: true, adminApprovedAt: true,
        supervisorApprovedBy: true, supervisorApprovedAt: true,
        managerApprovedBy: true, managerApprovedAt: true,
        rejectedBy: true, rejectedNotes: true, paidAt: true,
      },
    });

    if (!sale) return NextResponse.json({ message: "Penjualan tidak ditemukan." }, { status: 404 });

    if ((sale.saleType || "REGULAR") === "DIRECT") {
      return NextResponse.json({ message: "Penjualan DIRECT tidak memerlukan approval." }, { status: 400 });
    }

    if (["COMPLETED", "CANCELLED"].includes(sale.status) && stage !== "reject") {
      return NextResponse.json({ message: `Penjualan sudah ${sale.status}, tidak bisa diubah.` }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REJECT
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "reject") {
      if (sale.status === "COMPLETED") {
        return NextResponse.json({ message: "Tidak bisa menolak penjualan yang sudah COMPLETED." }, { status: 400 });
      }
      const CAN = ["Admin", "Sales", "Supervisor", "Manager", "SuperAdmin"];
      if (!CAN.includes(role)) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data:  { status: "CANCELLED", rejectedBy: approver, rejectedAt: now, rejectedNotes: notes || "" },
        select: { id: true, invoiceId: true, status: true, rejectedBy: true, rejectedNotes: true },
      });

      // History fire-and-forget (tidak blocking response)
      prisma.history.create({ data: {
        action: "SALES_REJECTED", item: sale.invoiceId, category: "Sales", type: "MONEY",
        quantity: sale.totalAmount, unit: "IDR", user: approver, referenceId: sale.id,
        notes: `Ditolak oleh ${approver}. Alasan: ${notes || "-"}`,
      }}).catch(console.error);

      return NextResponse.json({
        message:  `Invoice ${sale.invoiceId} ditolak.`,
        sale:     leanSale({ ...sale, ...updated }),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1 — Sales: PENDING_SALES → PENDING_ADMIN
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "sales") {
      if (sale.status !== "PENDING_SALES") {
        return NextResponse.json({ message: `Status harus PENDING_SALES. Saat ini: ${sale.status}` }, { status: 400 });
      }
      if (!["Sales", "Admin", "Supervisor", "Manager", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Akses ditolak untuk tahap Sales." }, { status: 403 });
      }
      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data:  { status: "PENDING_ADMIN", salesApprovedBy: approver, salesApprovedAt: now, salesNotes2: notes || "" },
        select: { id: true, invoiceId: true, status: true, salesApprovedBy: true, salesApprovedAt: true },
      });
      return NextResponse.json({
        message: `Sales approved. Invoice ${sale.invoiceId} menunggu Admin.`,
        sale:    leanSale({ ...sale, ...updated }),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2 — Admin: PENDING_ADMIN → PENDING_SUPERVISOR
    // BUG FIX: cek ROLE bukan stage string
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "admin") {
      if (sale.status !== "PENDING_ADMIN") {
        return NextResponse.json({ message: `Status harus PENDING_ADMIN. Saat ini: ${sale.status}` }, { status: 400 });
      }
      // FIX: dulu if (["admin","SuperAdmin"].includes(stage)) — salah banding stage vs role
      if (!["Admin", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Tahap Admin hanya untuk role 'Admin' atau 'SuperAdmin'." }, { status: 403 });
      }
      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data:  { status: "PENDING_SUPERVISOR", adminApprovedBy: approver, adminApprovedAt: now, adminNotes2: notes || "" },
        select: { id: true, invoiceId: true, status: true, adminApprovedBy: true, adminApprovedAt: true },
      });
      return NextResponse.json({
        message: `Admin approved. Invoice ${sale.invoiceId} menunggu Supervisor.`,
        sale:    leanSale({ ...sale, ...updated }),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3 — Supervisor: PENDING_SUPERVISOR → PENDING_MANAGER
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "supervisor") {
      if (sale.status !== "PENDING_SUPERVISOR") {
        return NextResponse.json({ message: `Status harus PENDING_SUPERVISOR. Saat ini: ${sale.status}` }, { status: 400 });
      }
      if (!["Supervisor", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Supervisor / Super Admin." }, { status: 403 });
      }
      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data:  { status: "PENDING_MANAGER", supervisorApprovedBy: approver, supervisorApprovedAt: now, supervisorNotes: notes || "" },
        select: { id: true, invoiceId: true, status: true, supervisorApprovedBy: true, supervisorApprovedAt: true },
      });
      return NextResponse.json({
        message: `Supervisor approved. Invoice ${sale.invoiceId} menunggu Manager.`,
        sale:    leanSale({ ...sale, ...updated }),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 4 — Manager: PENDING_MANAGER → COMPLETED
    //   Semua ops dalam satu $transaction untuk atomicity
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "manager") {
      if (sale.status !== "PENDING_MANAGER") {
        return NextResponse.json({ message: `Status harus PENDING_MANAGER. Saat ini: ${sale.status}` }, { status: 400 });
      }
      if (!["Manager", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Manager / Super Admin yang bisa final approve." }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // a. FIFO deduction (optimized — batch fetch dulu, baru loop)
        const { deductedItems, totalCost, marginTotal } = await deductSalesBatches(
          tx, sale.id, sale.invoiceId, approver
        );

        // b. Transaksi keuangan
        const trxNo = await generateTrxNo(tx);
        await tx.transaction.create({
          data: {
            trxNo,
            category:    "Penjualan",
            description: `${sale.invoiceId} — ${sale.customer?.name || "Umum"}`,
            amount:      sale.totalAmount,
            type:        "INCOME",
            date:        now,
            method:      sale.paymentMethod || "CASH",
            createdBy:   approver,
            referenceId: sale.id,
          },
        });

        // c. Update status — lean update
        const updated = await tx.penjualan.update({
          where: { id: sale.id },
          data:  {
            status:            "COMPLETED",
            managerApprovedBy: approver,
            managerApprovedAt: now,
            managerNotes:      notes || "",
            paidAt:            now,
          },
          select: {
            id: true, invoiceId: true, status: true,
            managerApprovedBy: true, managerApprovedAt: true,
            paidAt: true, isStockDeducted: true,
          },
        });

        // d. History (1 row untuk event COMPLETED)
        await tx.history.create({
          data: {
            action:      "SALES_COMPLETED",
            item:        sale.invoiceId,
            category:    "Sales",
            type:        "MONEY",
            quantity:    sale.totalAmount,
            unit:        "IDR",
            user:        approver,
            referenceId: sale.id,
            notes:       `COMPLETED | Revenue: Rp ${sale.totalAmount.toLocaleString("id-ID")} | HPP: Rp ${totalCost.toLocaleString("id-ID")} | Margin: Rp ${marginTotal.toLocaleString("id-ID")} | Trx: ${trxNo}`,
          },
        });

        return { updated, trxNo, totalCost, marginTotal, deductedItemCount: deductedItems.length };
      });

      return NextResponse.json({
        message: `Invoice ${sale.invoiceId} COMPLETED. Revenue: Rp ${sale.totalAmount.toLocaleString("id-ID")}. Margin: Rp ${result.marginTotal.toLocaleString("id-ID")}.`,
        sale:    leanSale({ ...sale, ...result.updated }),
        // Lean summary — jangan kirim entire deductedItems array (bisa besar)
        summary: {
          trxNo:            result.trxNo,
          totalCost:        result.totalCost,
          marginTotal:      result.marginTotal,
          deductedBatches:  result.deductedItemCount,
        },
      });
    }

    return NextResponse.json({
      message: "Stage tidak dikenal. Gunakan: sales | admin | supervisor | manager | reject",
    }, { status: 400 });

  } catch (err) {
    console.error("PENJUALAN_APPROVE_ERROR:", err.message, err.stack?.split("\n").slice(0, 5).join("\n"));
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}