import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET: Mengambil semua daftar Purchase Order
 * Mengambil data terbaru berdasarkan waktu pembuatan
 */
export async function GET() {
  try {
    // 1. Cek Sesi (Keamanan)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil data dari database
    const purchases = await prisma.purchasing.findMany({
      orderBy: {
        createdAt: 'desc', // Data terbaru di atas
      },
      include: {
        // Sertakan data penerimaan jika ada (untuk melacak surat jalan/penerima)
        receipts: true, 
      },
    });

    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    console.error("GET_PURCHASING_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memuat data Purchasing", detail: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Menghapus Purchase Order berdasarkan ID
 * Proteksi: Tidak bisa menghapus jika barang sudah diterima (isReceived: true)
 */
export async function DELETE(request, { params }) {
  try {
    // 1. Cek Sesi (Keamanan)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; 

    // 2. Ambil data PO untuk pengecekan status
    const existingPurchase = await prisma.purchasing.findUnique({
      where: { id: id },
    });

    if (!existingPurchase) {
      return NextResponse.json({ message: "Data PO tidak ditemukan" }, { status: 404 });
    }

    // 3. Validasi: Cegah penghapusan jika barang sudah masuk gudang
    if (existingPurchase.isReceived) {
      return NextResponse.json(
        { message: "Penghapusan ditolak: PO ini sudah diterima/masuk gudang." }, 
        { status: 400 }
      );
    }

    // 4. Lakukan penghapusan (Data akan terhapus permanen dari Purchasing)
    await prisma.purchasing.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "PO berhasil dihapus dari sistem" }, { status: 200 });
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus PO", detail: error.message },
      { status: 500 }
    );
  }
}