// app/api/penjualan/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Auto-numbering helpers ───────────────────────────────────────────────────
const generateInvoiceNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `INV/${dateStr}/`;
  const last    = await tx.penjualan.findFirst({
    where:   { invoiceId: { startsWith: prefix } },
    orderBy: { invoiceId: "desc" },
  });
  const nextNum = last ? parseInt(last.invoiceId.split("/").pop()) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
};

const generateTrxNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `TRX-${dateStr}-`;
  const last    = await tx.transaction.findFirst({
    where:   { trxNo: { startsWith: prefix } },
    orderBy: { trxNo: "desc" },
  });
  const nextNum = last ? parseInt(last.trxNo.split("-").pop()) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
};

// ─── Role check ───────────────────────────────────────────────────────────────
const isAuthorized = (session, roles = ["Admin", "Sales", "Supervisor"]) =>
  roles.includes(session?.user?.role);

// ─── Hitung total dari items + tax + discount ─────────────────────────────────
const calcTotals = (items, discountPct = 0, taxPct = 0, shippingCost = 0) => {
  const subtotal   = items.reduce((s, i) => s + (parseFloat(i.quantity) * parseFloat(i.price) - (parseFloat(i.discount) || 0)), 0);
  const discount   = subtotal * (parseFloat(discountPct) / 100);
  const afterDisc  = subtotal - discount;
  const taxAmount  = afterDisc * (parseFloat(taxPct) / 100);
  const total      = afterDisc + taxAmount + parseFloat(shippingCost || 0);
  return { subtotal, discount, taxAmount, total };
};

// =============================================================================
// GET /api/penjualan
// =============================================================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status  = searchParams.get("status");
    const from    = searchParams.get("from");
    const to      = searchParams.get("to");

    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    const sales = await prisma.penjualan.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = sales.map((s) => ({
      id:              s.invoiceId,
      dbId:            s.id,
      customer:        s.customer?.name || "Pelanggan Umum",
      customerAddress: s.customer?.address || "",
      customerPhone:   s.customer?.phone   || "",
      date:            s.createdAt?.toISOString().split("T")[0] || "-",
      createdAt:       s.createdAt,
      total:           s.totalAmount || 0,
      subtotal:        s.subtotal    || 0,
      discount:        s.discount    || 0,
      discountPct:     s.discountPct || 0,
      taxPct:          s.taxPct      || 0,
      taxAmount:       s.taxAmount   || 0,
      shippingCost:    s.shippingCost || 0,
      paymentMethod:   s.paymentMethod || "CASH",
      status:          s.status,
      paidAt:          s.paidAt,
      dueDate:         s.dueDate,
      notes:           s.notes       || "",
      salesNotes:      s.salesNotes  || "",
      deliveryAddress: s.deliveryAddress || "",
      createdBy:       s.createdBy   || "",
      quotationId:     s.quotationId || null,
      itemCount:       s.items?.length || 0,
      items:           s.items?.map((i) => ({
        productName: i.productName,
        quantity:    i.quantity,
        price:       i.price,
        discount:    i.discount || 0,
        subtotal:    i.subtotal || i.quantity * i.price,
        unit:        i.unit || "Unit",
        notes:       i.notes || "",
      })) || [],
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error("API_GET_SALES:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// =============================================================================
// POST /api/penjualan — Buat Sales Order baru
// Body: { customerId, items[], discountPct?, taxPct?, shippingCost?,
//         paymentMethod?, dueDate?, notes?, salesNotes?, deliveryAddress?,
//         quotationId? }
// =============================================================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Role check: hanya Admin, Sales, Supervisor bisa input penjualan
    if (!isAuthorized(session)) {
      return NextResponse.json({ message: "Akses ditolak. Hanya Admin/Sales/Supervisor." }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerId, items = [], discountPct = 0, taxPct = 0,
      shippingCost = 0, paymentMethod = "CASH", dueDate,
      notes, salesNotes, deliveryAddress, quotationId,
    } = body;

    const currentUser = session.user.name || session.user.email || "System";

    if (!items.length) {
      return NextResponse.json({ message: "Minimal satu item harus diisi." }, { status: 400 });
    }

    // ── Hitung totals ─────────────────────────────────────────────────────────
    const { subtotal, discount, taxAmount, total } = calcTotals(items, discountPct, taxPct, shippingCost);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek & kurangi stok untuk semua item
      for (const item of items) {
        const qty = parseFloat(item.quantity);

        // Cek stok mencukupi (kurangi dari semua warehouse yang punya barang)
        const stocks = await tx.stock.findMany({ where: { name: item.name } });
        const totalStock = stocks.reduce((s, st) => s + st.stock, 0);

        if (totalStock < qty) {
          throw new Error(`Stok "${item.name}" tidak mencukupi. Tersedia: ${totalStock}, Dibutuhkan: ${qty}`);
        }

        // Kurangi stok — dari warehouse pertama yang punya cukup
        let remaining = qty;
        for (const stk of stocks) {
          if (remaining <= 0) break;
          const toDeduct = Math.min(remaining, stk.stock);
          await tx.stock.update({
            where: { id: stk.id },
            data:  { stock: { decrement: toDeduct } },
          });
          remaining -= toDeduct;
        }
      }

      // 2. Generate Invoice ID
      const invoiceId = await generateInvoiceNo(tx);

      // 3. Buat record Penjualan
      const sale = await tx.penjualan.create({
        data: {
          invoiceId,
          totalAmount:     total,
          subtotal,
          discount,
          discountPct:     parseFloat(discountPct),
          taxPct:          parseFloat(taxPct),
          taxAmount,
          shippingCost:    parseFloat(shippingCost),
          status:          "PENDING",
          paymentMethod,
          dueDate:         dueDate ? new Date(dueDate) : null,
          notes:           notes        || null,
          salesNotes:      salesNotes   || null,
          deliveryAddress: deliveryAddress || null,
          createdBy:       currentUser,
          quotationId:     quotationId  || null,
          ...(customerId ? { customerId } : {}),
          items: {
            create: items.map((item) => {
              const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.price) - (parseFloat(item.discount) || 0);
              return {
                productName: item.name,
                quantity:    parseFloat(item.quantity),
                unit:        item.unit || "Unit",
                price:       parseFloat(item.price),
                discount:    parseFloat(item.discount) || 0,
                subtotal:    itemSubtotal,
                notes:       item.notes || null,
              };
            }),
          },
        },
        include: { items: true, customer: { select: { name: true } } },
      });

      // 4. Audit log: SALES_ORDER_CREATED
      await tx.history.create({
        data: {
          action:      "SALES_ORDER_CREATED",
          item:        `${items.length} item`,
          category:    "Sales",
          type:        "MONEY",
          quantity:    total,
          unit:        "IDR",
          user:        currentUser,
          referenceId: sale.id,
          notes:       `Invoice ${invoiceId} dibuat | Customer: ${sale.customer?.name || "Umum"} | Total: Rp ${total.toLocaleString("id-ID")}`,
        },
      });

      // Jika quotation direferensikan, update statusnya ke ACCEPTED
      if (quotationId) {
        await tx.salesQuotation.update({
          where: { id: quotationId },
          data:  { status: "ACCEPTED" },
        }).catch(() => {}); // silent fail jika tabel belum ada
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("API_POST_SALES:", err.message);
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}

// =============================================================================
// PATCH /api/penjualan — Update status pesanan
// Body: { id, status, method? }
// Status flow: PENDING → COMPLETED | CANCELLED
// =============================================================================
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(session)) {
      return NextResponse.json({ message: "Akses ditolak. Hanya Admin/Sales/Supervisor." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, method } = body;
    const currentUser = session.user.name || session.user.email || "System";

    const validStatuses = ["COMPLETED", "CANCELLED", "PENDING"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Status tidak valid." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.penjualan.findUnique({
        where:   { invoiceId: id },
        include: { items: true, customer: { select: { name: true } } },
      });
      if (!existing) throw new Error("Transaksi tidak ditemukan.");

      // Hanya bisa mengubah dari PENDING
      if (existing.status !== "PENDING" && status !== "PENDING") {
        throw new Error(`Status sudah ${existing.status}, tidak bisa diubah.`);
      }

      // ── COMPLETED: catat ke finance sebagai INCOME ─────────────────────────
      if (status === "COMPLETED" && existing.status === "PENDING") {
        const trxNo = await generateTrxNo(tx);
        await tx.transaction.create({
          data: {
            trxNo,
            category:    "Penjualan",
            description: `Penerimaan Dana Invoice ${id} — ${existing.customer?.name || "Pelanggan Umum"}`,
            amount:      existing.totalAmount,
            type:        "INCOME",
            date:        new Date(),
            method:      method || existing.paymentMethod || "CASH",
            createdBy:   currentUser,
            referenceId: existing.id,
          },
        });

        await tx.history.create({
          data: {
            action:      "SALES_COMPLETED",
            item:        id,
            category:    "Sales",
            type:        "MONEY",
            quantity:    existing.totalAmount,
            unit:        "IDR",
            user:        currentUser,
            referenceId: existing.id,
            notes:       `Invoice ${id} selesai. Dana Rp ${existing.totalAmount.toLocaleString("id-ID")} tercatat sebagai income. Trx: ${trxNo}`,
          },
        });
      }

      // ── CANCELLED: kembalikan stok ─────────────────────────────────────────
      if (status === "CANCELLED" && existing.status === "PENDING") {
        for (const item of existing.items) {
          // Kembalikan ke warehouse pertama yang menyimpan nama item ini
          const stk = await tx.stock.findFirst({ where: { name: item.productName } });
          if (stk) {
            await tx.stock.update({
              where: { id: stk.id },
              data:  { stock: { increment: item.quantity } },
            });
          }

          await tx.history.create({
            data: {
              action:      "SALES_REFUND",
              item:        item.productName,
              category:    "Sales",
              type:        "STOCKS",
              quantity:    item.quantity,
              unit:        item.unit || "Unit",
              user:        currentUser,
              referenceId: existing.id,
              notes:       `Refund stok karena Invoice ${id} dibatalkan`,
            },
          });
        }

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
            notes:       `Invoice ${id} dibatalkan oleh ${currentUser}`,
          },
        });
      }

      return tx.penjualan.update({
        where: { invoiceId: id },
        data:  {
          status,
          paidAt: status === "COMPLETED" ? new Date() : undefined,
        },
      });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("API_PATCH_SALES:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/penjualan?id=INV/...
// =============================================================================
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!isAuthorized(session, ["Admin"])) {
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

      // Kembalikan stok hanya jika masih PENDING
      if (sale.status === "PENDING") {
        for (const item of sale.items) {
          const stk = await tx.stock.findFirst({ where: { name: item.productName } });
          if (stk) {
            await tx.stock.update({
              where: { id: stk.id },
              data:  { stock: { increment: item.quantity } },
            });
          }
        }
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
          notes:       `Invoice ${id} dihapus permanen oleh ${currentUser} (status saat hapus: ${sale.status})`,
        },
      });

      await tx.penjualanItem.deleteMany({ where: { penjualanId: sale.id } });
      await tx.penjualan.delete({ where: { id: sale.id } });
      return { message: "Berhasil dihapus." };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("API_DELETE_SALES:", err.message);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}