import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const purchases = await prisma.purchasing.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        receipts: true, 
      },
    });

    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    console.error("GET_PURCHASING_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memuat data Purchasing", detail: error.message },
      { status: 500 }
    );
  }
}


export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; 

    const existingPurchase = await prisma.purchasing.findUnique({
      where: { id: id },
    });

    if (!existingPurchase) {
      return NextResponse.json({ message: "Data PO tidak ditemukan" }, { status: 404 });
    }

    if (existingPurchase.isReceived) {
      return NextResponse.json(
        { message: "Penghapusan ditolak: PO ini sudah diterima/masuk gudang." }, 
        { status: 400 }
      );
    }

    await prisma.purchasing.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "PO berhasil dihapus dari sistem" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus PO", detail: error.message },
      { status: 500 }
    );
  }
}