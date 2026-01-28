import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { convertQty, getBaseUnit, cleanNumber } from "@/lib/unitConverter";

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
    
    const targetUnit = getBaseUnit(unit);
    
    const convertedInputQty = convertQty(stock, unit, targetUnit);
    
    const inputQty = cleanNumber(convertedInputQty);

    const existingStock = await prisma.stock.findUnique({
      where: { name: name }
    });

    const totalQty = existingStock 
      ? cleanNumber(existingStock.stock + inputQty) 
      : inputQty;

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
        stock: totalQty,
        unit: targetUnit,
        price: price?.toString(),
        category: category,
        status: determineStatus(totalQty), 
        updatedAt: new Date(),
      },
      create: {
        name: name,
        category: category || "General",
        stock: inputQty,
        unit: targetUnit,
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