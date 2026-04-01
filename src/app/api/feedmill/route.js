import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [stocks, history] = await Promise.all([
      // Sesuai model Stock: filter category "RAW_MATERIAL" atau "BAHAN_BAKU"
      prisma.stock.findMany({
        where: { type: "STOCKS" } // Sesuai default di schema atau sesuaikan category
      }),
      // Sesuai model History
      prisma.history.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);
    return NextResponse.json({ stocks, history });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { bahanBakuId, jumlahPakai, jenisHasil, batchNo, userEmail } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validasi Stok (Model Stock menggunakan field 'stock' bukan 'qty')
      const currentStock = await tx.stock.findUnique({ 
        where: { id: bahanBakuId } 
      });

      if (!currentStock || currentStock.stock < jumlahPakai) {
        throw new Error(`Stok ${currentStock?.name || 'Item'} tidak mencukupi`);
      }

      // 2. Update Stok (Kurangi field 'stock')
      await tx.stock.update({
        where: { id: bahanBakuId },
        data: { stock: { decrement: parseFloat(jumlahPakai) } }
      });

      // 3. Buat Record Produksi (Model Production)
      const production = await tx.production.create({
        data: {
          noBatch: batchNo,
          productName: jenisHasil,
          targetQty: parseFloat(jumlahPakai),
          status: "COMPLETED", // Menggunakan Enum ProductionStatus
          createdBy: userEmail,
          // Relasi ke ProductionComponent
          components: {
            create: {
              itemName: currentStock.name,
              qtyNeeded: parseFloat(jumlahPakai),
              unit: currentStock.unit
            }
          }
        }
      });

      // 4. Catat ke History (Model History)
      await tx.history.create({
        data: {
          action: "MIXING_PRODUCTION",
          item: currentStock.name,
          category: currentStock.category,
          type: "OUT",
          quantity: parseFloat(jumlahPakai),
          unit: currentStock.unit,
          user: userEmail,
          referenceId: batchNo, // Menyimpan No Batch sebagai referensi
          notes: `Produksi: ${jenisHasil}`
        }
      });

      return production;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}