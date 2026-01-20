import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // 1. Verifikasi Sesi (Opsional, tapi disarankan untuk Audit Trail)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil data dari tabel History
    // Kita urutkan dari yang terbaru (desc) agar muncul di atas tabel
    const historyLogs = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Mapping data ke format yang diminta Frontend (HistoryTransaksi.js)
    // Frontend Anda menggunakan field: itemName, description, type, quantity, unit, referenceId
    const formattedLogs = historyLogs.map((log) => {
      const isIncoming = log.action.includes("RECEIVED") || log.action.includes("REQUEST") || log.quantity > 0;
      
      return {
        id: log.id,
        createdAt: log.createdAt,
        itemName: log.item, 
        description: log.notes || log.action, 
        type: isIncoming ? "INCOMING" : "OUTGOING",
        quantity: Math.abs(log.quantity), 
        unit: log.unit || "Unit", 
        referenceId: log.id.split('-')[0].toUpperCase(), 
        user: log.user
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
