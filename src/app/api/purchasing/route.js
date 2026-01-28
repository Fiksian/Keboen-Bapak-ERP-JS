import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET: Mengambil semua daftar Purchase Order
 */
export async function GET() {
  try {
    const requests = await prisma.purchasing.findMany({
      include: {
        receipts: {
          orderBy: { receivedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("GET_PURCHASING_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data pengadaan" }, { status: 500 });
  }
}

/**
 * POST: Membuat Purchase Order Baru dengan Penomoran Berurutan (Sequential)
 * BARANG SAMA = ID BARU (Karena setiap pembelian adalah transaksi unik)
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized: Silakan login terlebih dahulu" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { supplier, item, qty, amount, category, type } = body;
    const userName = session.user.name || "Unknown User";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePattern = `${year}/${month}`;

    const lastPO = await prisma.purchasing.findFirst({
      where: {
        noPO: {
          contains: `PO/${datePattern}`
        }
      },
      orderBy: {
        noPO: 'desc'
      }
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

    if (!item || !qty || !amount) {
      return NextResponse.json(
        { message: "Data tidak lengkap (Item, Qty, dan Harga wajib diisi)" },
        { status: 400 }
      );
    }

    const qtyAsString = qty.toString();
    const amountValue = amount.toString();
    const qtyAsNumber = parseFloat(qty) || 0;

    const result = await prisma.$transaction(async (tx) => {
      // Baris ini akan selalu menghasilkan ID (CUID) baru
      const newPurchase = await tx.purchasing.create({
        data: {
          noPO: autoNoPO,
          supplier: supplier || "Supplier Umum",
          item: item,
          qty: qtyAsString,         
          amount: amountValue,  
          requestedBy: userName,
          approvedBy: null,     
          category: category || "General", 
          type: type || "STOCKS", 
          status: "PENDING",
          isReceived: false
        }
      });

      await tx.history.create({
        data: {
          action: "PURCHASE_REQUEST_AUTO",
          item: item,
          category: category || "General",
          type: type || "STOCKS",
          quantity: qtyAsNumber,
          user: userName,
          notes: `Membuat PO Otomatis: ${autoNoPO} oleh ${userName}.`
        }
      });

      return newPurchase;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Terjadi konflik penomoran otomatis, silakan coba lagi." }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Gagal membuat permintaan pengadaan", error: error.message }, 
      { status: 500 }
    );
  }
}