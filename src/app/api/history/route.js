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
      // Logika penentuan tipe transaksi
      const incomingActions = [
        "STOCK_IN", 
        "PURCHASE_REQUEST", 
        "PURCHASE_APPROVED", 
        "MANUAL_ADD"
      ];
      
      const isIncoming = incomingActions.some(action => log.action.includes(action)) || log.quantity > 0;
      
      return {
        id: log.id,
        createdAt: log.createdAt,
        itemName: log.item, 
        description: log.notes || log.action, 
        // Menentukan label tipe untuk UI
        type: isIncoming ? "INCOMING" : "OUTGOING",
        quantity: Math.abs(log.quantity), 
        unit: log.unit || "Unit", 
        // Mengambil 8 karakter pertama ID sebagai Ref No jika notes kosong
        referenceId: log.id.substring(0, 8).toUpperCase(), 
        user: log.user,
        category: log.category,
        storageType: log.type // STOCKS atau INVENTORY
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