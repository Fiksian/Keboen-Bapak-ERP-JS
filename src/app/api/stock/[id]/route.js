import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getAutoStatus = (quantity) => {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return "SOLD OUT";
  if (qty <= 10) return "LIMITED";
  return "READY";
};

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params; 
    const body = await request.json();

    // 1. Ambil data stok lama untuk menghitung selisih (diff)
    const oldStock = await prisma.stock.findUnique({
      where: { id: id }
    });

    if (!oldStock) {
      return NextResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    }

    const newStockValue = parseFloat(body.stock) || 0;
    const diff = newStockValue - oldStock.stock;
    const autoStatus = getAutoStatus(newStockValue);

    // 2. Jalankan Transaction: Update Stock & Create History
    const [updatedStock] = await prisma.$transaction([
      // Aksi 1: Update data stok
      prisma.stock.update({
        where: { id: id },
        data: {
          price: body.price?.toString(),
          stock: newStockValue,
          status: autoStatus,
          category: body.category,
          type: body.type 
        }
      }),
      // Aksi 2: Catat ke History
      prisma.history.create({
        data: {
          action: "STOCK_UPDATE",
          item: oldStock.name,
          category: body.category || oldStock.category,
          type: body.type || oldStock.type,
          quantity: diff, // Menyimpan selisih perubahan (+ atau -)
          user: session?.user?.name || "System",
          notes: body.notes || `Update manual: ${oldStock.stock} -> ${newStockValue}`
        }
      })
    ]);

    return NextResponse.json(updatedStock);
  } catch (error) {
    console.error("API_STOCK_PATCH_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui data stok" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    // 1. Cari data sebelum dihapus untuk catatan history
    const itemToDelete = await prisma.stock.findUnique({
      where: { id: id }
    });

    if (!itemToDelete) {
      return NextResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    }

    // 2. Jalankan Transaction: Delete Stock & Create History
    await prisma.$transaction([
      prisma.stock.delete({
        where: { id: id },
      }),
      prisma.history.create({
        data: {
          action: "STOCK_DELETE",
          item: itemToDelete.name,
          category: itemToDelete.category,
          type: itemToDelete.type,
          quantity: -itemToDelete.stock, // History mencatat penghilangan seluruh stok
          user: session?.user?.name || "System",
          notes: "Item dihapus dari sistem"
        }
      })
    ]);

    return NextResponse.json({ message: "Item stok berhasil dihapus" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_STOCK_ERROR:", error);
    
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Item tidak ditemukan di database" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Gagal menghapus Item", detail: error.message },
      { status: 500 }
    );
  }
}