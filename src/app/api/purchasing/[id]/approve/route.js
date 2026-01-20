import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { status } = await request.json();

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    const purchase = await prisma.purchasing.findUnique({
      where: { id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    if (purchase.isReceived) {
      return NextResponse.json(
        { message: "Data terkunci. Barang sudah masuk stok/inventory." }, 
        { status: 400 }
      );
    }

    const userName = session.user.name || "System Admin";

    // Menggunakan Transaction untuk sinkronisasi update status dan pencatatan History
    const [updatedRequest] = await prisma.$transaction([
      // 1. Update Status Purchasing
      prisma.purchasing.update({
        where: { id },
        data: { status },
      }),
      // 2. Catat Perubahan ke History
      prisma.history.create({
        data: {
          action: status === 'APPROVED' ? "PURCHASE_APPROVED" : "PURCHASE_REJECTED",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type,
          quantity: parseFloat(purchase.qty) || 0,
          user: userName,
          notes: `Status pesanan diubah menjadi ${status} oleh ${userName}.`
        }
      })
    ]);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Approve Error:", error);
    return NextResponse.json({ message: "Gagal memperbarui status" }, { status: 500 });
  }
}