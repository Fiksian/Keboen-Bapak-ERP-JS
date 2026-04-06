// app/api/delivery-order/[id]/create-po/route.js
//
// ─── ENDPOINT INTI: Buat PO dari DO Item secara manual ───────────────────────
//
// User memilih item dari DO yang sudah APPROVED,
// lalu mengisi supplier, qty, dan harga secara manual.
// Satu item DO bisa dipecah ke banyak PO (multi-supplier, partial qty).
//
// POST body:
// {
//   items: [
//     {
//       doItemId: string,     // ID DeliveryOrderItem yang akan dibuatkan PO
//       supplier:  string,    // supplier yang akan memasok
//       qty:       number,    // qty yang dipesan ke supplier ini
//       price:     number,    // harga satuan
//       notes?:    string,
//     },
//     ...
//   ]
// }
//
// Satu request bisa membuat banyak PO sekaligus untuk item-item yang berbeda.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { recalcDOStatus } from "@/app/api/delivery-order/route";

// ─── Generate nomor PO ────────────────────────────────────────────────────────
const generateNoPO = async (tx) => {
  const now         = new Date();
  const datePattern = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastPO      = await tx.purchasing.findFirst({
    where:   { noPO: { contains: `PO/SALI/${datePattern}` } },
    orderBy: { noPO: "desc" },
  });
  let baseNum = 0;
  if (lastPO?.noPO) {
    const parts = lastPO.noPO.split("/");
    baseNum = parseInt(parts[parts.length - 1]) || 0;
  }
  return `PO/SALI/${datePattern}/${String(baseNum + 1).padStart(3, "0")}`;
};

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: doId } = await params;
    const body         = await request.json();
    const { items }    = body;
    const userName     = session.user.name || session.user.email;

    if (!items?.length) {
      return NextResponse.json({ message: "Minimal satu item harus dipilih" }, { status: 400 });
    }

    // ── Validasi DO ───────────────────────────────────────────────────────────
    const do_ = await prisma.deliveryOrder.findUnique({
      where:   { id: doId },
      include: { items: { include: { purchasingOrders: true } } },
    });
    if (!do_) return NextResponse.json({ message: "DO tidak ditemukan" }, { status: 404 });
    if (!["APPROVED", "PARTIAL"].includes(do_.status)) {
      return NextResponse.json({
        message: `DO harus berstatus APPROVED atau PARTIAL (sekarang: ${do_.status})`,
      }, { status: 400 });
    }

    const doItemMap = Object.fromEntries(do_.items.map(i => [i.id, i]));

    // ── Validasi setiap item ───────────────────────────────────────────────────
    const errors = [];
    for (const entry of items) {
      const doItem = doItemMap[entry.doItemId];
      if (!doItem) {
        errors.push(`Item ID "${entry.doItemId}" tidak ada dalam DO ini`);
        continue;
      }
      if (!entry.supplier?.trim()) errors.push(`Item ${doItem.itemName}: supplier wajib diisi`);
      if (!entry.price || parseFloat(entry.price) <= 0) errors.push(`Item ${doItem.itemName}: harga harus lebih dari 0`);
      const qty = parseFloat(entry.qty) || 0;
      if (qty <= 0) {
        errors.push(`Item ${doItem.itemName}: qty harus lebih dari 0`);
        continue;
      }
      // Cek apakah qty yang diminta tidak melebihi sisa yang belum diorder
      // (boleh melebihi — partial ordering diizinkan, tapi beri peringatan)
      const sisaRequired = doItem.qtyRequired - doItem.qtyOrdered;
      if (qty > sisaRequired && sisaRequired > 0) {
        // Ini warning, bukan error — user mungkin sengaja over-order (safety stock)
        // Tetap boleh lanjut
      }
    }
    if (errors.length) return NextResponse.json({ message: errors.join(" | ") }, { status: 400 });

    // ── Buat semua PO dalam satu transaksi ────────────────────────────────────
    const createdPOs = await prisma.$transaction(async (tx) => {
      const now           = new Date();
      const trxDatePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");
      const results       = [];

      // Generate satu noPO per grup request ini (semua PO dari satu request
      // bisa punya noPO berbeda jika beda supplier, atau sama jika satu batch)
      // Untuk fleksibilitas: setiap item dapat noPO sendiri
      for (const entry of items) {
        const doItem = doItemMap[entry.doItemId];
        const qty    = parseFloat(entry.qty) || 0;
        const price  = parseFloat(entry.price) || 0;
        const noPO   = await generateNoPO(tx);

        // Buat PO
        const po = await tx.purchasing.create({
          data: {
            noPO,
            item:                doItem.itemName,
            qty,
            unit:                doItem.unit,
            price:               price.toString(),
            category:            doItem.category || "General",
            type:                doItem.type     || "STOCKS",
            supplier:            entry.supplier.trim().toUpperCase(),
            status:              "PENDING",
            isReceived:          false,
            requestedBy:         userName,
            notes:               entry.notes || `Dari DO: ${do_.doNo}`,
            deliveryOrderItemId: doItem.id,  // ← link ke DO item
          },
        });

        // Update qtyOrdered pada DO item
        await tx.deliveryOrderItem.update({
          where: { id: doItem.id },
          data:  { qtyOrdered: { increment: qty } },
        });

        // Catat transaksi keuangan
        const trxCount = await tx.transaction.count({
          where: { trxNo: { startsWith: `TRX-${trxDatePrefix}` } },
        });
        await tx.transaction.create({
          data: {
            trxNo:       `TRX-${trxDatePrefix}-${String(trxCount + 1).padStart(3, "0")}`,
            category:    "Pengadaan",
            description: `Pembelian ${doItem.itemName} dari ${entry.supplier} (${noPO}) — DO: ${do_.doNo}`,
            amount:      qty * price,
            type:        "EXPENSE",
            date:        now,
            method:      entry.method || "CASH",
            createdBy:   userName,
            referenceId: po.id,
          },
        });

        // Catat history
        await tx.history.create({
          data: {
            action:      "PO_CREATED_FROM_DO",
            item:        doItem.itemName,
            category:    doItem.category || "General",
            type:        "MONEY",
            quantity:    qty,
            unit:        doItem.unit,
            user:        userName,
            referenceId: po.id,
            notes:       `${noPO} dari DO ${do_.doNo} | Supplier: ${entry.supplier} | Harga: ${price}/${doItem.unit}`,
          },
        });

        results.push(po);
      }

      // Recalculate status DO setelah semua PO dibuat
      await recalcDOStatus(tx, doId);

      return results;
    });

    return NextResponse.json({
      message: `${createdPOs.length} PO berhasil dibuat dari DO ${do_.doNo}`,
      pos:     createdPOs,
    }, { status: 201 });

  } catch (error) {
    console.error("CREATE_PO_FROM_DO_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
