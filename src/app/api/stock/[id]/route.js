import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const determineAutoStatus = (qty, unitName) => {
  const u = unitName?.toUpperCase() || 'UNIT';
  let checkValInKg = qty;

  if (u === 'TON') checkValInKg = qty * 1000;
  else if (u === 'GRAM' || u === 'GR') checkValInKg = qty / 1000;
  else if (u === 'SAK' || u === 'SACKS') checkValInKg = qty * 50;

  if (checkValInKg <= 0) return "EMPTY"; 
  if (checkValInKg <= 50) return "LIMITED";
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

    const newStockValue = parseFloat(body.stock);

    if (isNaN(newStockValue) || newStockValue < 0) {
      return NextResponse.json(
        { message: "Gagal: Stok tidak boleh bernilai negatif atau kosong." }, 
        { status: 400 }
      );
    }

    const diff = newStockValue - oldStock.stock;
    const autoStatus = determineAutoStatus(newStockValue, oldStock.unit);

    const [updatedStock] = await prisma.$transaction([
      prisma.stock.update({
        where: { id: id },
        data: {
          price: body.price?.toString(),
          stock: newStockValue,
          status: autoStatus,
          category: body.category || oldStock.category,
          type: body.type || oldStock.type,
          updatedAt: new Date(),
        }
      }),
      prisma.history.create({
        data: {
          action: "STOCK_UPDATE",
          item: oldStock.name,
          category: body.category || oldStock.category,
          type: body.type || oldStock.type,
          quantity: diff,
          unit: oldStock.unit,
          user: session?.user?.name || "System",
          notes: body.notes || `Update manual oleh admin. (${oldStock.stock} -> ${newStockValue} ${oldStock.unit})`
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Data stok berhasil diperbarui",
      data: updatedStock
    });
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
          unit: itemToDelete.unit,
          user: session?.user?.name || "System",
          notes: `Penghapusan permanen item dari database. Stok terakhir: ${itemToDelete.stock} ${itemToDelete.unit}`
        }
      })
    ]);

    return NextResponse.json({ 
      success: true,
      message: "Item stok dan riwayat penghapusan berhasil dicatat" 
    }, { status: 200 });
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