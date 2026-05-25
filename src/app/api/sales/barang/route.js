// app/api/penjualan/route.js
//
// Status flow REGULAR : POST → PENDING_SALES → PENDING_ADMIN → PENDING_SUPERVISOR → PENDING_MANAGER → COMPLETED
//   Stock deduction terjadi saat Manager approve (di /api/penjualan/[id]/approve)
//
// Status flow DIRECT  : POST → COMPLETED (langsung)
//   Stock deduction terjadi di sini (POST), tanpa tahapan approval.
//   Untuk peternak kecil / penjualan cepat oleh admin.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductSalesBatches, computeSalesFIFO, validateSalesAllocation } from "@/lib/salesFifoService";

// ─── Auto-numbering ───────────────────────────────────────────────────────────
const generateInvoiceNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `INV/${dateStr}/`;
  const last    = await tx.penjualan.findFirst({
    where:   { invoiceId: { startsWith: prefix } },
    orderBy: { invoiceId: "desc" },
  });
  const next = last ? parseInt(last.invoiceId.split("/").pop()) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
};

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

// ─── Hitung totals ────────────────────────────────────────────────────────────
const calcTotals = (items, discountPct = 0, taxPct = 0, shippingCost = 0) => {
  const subtotal  = items.reduce((s, i) =>
    s + (parseFloat(i.quantity) * parseFloat(i.price) - (parseFloat(i.discount) || 0)), 0);
  const discount  = subtotal * (parseFloat(discountPct) / 100);
  const afterDisc = subtotal - discount;
  const taxAmount = afterDisc * (parseFloat(taxPct) / 100);
  const total     = afterDisc + taxAmount + parseFloat(shippingCost || 0);
  return { subtotal, discount, taxAmount, total };
};

// ─── Role checks ──────────────────────────────────────────────────────────────
const canCreateSale  = (role) => ["Admin", "Sales", "Supervisor", "Manager", "SuperAdmin"].includes(role);
const canDeleteSale  = (role) => ["Manager", "SuperAdmin"].includes(role);

// =============================================================================
// GET /api/penjualan
// =============================================================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status    = searchParams.get("status");
    const saleType  = searchParams.get("saleType");
    const from      = searchParams.get("from");
    const to        = searchParams.get("to");

    const where = {};
    if (status)   where.status   = status;
    if (saleType) where.saleType = saleType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    const sales = await prisma.penjualan.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        items:    true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = sales.map((s) => ({
      id:                   s.invoiceId,
      dbId:                 s.id,
      saleType:             s.saleType     || "REGULAR",
      customer:             s.customer?.name || "Pelanggan Umum",
      customerAddress:      s.customer?.address || "",
      customerPhone:        s.customer?.phone   || "",
      date:                 s.createdAt?.toISOString().split("T")[0] || "-",
      createdAt:            s.createdAt,
      total:                s.totalAmount || 0,
      subtotal:             s.subtotal    || 0,
      discount:             s.discount    || 0,
      discountPct:          s.discountPct || 0,
      taxPct:               s.taxPct      || 0,
      taxAmount:            s.taxAmount   || 0,
      shippingCost:         s.shippingCost || 0,
      paymentMethod:        s.paymentMethod || "CASH",
      status:               s.status,
      isStockDeducted:      s.isStockDeducted || false,
      paidAt:               s.paidAt,
      dueDate:              s.dueDate,
      notes:                s.notes       || "",
      salesNotes:           s.salesNotes  || "",
      deliveryAddress:      s.deliveryAddress || "",
      createdBy:            s.createdBy   || "",
      salesApprovedBy:      s.salesApprovedBy || null,
      adminApprovedBy:      s.adminApprovedBy || null,
      supervisorApprovedBy: s.supervisorApprovedBy || null,
      managerApprovedBy:    s.managerApprovedBy    || null,
      rejectedBy:           s.rejectedBy    || null,
      rejectedNotes:        s.rejectedNotes || null,
      itemCount:            s.items?.length || 0,
      items: s.items?.map((i) => ({
        id:          i.id,
        productName: i.productName,
        quantity:    i.quantity,
        price:       i.price,
        discount:    i.discount   || 0,
        subtotal:    i.subtotal   || i.quantity * i.price,
        unit:        i.unit       || "Unit",
        notes:       i.notes      || "",
        warehouseId: i.warehouseId || null,
        unitCost:    i.unitCost   || 0,
        totalCost:   i.totalCost  || 0,
        margin:      i.margin     || 0,
        batchAllocation: (() => {
          try { return JSON.parse(i.batchAllocation || "[]"); }
          catch { return []; }
        })(),
      })) || [],
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET_PENJUALAN:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// =============================================================================
// POST /api/penjualan
//
// Body:
//   saleType      : "REGULAR" (default) | "DIRECT"
//   customerId    : string?
//   items[]       : [{ name, quantity, price, unit, discount?, notes?,
//                      warehouseId?, batchAllocation? }]
//   discountPct   : number
//   taxPct        : number
//   shippingCost  : number
//   paymentMethod : string
//   dueDate       : string?
//   notes         : string?
//   salesNotes    : string?
//   deliveryAddress: string?
//
// REGULAR → status: PENDING_SALES, stok belum dipotong
// DIRECT  → status: COMPLETED, stok langsung dipotong (FIFO)
// =============================================================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!canCreateSale(session.user.role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const {
      saleType = "REGULAR",
      customerId, items = [],
      discountPct = 0, taxPct = 0, shippingCost = 0,
      paymentMethod = "CASH", dueDate,
      notes, salesNotes, deliveryAddress,
      quotationId,
    } = body;

    const currentUser = session.user.name || session.user.email || "System";

    if (!items.length) {
      return NextResponse.json({ message: "Minimal satu item harus diisi." }, { status: 400 });
    }

    // ── Validasi & auto-FIFO per item (sebelum transaksi) ────────────────────
    const itemsWithAlloc = [];
    for (const item of items) {
      const qty  = parseFloat(item.quantity) || 0;
      const whId = item.warehouseId || null;

      let alloc = Array.isArray(item.batchAllocation) ? item.batchAllocation : [];

      // Jika tidak ada alokasi manual → Auto-FIFO
      if (!alloc.length) {
        const fifo = await computeSalesFIFO(item.name, whId, qty);
        if (!fifo.success) {
          return NextResponse.json({ message: fifo.message }, { status: 400 });
        }
        alloc = fifo.allocations;
      } else {
        // Validasi alokasi manual
        const v = await validateSalesAllocation(item.name, alloc, qty);
        if (!v.valid) {
          return NextResponse.json({ message: v.errors.join("; ") }, { status: 400 });
        }
        alloc = v.allocations;
      }

      // Hitung HPP estimasi dari alokasi
      const totalCost = alloc.reduce((s, a) => s + (parseFloat(a.price) || 0) * parseFloat(a.qty), 0);
      const unitCost  = qty > 0 ? totalCost / qty : 0;

      itemsWithAlloc.push({ ...item, batchAllocation: alloc, unitCost, totalCost });
    }

    const { subtotal, discount, taxAmount, total } = calcTotals(items, discountPct, taxPct, shippingCost);
    const isDirect = saleType === "DIRECT";

    const result = await prisma.$transaction(async (tx) => {
      const invoiceId = await generateInvoiceNo(tx);

      // Buat record Penjualan
      const sale = await tx.penjualan.create({
        data: {
          invoiceId,
          saleType:       isDirect ? "DIRECT" : "REGULAR",
          status:         isDirect ? "COMPLETED" : "PENDING_SALES",
          totalAmount:    total,
          subtotal,
          discount,
          discountPct:    parseFloat(discountPct),
          taxPct:         parseFloat(taxPct),
          taxAmount,
          shippingCost:   parseFloat(shippingCost),
          paymentMethod,
          dueDate:        dueDate ? new Date(dueDate) : null,
          notes:          notes           || null,
          salesNotes:     salesNotes      || null,
          deliveryAddress: deliveryAddress || null,
          createdBy:      currentUser,
          quotationId:    quotationId     || null,
          isStockDeducted: false,
          ...(customerId ? { customerId } : {}),
          items: {
            create: itemsWithAlloc.map((item) => ({
              productName:     item.name,
              quantity:        parseFloat(item.quantity),
              unit:            item.unit     || "Unit",
              price:           parseFloat(item.price),
              discount:        parseFloat(item.discount) || 0,
              subtotal:        parseFloat(item.quantity) * parseFloat(item.price) - (parseFloat(item.discount) || 0),
              notes:           item.notes    || null,
              warehouseId:     item.warehouseId || null,
              batchAllocation: JSON.stringify(item.batchAllocation),
              unitCost:        item.unitCost,
              totalCost:       item.totalCost,
              margin:          parseFloat(item.price) * parseFloat(item.quantity) - item.totalCost,
            })),
          },
        },
        include: { items: true, customer: { select: { name: true } } },
      });

      // History: order created
      await tx.history.create({
        data: {
          action:      "SALES_CREATED",
          item:        `${items.length} item`,
          category:    "Sales",
          type:        "MONEY",
          quantity:    total,
          unit:        "IDR",
          user:        currentUser,
          referenceId: sale.id,
          notes:       `Invoice ${invoiceId} | ${isDirect ? "DIRECT SALE" : "REGULAR"} | Customer: ${sale.customer?.name || "Umum"} | Total: Rp ${total.toLocaleString("id-ID")}`,
        },
      });

      // ── DIRECT: potong stok seketika ────────────────────────────────────────
      if (isDirect) {
        const { deductedItems, totalCost: costActual } = await deductSalesBatches(
          tx, sale.id, invoiceId, currentUser
        );

        // Catat transaksi keuangan seketika
        const trxNo = await generateTrxNo(tx);
        await tx.transaction.create({
          data: {
            trxNo,
            category:    "Penjualan",
            description: `Direct Sale ${invoiceId} — ${sale.customer?.name || "Pelanggan Umum"}`,
            amount:      total,
            type:        "INCOME",
            date:        new Date(),
            method:      paymentMethod,
            createdBy:   currentUser,
            referenceId: sale.id,
          },
        });

        // Update status + paidAt
        await tx.penjualan.update({
          where: { id: sale.id },
          data:  { paidAt: new Date() },
        });

        await tx.history.create({
          data: {
            action:      "SALES_DIRECT_COMPLETED",
            item:        invoiceId,
            category:    "Sales",
            type:        "MONEY",
            quantity:    total,
            unit:        "IDR",
            user:        currentUser,
            referenceId: sale.id,
            notes:       `Direct sale selesai. ${deductedItems.length} batch dipotong. HPP: Rp ${costActual.toLocaleString("id-ID")}`,
          },
        });
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("POST_PENJUALAN:", err.message);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}

// =============================================================================
// PATCH /api/penjualan — Hanya untuk CANCEL (approval lewat route terpisah)
// Body: { id, notes? }
// =============================================================================
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id, notes } = await request.json();
    const currentUser   = session.user.name || session.user.email || "System";
    const role          = session.user.role;

    if (!["Admin", "Sales", "Supervisor", "Manager", "SuperAdmin"].includes(role)) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.penjualan.findUnique({
        where:   { invoiceId: id },
        include: { items: true },
      });
      if (!existing) throw new Error("Transaksi tidak ditemukan.");
      if (existing.status === "COMPLETED") throw new Error("Transaksi COMPLETED tidak bisa dibatalkan.");
      if (existing.status === "CANCELLED") throw new Error("Transaksi sudah dibatalkan.");

      // Jika stok sudah dipotong, kembalikan lewat syncStockFromBatches
      // (umumnya tidak terjadi di REGULAR — stok baru dipotong saat COMPLETED)
      // Untuk DIRECT yang sudah COMPLETED, tidak bisa cancel dari sini.

      const updated = await tx.penjualan.update({
        where: { invoiceId: id },
        data: {
          status:       "CANCELLED",
          rejectedBy:   currentUser,
          rejectedAt:   new Date(),
          rejectedNotes: notes || "Dibatalkan",
        },
      });

      await tx.history.create({
        data: {
          action:      "SALES_CANCELLED",
          item:        id,
          category:    "Sales",
          type:        "MONEY",
          quantity:    existing.totalAmount,
          unit:        "IDR",
          user:        currentUser,
          referenceId: existing.id,
          notes:       `Invoice ${id} dibatalkan oleh ${currentUser}. ${notes || ""}`,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("PATCH_PENJUALAN:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/penjualan?id=INV/... — Hanya Admin
// =============================================================================
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!canDeleteSale(session.user.role)) {
      return NextResponse.json({ message: "Hanya Admin yang bisa hapus." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id          = searchParams.get("id");
    const currentUser = session.user.name || "System";

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.penjualan.findUnique({
        where:   { invoiceId: id },
        include: { items: true },
      });
      if (!sale) throw new Error("Transaksi tidak ditemukan.");
      if (sale.status === "COMPLETED" && sale.isStockDeducted) {
        throw new Error("Tidak bisa hapus transaksi COMPLETED yang sudah memotong stok.");
      }

      await tx.history.create({
        data: {
          action:      "SALES_DELETED",
          item:        id,
          category:    "Sales",
          type:        "MONEY",
          quantity:    sale.totalAmount,
          unit:        "IDR",
          user:        currentUser,
          referenceId: sale.id,
          notes:       `Invoice ${id} dihapus permanen (status: ${sale.status})`,
        },
      });

      await tx.penjualanItem.deleteMany({ where: { penjualanId: sale.id } });
      await tx.penjualan.delete({ where: { id: sale.id } });
      return { message: "Berhasil dihapus." };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("DELETE_PENJUALAN:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}