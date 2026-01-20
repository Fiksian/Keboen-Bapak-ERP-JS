import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const requests = await prisma.purchasing.findMany({
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
      return NextResponse.json(
        { message: "Unauthorized: Anda harus login untuk membuat permintaan" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const userName = session.user.name || "Unknown User";

    // Parsing data agar aman sebelum masuk database
    const qtyValue = parseFloat(body.qty) || 0;
    const amountValue = body.amount ? body.amount.toString() : "0";

    // Menggunakan Transaction untuk memastikan Request dan History tersimpan bersamaan
    const [newRequest] = await prisma.$transaction([
      // 1. Buat record Purchasing
      prisma.purchasing.create({
        data: {
          item: body.item,
          qty: body.qty, // Disimpan sebagai string sesuai skema (ex: "10 Sacks")
          amount: amountValue,
          requestedBy: userName,
          category: body.category || "General", 
          type: body.type || "STOCKS", 
          status: "PENDING",
          isReceived: false
        }
      }),
      // 2. Catat ke History sebagai pengajuan baru
      prisma.history.create({
        data: {
          action: "PURCHASE_REQUEST",
          item: body.item,
          category: body.category || "General",
          type: body.type || "STOCKS",
          quantity: qtyValue, // Float di skema History
          user: userName,
          notes: `Mengajukan pengadaan baru: ${body.qty}`
        }
      })
    ]);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal membuat permintaan pengadaan", error: error.message }, 
      { status: 500 }
    );
  }
}