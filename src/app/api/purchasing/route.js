import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getStandardizedData = (amountRaw, unitRaw) => {
  const amount = parseFloat(amountRaw) || 0;
  const unit = unitRaw ? unitRaw.toUpperCase() : "KG";

  let standardizedQty = amount;
  let standardizedUnit = unit;

  switch (unit) {
    case "TON":
      standardizedQty = amount * 1000;
      standardizedUnit = "KG";
      break;
    case "GRAM":
    case "GR":
      standardizedQty = amount / 1000;
      standardizedUnit = "KG";
      break;
    case "ML":
      standardizedQty = amount / 1000;
      standardizedUnit = "LITER";
      break;
    case "LITER":
    case "L":
      standardizedQty = amount;
      standardizedUnit = "LITER";
      break;
    default:
      standardizedQty = amount;
      standardizedUnit = unit;
  }

  return { value: standardizedQty, unit: standardizedUnit };
};

const generateFinanceTrxNo = async (tx) => {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const lastTrx = await tx.transaction.findFirst({
    where: { trxNo: { startsWith: `TRX-${datePrefix}` } },
    orderBy: { trxNo: 'desc' }
  });

  let nextNum = "001";
  if (lastTrx) {
    const lastNum = parseInt(lastTrx.trxNo.split("-")[2]);
    nextNum = String(lastNum + 1).padStart(3, "0");
  }
  return `TRX-${datePrefix}-${nextNum}`;
};

export async function GET() {
  try {
    const requests = await prisma.purchasing.findMany({
      include: {
        receipts: { orderBy: { receivedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("GET_PURCHASING_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data pengadaan" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplier, item, qty, unit, price, category, type, method } = body;
    const userName = session.user.name || "Unknown User";

    if (!item || qty === undefined || !price) {
      return NextResponse.json(
        { message: "Data tidak lengkap (Item, Qty, dan Harga wajib diisi)" },
        { status: 400 }
      );
    }

    const standardized = getStandardizedData(qty, unit);
    const totalPrice = standardized.value * parseFloat(price);

    const now = new Date();
    const datePattern = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastPO = await prisma.purchasing.findFirst({
      where: { noPO: { contains: `PO/${datePattern}` } },
      orderBy: { noPO: 'desc' }
    });

    let nextNumber = 1;
    if (lastPO?.noPO) {
      const parts = lastPO.noPO.split('/');
      nextNumber = parseInt(parts[parts.length - 1]) + 1;
    }
    const autoNoPO = `PO/${datePattern}/${String(nextNumber).padStart(3, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      const newPurchase = await tx.purchasing.create({
        data: {
          noPO: autoNoPO,
          supplier: supplier || "Supplier Umum",
          item: item,
          qty: standardized.value,
          unit: standardized.unit,
          price: price.toString(),
          requestedBy: userName,
          category: category || "General",
          type: type || "STOCKS",
          status: "PENDING",
          isReceived: false,
        }
      });

      const financeTrxNo = await generateFinanceTrxNo(tx);
      await tx.transaction.create({
        data: {
          trxNo: financeTrxNo,
          category: 'Pengadaan',
          description: `Pembelian ${item} (${autoNoPO})`,
          amount: totalPrice,
          type: 'EXPENSE',
          date: new Date(),
          method: method || "CASH",
          createdBy: userName
        }
      });

      await tx.history.create({
        data: {
          action: "PURCHASE_REQUEST_AUTO",
          item: item,
          category: category || "General",
          type: "MONEY",
          quantity: standardized.value,
          unit: standardized.unit,
          user: userName,
          notes: `Membuat PO: ${autoNoPO} & Transaksi: ${financeTrxNo}. Total: Rp${totalPrice.toLocaleString('id-ID')}`
        }
      });

      return newPurchase;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    if (error.code === 'P2002') return NextResponse.json({ message: "Nomor PO ganda" }, { status: 409 });
    return NextResponse.json({ message: "Gagal membuat pengadaan", error: error.message }, { status: 500 });
  }
}