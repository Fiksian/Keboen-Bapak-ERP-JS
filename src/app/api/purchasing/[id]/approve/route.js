import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * PATCH: Mengubah status Purchase Order (PENDING, APPROVED, REJECTED)
 * Mencatat nama penyetuju ke kolom 'approvedBy' dan log ke 'History'.
 */
export async function PATCH(request, context) {
  try {
    // 1. Validasi Sesi Pengguna
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { status } = await request.json();
    const userName = session.user.name || "System Admin";

    // 2. Validasi Status yang diizinkan
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    // 3. Ambil data PO lama untuk kebutuhan audit log
    const purchase = await prisma.purchasing.findUnique({
      where: { id }
    });

    if (!purchase) {
      return NextResponse.json({ message: "Data tidak ditemukan" }, { status: 404 });
    }

    // 4. Proteksi: Jika barang sudah masuk gudang, status tidak boleh diubah lagi
    if (purchase.isReceived) {
      return NextResponse.json(
        { message: "Data terkunci. Barang sudah masuk stok/inventory." }, 
        { status: 400 }
      );
    }

    // 5. Database Transaction: Update Data & Audit Trail secara bersamaan
    const [updatedRequest] = await prisma.$transaction([
      // A. Update Status & ApprovedBy di tabel Purchasing
      prisma.purchasing.update({
        where: { id },
        data: { 
          status: status,
          // Jika status di-revoke ke PENDING, kolom approvedBy dikosongkan (null)
          // Jika status APPROVED atau REJECTED, simpan nama user yang sedang login
          approvedBy: status === 'PENDING' ? null : userName 
        },
      }),
      
      // B. Catat histori perubahan ke tabel History
      prisma.history.create({
        data: {
          action: status === 'APPROVED' ? "PURCHASE_APPROVED" : 
                  status === 'REJECTED' ? "PURCHASE_REJECTED" : "PURCHASE_REVOKED",
          item: purchase.item,
          category: purchase.category || "General",
          type: purchase.type || "STOCKS",
          quantity: parseFloat(purchase.qty) || 0,
          user: userName,
          notes: status === 'PENDING' 
            ? `Persetujuan PO ${purchase.noPO} dibatalkan (Revoke) oleh ${userName}.`
            : `PO ${purchase.noPO} (${purchase.supplier || 'Tanpa Supplier'}) status diubah menjadi ${status} oleh ${userName}.`
        }
      })
    ]);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Approve Error:", error);
    return NextResponse.json({ 
      message: "Gagal memperbarui status", 
      detail: error.message 
    }, { status: 500 });
  }
}