import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET: Mengambil semua daftar Purchase Order
 * Diurutkan berdasarkan tanggal terbaru
 */
export async function GET() {
  try {
    const requests = await prisma.purchasing.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("GET_PURCHASING_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data pengadaan" }, { status: 500 });
  }
}

/**
 * POST: Membuat Purchase Order Baru secara Otomatis
 * - Nomor PO dibuat otomatis (PO/YYYYMMDD/RANDOM)
 * - Pembuat (requestedBy) diambil otomatis dari session login
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Proteksi Sesi: Hanya user login yang bisa membuat PO
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized: Silakan login terlebih dahulu" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { supplier, item, qty, amount, category, type } = body;
    
    // Nama pengaju diambil paksa dari sesi server (mencegah pemalsuan nama di frontend)
    const userName = session.user.name || "Unknown User";

    // 2. OTOMATISASI NOMOR PO
    // Format: PO/20260121/X7R2 (PO/Tanggal/Random 4 digit)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const autoNoPO = `PO/${dateStr}/${randomSuffix}`;

    // 3. Validasi Input Dasar (Tanpa noPO karena sudah otomatis)
    if (!item || !qty || !amount) {
      return NextResponse.json(
        { message: "Data tidak lengkap (Item, Qty, dan Harga wajib diisi)" },
        { status: 400 }
      );
    }

    // 4. Parsing angka untuk tabel History
    const qtyValue = parseFloat(qty) || 0;
    const amountValue = amount ? amount.toString() : "0";

    // 5. Database Transaction: Atomic update
    const [newRequest] = await prisma.$transaction([
      // A. Simpan data ke tabel Purchasing dengan Nomor PO Otomatis
      prisma.purchasing.create({
        data: {
          noPO: autoNoPO,
          supplier: supplier || "Supplier Umum",
          item: item,
          qty: qty,             
          amount: amountValue,  
          requestedBy: userName,
          approvedBy: null,     
          category: category || "General", 
          type: type || "STOCKS", 
          status: "PENDING",
          isReceived: false
        }
      }),
      // B. Catat log audit ke tabel History
      prisma.history.create({
        data: {
          action: "PURCHASE_REQUEST_AUTO",
          item: item,
          category: category || "General",
          type: type || "STOCKS",
          quantity: qtyValue,
          user: userName,
          notes: `Membuat PO Otomatis: ${autoNoPO} oleh ${userName}.`
        }
      })
    ]);

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST_PURCHASING_ERROR:", error);
    
    // Cek jika terjadi error duplikasi noPO yang jarang terjadi (race condition)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Terjadi konflik nomor PO otomatis, silakan coba lagi." }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Gagal membuat permintaan pengadaan", error: error.message }, 
      { status: 500 }
    );
  }
}