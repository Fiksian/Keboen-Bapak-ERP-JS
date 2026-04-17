// app/api/penjualan/[id]/approve/route.js
//
// 4-stage approval untuk penjualan REGULAR:
//   stage: "sales"      → PENDING_SALES → PENDING_ADMIN       | Sales, Admin, Supervisor, Super Admin
//   stage: "admin"      → PENDING_ADMIN → PENDING_SUPERVISOR  | Admin SAJA
//   stage: "supervisor" → PENDING_SUPERVISOR → PENDING_MANAGER | Supervisor, Super Admin
//   stage: "manager"    → PENDING_MANAGER → COMPLETED          | Manager, Super Admin
//                         + deductSalesBatches() (FIFO potong)
//                         + catat Transaction keuangan
//   stage: "reject"     → CANCELLED                            | semua kecuali Staff

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductSalesBatches } from "@/lib/salesFifoService";

const generateTrxNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `TRX-${dateStr}-`;
  const last    = await tx.transaction.findFirst({
    where:   { trxNo: { startsWith: prefix } },
    orderBy: { trxNo: "desc" },
  });
  const next = last ? parseInt(last.trxNo.split("-").pop()) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id }   = await params;
    const body     = await request.json();
    const { stage, notes } = body;

    const approver = session.user.name || session.user.email;
    const role     = session.user.role;
    const now      = new Date();

    // Cari berdasarkan dbId (cuid) atau invoiceId
    const sale = await prisma.penjualan.findFirst({
      where: { OR: [{ id }, { invoiceId: id }] },
      include: { items: true, customer: { select: { name: true } } },
    });

    if (!sale) return NextResponse.json({ message: "Penjualan tidak ditemukan." }, { status: 404 });

    if (sale.saleType === "DIRECT") {
      return NextResponse.json({ message: "Penjualan DIRECT tidak memerlukan approval." }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REJECT
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "reject") {
      if (sale.status === "COMPLETED") {
        return NextResponse.json({ message: "Tidak bisa menolak penjualan yang sudah COMPLETED." }, { status: 400 });
      }
      const canReject = ["Admin", "Sales", "Supervisor", "Manager", "SuperAdmin"].includes(role);
      if (!canReject) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.penjualan.update({
          where: { id: sale.id },
          data: {
            status:       "CANCELLED",
            rejectedBy:   approver,
            rejectedAt:   now,
            rejectedNotes: notes || "",
          },
        });
        await tx.history.create({
          data: {
            action:      "SALES_REJECTED",
            item:        sale.invoiceId,
            category:    "Sales",
            type:        "MONEY",
            quantity:    sale.totalAmount,
            unit:        "IDR",
            user:        approver,
            referenceId: sale.id,
            notes:       `Invoice ${sale.invoiceId} ditolak oleh ${approver}. Alasan: ${notes || "-"}`,
          },
        });
        return u;
      });
      return NextResponse.json({ message: `Invoice ${sale.invoiceId} ditolak.`, sale: updated });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1 — Sales
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "sales") {
      if (sale.status !== "PENDING_SALES") {
        return NextResponse.json({ message: `Status harus PENDING_SALES. Saat ini: ${sale.status}` }, { status: 400 });
      }
      const canApprove = ["Sales", "Admin", "Supervisor", "Manager", "SuperAdmin"].includes(role);
      if (!canApprove) return NextResponse.json({ message: "Akses ditolak untuk tahap Sales." }, { status: 403 });

      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data: {
          status:          "PENDING_ADMIN",
          salesApprovedBy: approver,
          salesApprovedAt: now,
          salesNotes2:     notes || "",
        },
      });
      return NextResponse.json({
        message: `Sales approved. Invoice ${sale.invoiceId} menunggu Admin.`,
        sale: updated,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2 — Admin
    // ═══════════════════════════════════════════════════════════════════════
    if (["admin", "SuperAdmin"].includes(stage)) {
      if (sale.status !== "PENDING_ADMIN") {
        return NextResponse.json({ message: `Status harus PENDING_ADMIN. Saat ini: ${sale.status}` }, { status: 400 });
      }
      if (!["admin", "SuperAdmin"].includes(stage)) {
        return NextResponse.json({ message: "Tahap Admin hanya untuk role 'Admin'." }, { status: 403 });
      }
      const updated = await prisma.penjualan.update({
        where: { id: sale.id },
        data: {
          status:          "PENDING_SUPERVISOR",
          adminApprovedBy: approver,
          adminApprovedAt: now,
          adminNotes2:     notes || "",
        },
      });
      return NextResponse.json({
        message: `Admin approved. Invoice ${sale.invoiceId} menunggu Supervisor.`,
        sale: updated,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3 — Supervisor
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
        data: {
          status:              "PENDING_MANAGER",
          supervisorApprovedBy: approver,
          supervisorApprovedAt: now,
          supervisorNotes:      notes || "",
        },
      });
      return NextResponse.json({
        message: `Supervisor approved. Invoice ${sale.invoiceId} menunggu Manager.`,
        sale: updated,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 4 — Manager (FINAL): FIFO deduction + catat income
    // ═══════════════════════════════════════════════════════════════════════
    if (stage === "manager") {
      if (sale.status !== "PENDING_MANAGER") {
        return NextResponse.json({ message: `Status harus PENDING_MANAGER. Saat ini: ${sale.status}` }, { status: 400 });
      }
      if (!["Manager", "SuperAdmin"].includes(role)) {
        return NextResponse.json({ message: "Hanya Manager / Super Admin yang bisa final approve." }, { status: 403 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Deduct FIFO
        const { deductedItems, totalCost, marginTotal } = await deductSalesBatches(
          tx, sale.id, sale.invoiceId, approver
        );

        // 2. Catat transaksi keuangan
        const trxNo = await generateTrxNo(tx);
        await tx.transaction.create({
          data: {
            trxNo,
            category:    "Penjualan",
            description: `Invoice ${sale.invoiceId} — ${sale.customer?.name || "Pelanggan Umum"}`,
            amount:      sale.totalAmount,
            type:        "INCOME",
            date:        now,
            method:      sale.paymentMethod || "CASH",
            createdBy:   approver,
            referenceId: sale.id,
          },
        });

        // 3. Update Penjualan → COMPLETED
        const updated = await tx.penjualan.update({
          where: { id: sale.id },
          data: {
            status:           "COMPLETED",
            managerApprovedBy: approver,
            managerApprovedAt: now,
            managerNotes:     notes || "",
            paidAt:           now,
          },
          include: { items: true, customer: { select: { name: true } } },
        });

        // 4. History final
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
            notes: [
              `Invoice ${sale.invoiceId} COMPLETED`,
              `Revenue: Rp ${sale.totalAmount.toLocaleString("id-ID")}`,
              `HPP: Rp ${totalCost.toLocaleString("id-ID")}`,
              `Margin: Rp ${marginTotal.toLocaleString("id-ID")}`,
              `Batch: ${deductedItems.map(d => d.batchNo).join(", ")}`,
              `Trx: ${trxNo}`,
            ].join(" | "),
          },
        });

        return { sale: updated, deductedItems, totalCost, marginTotal, trxNo };
      });

      return NextResponse.json({
        message: [
          `Invoice ${sale.invoiceId} COMPLETED.`,
          `Revenue: Rp ${sale.totalAmount.toLocaleString("id-ID")}.`,
          `HPP aktual: Rp ${result.totalCost.toLocaleString("id-ID")}.`,
          `Margin: Rp ${result.marginTotal.toLocaleString("id-ID")}.`,
        ].join(" "),
        ...result,
      });
    }

    return NextResponse.json({
      message: "Stage tidak dikenal. Gunakan: sales | admin | supervisor | manager | reject",
    }, { status: 400 });

  } catch (err) {
    console.error("PENJUALAN_APPROVE_ERROR:", err.message, err.stack);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}