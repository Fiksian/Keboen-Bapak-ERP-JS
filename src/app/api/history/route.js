import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const historyLogs = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedLogs = historyLogs.map((log) => {
      const incomingActions = [
        "STOCK_IN", 
        "PURCHASE_APPROVED", 
        "MANUAL_ADD",
        "PRODUCTION_IN",
        "PRODUCTION_REFUND"
      ];

      const outgoingActions = [
        "STOCK_OUT",
        "MANUAL_REMOVE",
        "PRODUCTION_OUT",
        "PRODUCTION_CONSUMPTION"
      ];
      
      let type = "OUTGOING"; 
      if (incomingActions.includes(log.action)) {
        type = "INCOMING";
      } else if (outgoingActions.includes(log.action)) {
        type = "OUTGOING";
      } else {
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