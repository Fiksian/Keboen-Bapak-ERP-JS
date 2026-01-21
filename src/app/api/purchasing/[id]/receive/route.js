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
 * Mencatat 'receivedBy', 'receivedAt', dan 'suratJalan' untuk transparansi audit.
 */
export async function PATCH(request, context) {
  try {
    // 1. Validasi Sesi
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; 
    const body = await request.json(); // Ambil data dari frontend (termasuk nomor surat jalan)
    const { suratJalan } = body; 

    const userName = session.user.name || "Warehouse Admin";
    const currentTime = new Date(); // Ambil waktu server saat ini

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
      // A. Update status & CATAT BUKTI di tabel Purchasing
      prisma.purchasing.update({
        where: { id: id },
        data: { 
          isReceived: true,
          receivedBy: userName,
          receivedAt: currentTime, // Mencatat tanggal & jam masuk
          suratJalan: suratJalan || "TANPA-SJ" // Menyimpan nomor surat jalan vendor
        }
      }),

      // B. Update/Upsert Stock (Kuantitas riil di gudang)
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

      // C. Catat ke tabel History (Log Aktivitas)
      prisma.history.create({
        data: {
          action: "STOCK_IN",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type || "STOCKS",
          quantity: incomingQty,
          user: userName,
          notes: `Penerimaan PO: ${purchase.noPO} | SJ: ${suratJalan || '---'} | Oleh: ${userName}`
        }
      })
    ]);

    return NextResponse.json({ 
      message: `Barang dari PO ${purchase.noPO} berhasil diterima oleh ${userName}`,
      receivedAt: currentTime,
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