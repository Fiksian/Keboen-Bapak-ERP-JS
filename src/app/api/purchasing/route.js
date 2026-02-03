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

  return { 
    value: standardizedQty, 
    unit: standardizedUnit 
  };
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

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supplier, item, qty, unit, price, category, type } = body;
    const userName = session.user.name || "Unknown User";

    if (!item || qty === undefined || !price) {
      return NextResponse.json(
        { message: "Data tidak lengkap (Item, Qty, dan Harga wajib diisi)" },
        { status: 400 }
      );
    }

    const standardized = getStandardizedData(qty, unit);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePattern = `${year}/${month}`;

    const lastPO = await prisma.purchasing.findFirst({
      where: { noPO: { contains: `PO/${datePattern}` } },
      orderBy: { noPO: 'desc' }
    });

    let nextNumber = 1;
    if (lastPO && lastPO.noPO) {
      const parts = lastPO.noPO.split('/');
      const lastSequence = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSequence)) {
        nextNumber = lastSequence + 1;
      }
    }

    const sequenceStr = String(nextNumber).padStart(3, '0');
    const autoNoPO = `PO/${datePattern}/${sequenceStr}`;

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

      await tx.history.create({
        data: {
          action: "PURCHASE_REQUEST_AUTO",
          item: item,
          category: category || "General",
          type: type || "STOCKS",
          quantity: standardized.value,
          unit: standardized.unit,
          user: userName,
          notes: `Membuat PO: ${autoNoPO}. Input user: ${qty} ${unit}.`
        }
      });

      return newPurchase;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Nomor PO ganda terdeteksi, silakan coba lagi." }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Gagal membuat pengadaan", error: error.message }, 
      { status: 500 }
    );
  }
}