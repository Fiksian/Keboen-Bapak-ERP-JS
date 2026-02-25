import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { ids, status } = await request.json();
    const userName = session.user.name || "System Admin";

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "ID tidak valid atau kosong" }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    const purchases = await prisma.purchasing.findMany({
      where: { id: { in: ids } }
    });

    const lockedItems = purchases.filter(p => p.isReceived);
    if (lockedItems.length > 0) {
      return NextResponse.json({ 
        message: "Beberapa data terkunci karena barang sudah masuk stok." 
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchasing.updateMany({
        where: { id: { in: ids } },
        data: { 
          status: status,
          approvedBy: status === 'PENDING' ? null : userName 
        },
      });

      const historyLogs = purchases.map(p => ({
        action: status === 'APPROVED' ? "PURCHASE_APPROVED" : 
                status === 'REJECTED' ? "PURCHASE_REJECTED" : "PURCHASE_REVOKED",
        item: p.item,
        category: p.category || "General",
        type: p.type || "STOCKS",
        quantity: p.qty || 0,
        unit: p.unit || "Unit",
        user: userName,
        notes: `[BULK] PO ${p.noPO}: Status menjadi ${status}.`
      }));

      await tx.history.createMany({
        data: historyLogs
      });

      return updated;
    });

    return NextResponse.json({ 
      message: `${result.count} item berhasil diperbarui`, 
      count: result.count 
    }, { status: 200 });

  } catch (error) {
    console.error("Bulk Approve Error:", error);
    return NextResponse.json({ 
      message: "Gagal memperbarui status massal", 
      detail: error.message 
    }, { status: 500 });
  }
}