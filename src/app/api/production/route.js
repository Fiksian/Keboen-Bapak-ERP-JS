import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { convertQty } from "@/lib/unitConverter";

export async function GET() {
  try {
    const orders = await prisma.production.findMany({
      include: { components: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET_PRODUCTION_ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { productName, targetQty, date, ingredients } = body;
    const userName = session.user.name || "System";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePattern = `${year}/${month}`; 

    const lastBatch = await prisma.production.findFirst({
      where: { noBatch: { startsWith: `PROD/${datePattern}` } },
      orderBy: { createdAt: 'desc' } 
    });

    let nextNumber = 1;
    if (lastBatch?.noBatch) {
      const parts = lastBatch.noBatch.split('/');
      const lastSequence = parseInt(parts[parts.length - 1]); 
      if (!isNaN(lastSequence)) nextNumber = lastSequence + 1;
    }

    const autoNoBatch = `PROD/${datePattern}/${String(nextNumber).padStart(3, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      const processedIngredients = [];

      for (const item of ingredients) {
        const stockItem = await tx.stock.findFirst({
          where: { name: { equals: item.itemName, mode: 'insensitive' } }
        });

        if (!stockItem) throw new Error(`Bahan "${item.itemName}" tidak ditemukan.`);

        const systemQty = convertQty(parseFloat(item.qtyNeeded), item.unit, stockItem.unit);

        processedIngredients.push({
          itemName: stockItem.name,
          qtyNeeded: systemQty,
          unit: stockItem.unit,
          category: stockItem.category
        });
      }

      const order = await tx.production.create({
        data: {
          productName: productName.toUpperCase(),
          noBatch: autoNoBatch,
          targetQty: parseFloat(targetQty),
          status: "IN_PROGRESS",
          startDate: new Date(date),
          createdBy: userName,
          components: {
            create: processedIngredients.map(ing => ({
              itemName: ing.itemName,
              qtyNeeded: ing.qtyNeeded,
              unit: ing.unit
            }))
          }
        }
      });

      for (const ing of processedIngredients) {
        const updated = await tx.stock.updateMany({
          where: { 
            name: ing.itemName, 
            stock: { gte: ing.qtyNeeded }
          },
          data: { stock: { decrement: ing.qtyNeeded } }
        });

        if (updated.count === 0) {
          throw new Error(`Stok ${ing.itemName} tidak cukup untuk memulai produksi.`);
        }

        await tx.history.create({
          data: {
            action: "PRODUCTION_OUT",
            item: ing.itemName,
            category: ing.category,
            type: "STOCKS",
            quantity: -ing.qtyNeeded,
            unit: ing.unit,
            user: userName,
            referenceId: order.noBatch,
            notes: `PEMAKAIAN BAHAN UNTUK BATCH: ${order.noBatch}`
          }
        });
      }
      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST_PRODUCTION_ERROR:", error.message);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, actualQty, notes } = body; 
    const userName = session.user.name || "System";

    const result = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.production.findUnique({
        where: { id },
        include: { components: true }
      });

      if (!currentOrder || currentOrder.status !== "IN_PROGRESS") {
        throw new Error("Batch tidak ditemukan atau sudah tidak aktif.");
      }

      if (status === "COMPLETED") {
        const finalQty = parseFloat(actualQty);

        const order = await tx.production.update({
          where: { id },
          data: {
            status: "COMPLETED",
            actualQty: finalQty,
            endDate: new Date(),
            notes: notes || "Produksi selesai"
          }
        });

        const updatedStock = await tx.stock.upsert({
          where: { name: order.productName },
          update: { 
            stock: { increment: finalQty }, 
            status: "READY" 
          },
          create: {
            name: order.productName,
            category: "FINISHED_GOODS",
            stock: finalQty,
            unit: "UNIT",
            type: "STOCKS",
            status: "READY"
          }
        });

        await tx.history.create({
          data: {
            action: "PRODUCTION_IN",
            item: order.productName,
            category: "FINISHED_GOODS",
            type: "STOCKS",
            quantity: finalQty,
            unit: "UNIT",
            user: userName,
            referenceId: order.noBatch,
            notes: `HASIL JADI PRODUKSI BATCH: ${order.noBatch}. Total stok: ${updatedStock.stock}`
          }
        });
        return order;
      }

      if (status === "CANCELLED") {
        const order = await tx.production.update({
          where: { id },
          data: { status: "CANCELLED", notes: notes || "Dibatalkan" }
        });

        for (const comp of currentOrder.components) {
          await tx.stock.update({
            where: { name: comp.itemName },
            data: { stock: { increment: comp.qtyNeeded } }
          });

          await tx.history.create({
            data: {
              action: "PRODUCTION_REFUND",
              item: comp.itemName,
              category: "RAW_MATERIAL",
              type: "STOCKS",
              quantity: comp.qtyNeeded,
              unit: comp.unit,
              user: userName,
              referenceId: order.noBatch,
              notes: `PENGEMBALIAN BAHAN: BATCH ${order.noBatch} DIBATALKAN`
            }
          });
        }
        return order;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH_PRODUCTION_ERROR:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}