import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil data dari tabel History (Urutkan dari yang terbaru)
    const historyLogs = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Mapping data ke format UI Frontend
    const formattedLogs = historyLogs.map((log) => {
      // Definisikan kategori aksi agar penentuan IN/OUT lebih akurat
      const incomingActions = [
        "STOCK_IN", 
        "PURCHASE_APPROVED", 
        "MANUAL_ADD",
        "PRODUCTION_IN",     // Barang Jadi Masuk
        "PRODUCTION_REFUND"  // Bahan Baku Kembali (Batal)
      ];

      const outgoingActions = [
        "STOCK_OUT",
        "MANUAL_REMOVE",
        "PRODUCTION_OUT",    // Bahan Baku Keluar (Produksi)
        "PRODUCTION_CONSUMPTION"
      ];
      
      // Tentukan tipe berdasarkan Action Name (Prioritas Utama)
      let type = "OUTGOING"; 
      if (incomingActions.includes(log.action)) {
        type = "INCOMING";
      } else if (outgoingActions.includes(log.action)) {
        type = "OUTGOING";
      } else {
        // Fallback jika action tidak dikenal
        type = log.quantity > 0 ? "INCOMING" : "OUTGOING";
      }
      
      return {
        id: log.id,
        createdAt: log.createdAt,
        itemName: log.item, 
        description: log.notes || log.action, 
        type: type,
        quantity: Math.abs(log.quantity), 
        unit: log.unit || "Unit", 
        referenceId: log.id.substring(0, 8).toUpperCase(), 
        user: log.user,
        category: log.category,
        storageType: log.type,
        rawAction: log.action 
      };
    });

    return NextResponse.json(formattedLogs, { status: 200 });
  } catch (error) {
    console.error("GET_HISTORY_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil riwayat transaksi", error: error.message }, 
      { status: 500 }
    );
  }
}