import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fungsi Helper (Logika Tunggal)
const getAutoStatus = (quantity) => {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return "SOLD OUT";
  if (qty <= 10) return "LIMITED";
  return "READY";
};

export async function PATCH(request, { params }) {
  try {
    const { id } = await params; 

    const purchase = await prisma.purchasing.findUnique({
      where: { id: id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    const incomingQty = parseFloat(purchase.qty.split(' ')[0]) || 0;
    const unitLabel = purchase.qty.split(' ')[1] || "Unit";

    const existingStock = await prisma.stock.findUnique({
      where: { name: purchase.item }
    });

    const currentQty = existingStock ? parseFloat(existingStock.stock) : 0;
    const finalQty = currentQty + incomingQty;
    const finalStatus = getAutoStatus(finalQty);

    await prisma.$transaction([
      prisma.purchasing.update({
        where: { id: id },
        data: { isReceived: true }
      }),
      prisma.stock.upsert({
        where: { name: purchase.item },
        update: {
          stock: finalQty,
          status: finalStatus, 
          price: purchase.amount,
        },
        create: {
          name: purchase.item,
          category: purchase.category || "General",
          stock: finalQty,
          unit: unitLabel,
          type: purchase.type,
          price: purchase.amount,
          status: finalStatus 
        }
      })
    ]);

    return NextResponse.json({ 
      message: "Barang berhasil masuk gudang",
      newStatus: finalStatus 
    }, { status: 200 });

  } catch (error) {
    console.error("RECEIVE_ERROR:", error);
    return NextResponse.json({ message: "Gagal memproses penerimaan" }, { status: 500 });
  }
}