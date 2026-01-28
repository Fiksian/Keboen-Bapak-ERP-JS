import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Fungsi Helper untuk menangani Floating Point Error.
 * Membulatkan angka ke 4 desimal dan memaksa nilai mendekati nol menjadi nol bersih.
 */
const cleanNumber = (value) => {
  const rounded = parseFloat(parseFloat(value).toFixed(4));
  return Math.abs(rounded) < 0.00001 ? 0 : rounded;
};

export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(stocks);
  } catch (error) {
    console.error("GET_STOCK_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data stok" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized: Silakan login terlebih dahulu" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, category, stock, unit, type, price, status } = body;
    
    // 1. Bersihkan input qty
    const inputQty = cleanNumber(stock);

    // 2. Cari data stok yang sudah ada untuk kalkulasi total presisi
    const existingStock = await prisma.stock.findUnique({
      where: { name: name }
    });

    // 3. Hitung total stok baru secara manual agar bisa dibulatkan sebelum masuk DB
    const totalQty = existingStock 
      ? cleanNumber(existingStock.stock + inputQty) 
      : inputQty;

    // 4. Tentukan status berdasarkan TOTAL stok, bukan hanya input
    const determineStatus = (qty) => {
      if (qty <= 0) return "OUT_OF_STOCK";
      if (qty <= 10) return "LIMITED";
      return status || "READY";
    };

    const result = await prisma.stock.upsert({
      where: {
        name: name,
      },
      update: {
        // Gunakan nilai total yang sudah dibersihkan, bukan increment bawaan prisma
        // agar kita punya kontrol penuh atas pembulatan desimal.
        stock: totalQty,
        price: price?.toString(),
        category: category,
        status: determineStatus(totalQty), 
        updatedAt: new Date(),
      },
      create: {
        name: name,
        category: category || "General",
        stock: inputQty,
        unit: unit || "Unit",
        type: type || "STOCKS",
        price: price?.toString() || "0",
        status: determineStatus(inputQty),
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST_STOCK_ERROR:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Gagal: Pastikan nama barang unik di database" }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Gagal memproses data stok" }, { status: 500 });
  }
}