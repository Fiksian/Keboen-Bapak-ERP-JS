import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const getAutoStatus = (quantity) => {
  const qty = parseFloat(quantity) || 0;
  if (qty <= 0) return "EMPTY";
  if (qty <= 10) return "LIMITED";
  return "READY";
};

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; 
    const body = await request.json(); 
    
    // Destrukturisasi data dari modal ArrivalMonitor
    const { suratJalan, vehicleNo, condition, notes, receivedQty, receivedBy } = body; 

    const userName = receivedBy || session.user.name || "Warehouse Admin";
    const currentTime = new Date();
    const dateStr = currentTime.toISOString().split('T')[0].replace(/-/g, '');

    const purchase = await prisma.purchasing.findUnique({
      where: { id: id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data pengadaan tidak ditemukan" }, { status: 404 });
    }

    if (purchase.isReceived) {
      return NextResponse.json({ message: "Barang sudah pernah diterima sebelumnya" }, { status: 400 });
    }

    const qtyParts = purchase.qty.split(' ');
    const incomingQty = receivedQty || parseFloat(qtyParts[0]) || 0;
    const unitLabel = qtyParts[1] || "Unit";

    // Menjalankan transaksi untuk menjamin integritas data di 4 tabel
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Buat record di tabel Receipt (Sesuai Skema Baru)
      const receipt = await tx.receipt.create({
        data: {
          receiptNo: `GRN-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`,
          purchasingId: id,
          suratJalan: suratJalan || "TANPA-SJ",
          vehicleNo: vehicleNo || "N/A",
          receivedQty: incomingQty,
          receivedBy: userName,
          condition: condition || "GOOD",
          notes: notes || "",
          receivedAt: currentTime
        }
      });

      // 2. Update status di tabel Purchasing (Sesuai Skema Baru)
      await tx.purchasing.update({
        where: { id: id },
        data: { 
          isReceived: true,
          status: "RECEIVED" // Menggunakan Enum PurchaseStatus
        }
      });

      // 3. Kalkulasi dan Update/Upsert Stock
      const existingStock = await tx.stock.findUnique({
        where: { name: purchase.item }
      });

      const currentQty = existingStock ? parseFloat(existingStock.stock) : 0;
      const finalQty = currentQty + incomingQty;
      const finalStatus = getAutoStatus(finalQty);

      await tx.stock.upsert({
        where: { name: purchase.item },
        update: {
          stock: finalQty,
          status: finalStatus, 
          price: purchase.amount,
          type: purchase.type,
          lastPurchasedId: id
        },
        create: {
          name: purchase.item,
          category: purchase.category || "General",
          stock: finalQty,
          unit: unitLabel,
          type: purchase.type || "STOCKS",
          price: purchase.amount,
          status: finalStatus,
          lastPurchasedId: id
        }
      });

      // 4. Catat Log History dengan referenceId ke Receipt
      await tx.history.create({
        data: {
          action: "STOCK_IN",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type || "STOCKS",
          quantity: incomingQty,
          unit: unitLabel,
          user: userName,
          referenceId: receipt.id,
          notes: `PO: ${purchase.noPO} | SJ: ${suratJalan} | Kendaraan: ${vehicleNo}`
        }
      });

      return receipt;
    });

    return NextResponse.json({ 
      message: `Penerimaan PO ${purchase.noPO} berhasil diproses`,
      receiptNo: result.receiptNo,
      receivedAt: currentTime
    }, { status: 200 });

  } catch (error) {
    console.error("RECEIVE_ERROR:", error);
    return NextResponse.json({ 
      message: "Gagal memproses penerimaan barang", 
      error: error.message 
    }, { status: 500 });
  }
}