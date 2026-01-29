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

    const oldStock = await prisma.stock.findUnique({
      where: { id: id }
    });

    if (!oldStock) {
      return NextResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    }

    const newStockValue = parseFloat(body.stock) || 0;
    const diff = newStockValue - oldStock.stock;
    const autoStatus = getAutoStatus(newStockValue);

    const [updatedStock] = await prisma.$transaction([
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
      prisma.history.create({
        data: {
          action: "STOCK_UPDATE",
          item: oldStock.name,
          category: body.category || oldStock.category,
          type: body.type || oldStock.type,
          quantity: diff,
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

    const itemToDelete = await prisma.stock.findUnique({
      where: { id: id }
    });

    if (!itemToDelete) {
      return NextResponse.json({ message: "Item tidak ditemukan" }, { status: 404 });
    }

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
          quantity: -itemToDelete.stock,
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