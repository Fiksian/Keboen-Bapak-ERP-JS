import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { convertQty, cleanNumber } from "@/lib/unitConverter";

async function getRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await request.json();
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }
  return {};
}

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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await getRequestBody(request);
    const { 
      name, 
      category, 
      stock, 
      unit, 
      type, 
      price, 
      status,
      suratJalan,
      vehicleNo,
      condition 
    } = body;
    
    const inputUnit = unit || "KG"; 
    const inputQty = cleanNumber(parseFloat(stock));

    const existingStock = await prisma.stock.findUnique({
      where: { name: name }
    });

    const currentQty = existingStock ? cleanNumber(existingStock.stock) : 0;
    const currentUnit = existingStock ? existingStock.unit : inputUnit;

    let adjustedInputQty = inputQty;
    if (existingStock && currentUnit.toUpperCase() !== inputUnit.toUpperCase()) {
        adjustedInputQty = convertQty(inputQty, inputUnit, currentUnit);
    }

    const totalQty = cleanNumber(currentQty + adjustedInputQty);

    if (adjustedInputQty < 0 && (totalQty < 0)) {
      return NextResponse.json({ 
          success: false,
          message: `Gagal: Stok tidak mencukupi.`,
          detail: `Tersedia: ${currentQty} ${currentUnit}. Ingin mengurangi: ${Math.abs(adjustedInputQty)} ${currentUnit}`
      }, { status: 400 });
    }

    const determineStatus = (qty, unitName) => {
      const u = unitName.toUpperCase();
      let checkValInKg = qty;
      if (u === 'TON') checkValInKg = qty * 1000;
      if (u === 'GRAM' || u === 'GR') checkValInKg = qty / 1000;
      if (u === 'SAK' || u === 'SAKCS') checkValInKg = qty * 50;

      if (checkValInKg <= 0) return "EMPTY"; 
      if (checkValInKg <= 50) return "LIMITED";
      return status || "READY";
    };

    const result = await prisma.stock.upsert({
      where: { name: name },
      update: {
        stock: totalQty,
        category: category || existingStock.category,
        status: determineStatus(totalQty, currentUnit), 
        updatedAt: new Date(),
      },
      create: {
        name: name,
        category: category || "General",
        stock: inputQty,
        unit: inputUnit,
        type: type || "STOCKS",
        price: price?.toString() || "0",
        status: determineStatus(inputQty, inputUnit),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stok berhasil diperbarui melalui sistem " + (suratJalan ? "Arrival" : "Manual"),
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error("POST_STOCK_ERROR:", error);
    return NextResponse.json({ message: "Gagal memproses data" }, { status: 500 });
  }
}