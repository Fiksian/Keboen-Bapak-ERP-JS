import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper status stok
const getAutoStatus = (quantity) => {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return "SOLD OUT";
  if (qty <= 10) return "LIMITED";
  return "READY";
};

/**
 * PATCH: Proses Penerimaan Barang (Masuk Gudang)
 * Mencatat 'receivedBy' untuk transparansi audit.
 */
export async function PATCH(request, context) {
  try {
    // 1. Validasi Sesi
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; 
    const userName = session.user.name || "Warehouse Admin";

    // 2. Ambil data Purchase Order
    const purchase = await prisma.purchasing.findUnique({
      where: { id: id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data pengadaan tidak ditemukan" }, { status: 404 });
    }

    if (purchase.isReceived) {
      return NextResponse.json({ message: "Barang sudah pernah diterima sebelumnya" }, { status: 400 });
    }

    // 3. Parsing Quantity
    const qtyParts = purchase.qty.split(' ');
    const incomingQty = parseFloat(qtyParts[0]) || 0;
    const unitLabel = qtyParts[1] || "Unit";

    // 4. Kalkulasi Stok
    const existingStock = await prisma.stock.findUnique({
      where: { name: purchase.item }
    });

    const currentQty = existingStock ? parseFloat(existingStock.stock) : 0;
    const finalQty = currentQty + incomingQty;
    const finalStatus = getAutoStatus(finalQty);

    // 5. Database Transaction
    await prisma.$transaction([
      // A. Update status & CATAT PENERIMA di Purchasing
      prisma.purchasing.update({
        where: { id: id },
        data: { 
          isReceived: true,
          receivedBy: userName // Mencatat siapa yang klik "Receive"
        }
      }),

      // B. Update/Upsert Stock
      prisma.stock.upsert({
        where: { name: purchase.item },
        update: {
          stock: finalQty,
          status: finalStatus, 
          price: purchase.amount,
          type: purchase.type 
        },
        create: {
          name: purchase.item,
          category: purchase.category || "General",
          stock: finalQty,
          unit: unitLabel,
          type: purchase.type || "STOCKS",
          price: purchase.amount,
          status: finalStatus 
        }
      }),

      // C. Catat ke History dengan nama penerima yang spesifik
      prisma.history.create({
        data: {
          action: "STOCK_IN",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type || "STOCKS",
          quantity: incomingQty,
          user: userName, // Mencatat user gudang
          notes: `Penerimaan PO: ${purchase.noPO} | Diterima oleh: ${userName} | Supplier: ${purchase.supplier}`
        }
      })
    ]);

    return NextResponse.json({ 
      message: `Barang dari PO ${purchase.noPO} berhasil diterima oleh ${userName}`,
      newStatus: finalStatus 
    }, { status: 200 });

  } catch (error) {
    console.error("RECEIVE_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memproses penerimaan barang", 
      error: error.message 
    }, { status: 500 });
  }
}