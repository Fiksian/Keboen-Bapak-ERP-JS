// app/api/purchasing/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getStandardizedData = (amountRaw, unitRaw) => ({
  value: parseFloat(amountRaw) || 0,
  unit:  unitRaw ? unitRaw.toUpperCase() : "KG",
});

// GET /api/purchasing — semua PO, include receipts
export async function GET() {
  try {
    const requests = await prisma.purchasing.findMany({
      include: {
        receipts:          { orderBy: { receivedAt: "desc" } },
        deliveryOrderItem: {
          select: {
            id:             true,
            itemName:       true,
            qtyRequired:    true,
            qtyOrdered:     true,
            deliveryOrderId: true,
            deliveryOrder:  { select: { id: true, doNo: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

// POST /api/purchasing — buat PO LANGSUNG (tanpa DO)
// Untuk PO dari DO gunakan POST /api/delivery-order/[id]/create-po
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body     = await request.json();
    const userName = session.user.name || "Unknown User";

    const itemsToProcess = Array.isArray(body) ? body : [body];
    if (!itemsToProcess.length) return NextResponse.json({ message: "Data kosong" }, { status: 400 });

    const results = await prisma.$transaction(async (tx) => {
      const now           = new Date();
      const datePattern   = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
      const trxDatePrefix = now.toISOString().slice(0, 10).replace(/-/g, "");

      const lastPO = await tx.purchasing.findFirst({
        where:   { noPO: { contains: `PO/SALI/${datePattern}` } },
        orderBy: { noPO: "desc" },
      });
      let basePONumber = 0;
      if (lastPO?.noPO) {
        const parts = lastPO.noPO.split("/");
        basePONumber = parseInt(parts[parts.length - 1]) || 0;
      }
      const sharedNoPO = `PO/SALI/${datePattern}/${String(basePONumber + 1).padStart(3, "0")}`;

      const lastTrx = await tx.transaction.findFirst({
        where: { trxNo: { startsWith: `TRX-${trxDatePrefix}` } },
        orderBy: { trxNo: "desc" },
      });
      let baseTrxNumber = 0;
      if (lastTrx) {
        const parts = lastTrx.trxNo.split("-");
        baseTrxNumber = parseInt(parts[parts.length - 1]) || 0;
      }

      const createdPurchases = [];
      for (let i = 0; i < itemsToProcess.length; i++) {
        const entry       = itemsToProcess[i];
        const { supplier, item, qty, unit, price, category, type, method } = entry;
        const standardized = getStandardizedData(qty, unit);
        const totalPrice   = standardized.value * parseFloat(price || 0);

        const newPurchase = await tx.purchasing.create({
          data: {
            noPO:        sharedNoPO,
            supplier:    supplier || "Supplier Umum",
            item,
            qty:         standardized.value,
            unit:        standardized.unit,
            price:       (price || 0).toString(),
            requestedBy: userName,
            category:    category || "General",
            type:        type     || "STOCKS",
            status:      "PENDING",
            isReceived:  false,
            // deliveryOrderItemId null — ini PO langsung
          },
        });

        const finalTrxNo = `TRX-${trxDatePrefix}-${String(baseTrxNumber + i + 1).padStart(3, "0")}`;
        await tx.transaction.create({
          data: {
            trxNo:       finalTrxNo,
            category:    "Pengadaan",
            description: `Pembelian ${item} (${sharedNoPO})`,
            amount:      totalPrice,
            type:        "EXPENSE",
            date:        now,
            method:      method || "CASH",
            createdBy:   userName,
            referenceId: newPurchase.id,
          },
        });

        await tx.history.create({
          data: {
            action:   "PURCHASE_REQUEST_AUTO",
            item,
            category: category || "General",
            type:     "MONEY",
            quantity: standardized.value,
            unit:     standardized.unit,
            user:     userName,
            notes:    `Item ${item} masuk ke ${sharedNoPO}. TRX: ${finalTrxNo}`,
          },
        });

        createdPurchases.push(newPurchase);
      }
      return createdPurchases;
    });

    return NextResponse.json({
      message: `${results.length} item berhasil didaftarkan dalam PO: ${results[0].noPO}`,
      data:    results,
    }, { status: 201 });

  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Nomor transaksi ganda. Coba lagi." }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || "Gagal membuat pengadaan" }, { status: 500 });
  }
}
