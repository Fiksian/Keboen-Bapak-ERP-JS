// app/api/delivery-order/route.js
// DO-First architecture:
// DO dibuat PERTAMA dengan daftar kebutuhan barang.
// Supplier ditentukan KEMUDIAN saat PO dibuat per item.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Generate nomor DO ───────────────────────────────────────────────────────
const generateDONo = async () => {
  const now    = new Date();
  const prefix = `DO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count  = await prisma.deliveryOrder.count({ where: { doNo: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

// ─── Hitung & update status DO berdasarkan fulfillment item-itemnya ──────────
// Dipanggil setiap kali PO untuk item DO dibuat/dihapus.
export const recalcDOStatus = async (tx, doId) => {
  const do_ = await tx.deliveryOrder.findUnique({
    where: { id: doId },
    include: { items: true },
  });
  if (!do_ || !["APPROVED", "PARTIAL", "FULFILLED"].includes(do_.status)) return;

  const total     = do_.items.length;
  const fulfilled = do_.items.filter(i => i.qtyOrdered >= i.qtyRequired).length;
  const anyOrdered = do_.items.some(i => i.qtyOrdered > 0);

  let newStatus = "APPROVED";
  if (fulfilled === total && total > 0) newStatus = "FULFILLED";
  else if (anyOrdered)                  newStatus = "PARTIAL";

  if (newStatus !== do_.status) {
    await tx.deliveryOrder.update({ where: { id: doId }, data: { status: newStatus } });
  }
};

// ─── GET /api/delivery-order ──────────────────────────────────────────────────
// ?status=PENDING|APPROVED|PARTIAL|FULFILLED|REJECTED|DRAFT
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const orders = await prisma.deliveryOrder.findMany({
      where: status ? { status } : {},
      include: {
        items: {
          include: {
            // Semua PO yang dibuat untuk item ini
            purchasingOrders: {
              select: {
                id: true, noPO: true, supplier: true,
                qty: true, unit: true, price: true,
                status: true, isReceived: true,
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = orders.map(o => ({
      ...o,
      totalItems:   o._count?.items || 0,
      // Summary fulfillment untuk display
      fulfilledItems: o.items.filter(i => i.qtyOrdered >= i.qtyRequired).length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("DO_GET_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// ─── POST /api/delivery-order ─────────────────────────────────────────────────
// Buat DO baru dengan daftar kebutuhan barang.
// TIDAK ada supplier di sini — hanya nama item, qty, unit.
// Body: {
//   title?:        string,
//   expectedDate?: string,
//   notes?:        string,
//   items: [{ itemName, unit, qtyRequired, estimasiHarga?, category?, type?, notes? }]
// }
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, expectedDate, notes, items } = body;

    if (!items?.length) {
      return NextResponse.json({ message: "Minimal satu item harus diisi" }, { status: 400 });
    }

    // Validasi item
    const errors = [];
    items.forEach((item, i) => {
      if (!item.itemName?.trim()) errors.push(`Item ${i + 1}: nama barang wajib diisi`);
      if (!item.unit?.trim())     errors.push(`Item ${i + 1}: unit wajib diisi`);
      if ((parseFloat(item.qtyRequired) || 0) <= 0) errors.push(`Item ${i + 1}: qty harus lebih dari 0`);
    });
    if (errors.length) return NextResponse.json({ message: errors.join(" | ") }, { status: 400 });

    const doNo = await generateDONo();

    const newDO = await prisma.deliveryOrder.create({
      data: {
        doNo,
        title:        title || null,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes:        notes || "",
        requestedBy:  session.user.name || session.user.email,
        status:       "PENDING",
        items: {
          create: items.map(i => ({
            itemName:      i.itemName.trim(),
            category:      i.category || "",
            type:          i.type     || "STOCKS",
            unit:          i.unit.trim(),
            qtyRequired:   parseFloat(i.qtyRequired) || 0,
            qtyOrdered:    0,  // belum ada PO
            estimasiHarga: parseFloat(i.estimasiHarga) || 0,
            notes:         i.notes || "",
          })),
        },
      },
      include: {
        items: { include: { purchasingOrders: { select: { id: true, noPO: true } } } },
      },
    });

    return NextResponse.json(newDO, { status: 201 });
  } catch (error) {
    console.error("DO_POST_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
