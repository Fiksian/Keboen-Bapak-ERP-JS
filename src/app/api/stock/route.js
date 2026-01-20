import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 1. Ambil semua data stok untuk ditampilkan di Tabel (Dashboard & Inventory)
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

// 2. Fungsi POST (Manual entry atau integrasi sistem)
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
    
    const stockValue = parseFloat(body.stock) || 0;
    const finalStatus = stockValue <= 0 ? "OUT_OF_STOCK" : (body.status || "READY");

    const newStock = await prisma.stock.create({
      data: {
        name: body.name,
        category: body.category || "General",
        stock: stockValue,
        unit: body.unit || "Unit",
        type: body.type || "STOCKS",
        price: body.price?.toString() || "0",
        status: finalStatus,
      }
    });

    return NextResponse.json(newStock, { status: 201 });
  } catch (error) {
    console.error("POST_STOCK_ERROR:", error);
    return NextResponse.json({ message: "Gagal menambah data stok" }, { status: 500 });
  }
}