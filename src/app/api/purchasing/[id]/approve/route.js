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
    const userName = session.user.name || "System Admin";

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

    const [updatedRequest] = await prisma.$transaction([
      prisma.purchasing.update({
        where: { id },
        data: { 
          status: status,
          approvedBy: status === 'PENDING' ? null : userName 
        },
      }),
      
      prisma.history.create({
        data: {
          action: status === 'APPROVED' ? "PURCHASE_APPROVED" : 
                  status === 'REJECTED' ? "PURCHASE_REJECTED" : "PURCHASE_REVOKED",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type || "STOCKS",
          quantity: purchase.qty || 0,
          unit: purchase.unit || "Unit",
          user: userName,
          notes: status === 'PENDING' 
            ? `Persetujuan PO ${purchase.noPO} dibatalkan (Revoke) oleh ${userName}.`
            : `PO ${purchase.noPO} (${purchase.supplier || 'Tanpa Supplier'}) status diubah menjadi ${status} oleh ${userName}.`
        }
      })
    ]);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Approve Error:", error);
    return NextResponse.json({ 
      message: "Gagal memperbarui status", 
      detail: error.message 
    }, { status: 500 });
  }
}