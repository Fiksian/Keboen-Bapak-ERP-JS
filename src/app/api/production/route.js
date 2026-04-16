// app/api/production/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  deductStockFIFO,
  createBatch,
  syncStockFromBatches,
} from "@/lib/fifoService";

// ─── Generate nomor batch auto ──────────────────────────────────────────────
const generateNoBatch = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `PROD/${year}/${month}/`;

  const last = await prisma.production.findFirst({
    where: { noBatch: { startsWith: prefix } },
    orderBy: { noBatch: "desc" },
  });

  let nextNumber = 1;
  if (last?.noBatch) {
    const parts = last.noBatch.split("/");
    const lastSequence = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastSequence)) nextNumber = lastSequence + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};

// ─── Kalkulasi HPP weighted average dari batch allocation ─────────────────────
const calcWeightedHPP = (ingredients) => {
  let totalCostAll = 0;
  let totalQtyAll = 0;

  for (const comp of ingredients) {
    const alloc = Array.isArray(comp.batchAllocation)
      ? comp.batchAllocation
      : JSON.parse(comp.batchAllocation || "[]");

    for (const a of alloc) {
      const price = parseFloat(a.price) || 0;
      const qty = parseFloat(a.qty) || 0;
      totalCostAll += price * qty;
      totalQtyAll += qty;
    }
  }

  return {
    totalCost: totalCostAll,
    avgUnitCost: totalQtyAll > 0 ? totalCostAll / totalQtyAll : 0,
  };
};

// =============================================================================
// GET /api/production
// =============================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const orders = await prisma.production.findMany({
      where,
      include: {
        components: true,
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET_PRODUCTION_ERROR:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// =============================================================================
// POST /api/production
// =============================================================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ─ Parse JSON dari request body ───────────────────────────────────────────
    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { message: `Invalid JSON: ${parseError.message}` },
        { status: 400 }
      );
    }

    const { productName, targetQty, targetUnit, date, ingredients } = body;
    const userName = session.user.name || "System";

    // ─ Validasi input ─────────────────────────────────────────────────────────
    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { message: "Product name wajib diisi." },
        { status: 400 }
      );
    }

    if (!targetQty || parseFloat(targetQty) <= 0) {
      return NextResponse.json(
        { message: "Target qty harus > 0." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { message: "Tanggal produksi wajib diisi." },
        { status: 400 }
      );
    }

    if (!ingredients?.length) {
      return NextResponse.json(
        { message: "Minimal satu bahan baku harus diisi." },
        { status: 400 }
      );
    }

    // ─ Validasi setiap ingredient ─────────────────────────────────────────────
    for (const ing of ingredients) {
      const qty = parseFloat(ing.qtyNeeded) || 0;
      const whId = ing.warehouseId;

      if (!ing.itemName || !ing.itemName.trim()) {
        return NextResponse.json(
          { message: `Nama bahan baku tidak boleh kosong.` },
          { status: 400 }
        );
      }

      if (qty <= 0) {
        return NextResponse.json(
          { message: `Qty untuk "${ing.itemName}" harus > 0.` },
          { status: 400 }
        );
      }

      if (!whId) {
        return NextResponse.json(
          { message: `Pilih gudang sumber untuk bahan "${ing.itemName}".` },
          { status: 400 }
        );
      }

      const alloc = Array.isArray(ing.batchAllocation)
        ? ing.batchAllocation
        : JSON.parse(ing.batchAllocation || "[]");

      const allocQty = alloc.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);

      if (allocQty < qty) {
        return NextResponse.json(
          {
            message: `Batch FIFO untuk "${ing.itemName}" tidak cukup. Dibutuhkan: ${qty}, dialokasikan: ${allocQty}.`,
          },
          { status: 400 }
        );
      }

      // Validasi batch exists
      for (const a of alloc) {
        if (!a.batchId) {
          return NextResponse.json(
            { message: `Batch ID tidak valid untuk "${ing.itemName}".` },
            { status: 400 }
          );
        }

        const batch = await prisma.stockBatch.findUnique({
          where: { id: a.batchId },
        });

        if (!batch) {
          return NextResponse.json(
            { message: `Batch ${a.batchNo} tidak ditemukan.` },
            { status: 404 }
          );
        }

        if (batch.qtyRemaining < a.qty) {
          return NextResponse.json(
            {
              message: `Batch ${a.batchNo} tidak cukup. Tersisa: ${batch.qtyRemaining}, diminta: ${a.qty}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ─ Generate batch number ──────────────────────────────────────────────────
    const noBatch = await generateNoBatch();

    // ─ Hitung HPP awal ────────────────────────────────────────────────────────
    const { totalCost, avgUnitCost } = calcWeightedHPP(ingredients);
    const totalInput =
      ingredients.reduce((s, i) => s + (parseFloat(i.qtyNeeded) || 0), 0) || 1;
    const tQty = parseFloat(targetQty);
    const rendemen = (tQty / totalInput) * 100;
    const lossWarning = rendemen < 95;

    // ─ Create production order ────────────────────────────────────────────────
    const production = await prisma.production.create({
      data: {
        noBatch,
        productName: productName.toUpperCase(),
        targetQty: tQty,
        targetUnit: (targetUnit || "UNIT").toUpperCase(),
        status: "PENDING_QC_PROD",
        startDate: new Date(date),
        createdBy: userName,
        totalCost,
        unitCost: avgUnitCost,
        hpp: avgUnitCost,
        rendemen,
        lossWarning,
        components: {
          create: ingredients.map((ing) => ({
            itemName: ing.itemName.toUpperCase(),
            qtyNeeded: parseFloat(ing.qtyNeeded),
            unit: (ing.unit || "KG").toUpperCase(),
            batchAllocation: JSON.stringify(
              Array.isArray(ing.batchAllocation)
                ? ing.batchAllocation
                : JSON.parse(ing.batchAllocation || "[]")
            ),
            unitPrice: parseFloat(ing.unitPrice) || avgUnitCost,
            totalPrice: parseFloat(ing.totalPrice) || totalCost,
            stockAvailable: parseFloat(ing.stockAvailable) || 0,
            warehouseId: ing.warehouseId || null,
          })),
        },
      },
      include: { components: true },
    });

    // ─ Catat history ──────────────────────────────────────────────────────────
    await prisma.history.create({
      data: {
        action: "PRODUCTION_CREATED",
        item: productName.toUpperCase(),
        category: "Production",
        type: "STOCKS",
        quantity: tQty,
        unit: targetUnit || "UNIT",
        user: userName,
        referenceId: production.id,
        notes: `Batch ${noBatch} dibuat, menunggu approval QC. HPP est: Rp ${avgUnitCost.toLocaleString("id-ID")}/unit`,
      },
    });

    return NextResponse.json(production, { status: 201 });
  } catch (error) {
    console.error("POST_PRODUCTION_ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/production
// =============================================================================
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { message: `Invalid JSON: ${parseError.message}` },
        { status: 400 }
      );
    }

    const { id, status, notes } = body;
    const userName = session.user.name || "System";

    if (status !== "CANCELLED") {
      return NextResponse.json(
        {
          message:
            "Gunakan endpoint /api/production/[id]/approve untuk proses approval.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.production.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json(
        { message: "Production order tidak ditemukan." },
        { status: 404 }
      );
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json(
        {
          message: "Production yang sudah COMPLETED tidak bisa dibatalkan.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.production.update({
      where: { id },
      data: {
        status: "CANCELLED",
        rejectedBy: userName,
        rejectedAt: new Date(),
        rejectedNotes: notes || "Dibatalkan",
      },
    });

    await prisma.history.create({
      data: {
        action: "PRODUCTION_CANCELLED",
        item: order.productName,
        category: "Production",
        type: "STOCKS",
        quantity: order.targetQty,
        unit: order.targetUnit || "UNIT",
        user: userName,
        referenceId: id,
        notes: `Batch ${order.noBatch} dibatalkan. ${notes || ""}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH_PRODUCTION_ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}