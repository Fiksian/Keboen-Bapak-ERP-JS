// app/api/stock/batch/route.js
//
// GET  /api/stock/batch?item=JAGUNG&warehouseId=xxx  → list semua batch item
// GET  /api/stock/batch?traceRef=PROD-xxx             → trace batch dari referensi
// POST /api/stock/batch                               → manual batch IN (stok masuk manual)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createBatch,
  getAllBatchesForItem,
  traceBatchByReference,
  syncStockFromBatches,
} from "@/lib/fifoService";

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const item        = searchParams.get("item");
    const warehouseId = searchParams.get("warehouseId");
    const traceRef    = searchParams.get("traceRef");
    const status      = searchParams.get("status"); // ACTIVE | DEPLETED | ALL

    // ── Trace mode: lacak batch dari ID transaksi ──────────────────────────
    if (traceRef) {
      const trace = await prisma.batchDeduction.findMany({
        where:   { referenceId: traceRef },
        include: {
          batch: {
            include: {
              purchasing: { select: { noPO: true, supplier: true, createdAt: true } },
              receipt:    { select: { receiptNo: true, suratJalan: true, receivedAt: true, vehicleNo: true } },
              sttb:       { select: { sttbNo: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const formatted = trace.map(d => ({
        deductionId:   d.id,
        qtyDeducted:   d.qtyDeducted,
        unit:          d.unit,
        deductedAt:    d.createdAt,
        referenceType: d.referenceType,
        referenceNo:   d.referenceNo,
        batch: {
          id:          d.batch.id,
          batchNo:     d.batch.batchNo,
          itemName:    d.batch.itemName,
          supplier:    d.batch.supplierName || d.batch.purchasing?.supplier || "-",
          noPO:        d.batch.noPO         || d.batch.purchasing?.noPO     || "-",
          suratJalan:  d.batch.suratJalan   || d.batch.receipt?.suratJalan  || "-",
          sttbNo:      d.batch.sttb?.sttbNo  || "-",
          receivedAt:  d.batch.receivedAt,
          condition:   d.batch.condition,
          qtyInitial:  d.batch.qtyInitial,
          qtyRemaining:d.batch.qtyRemaining,
        },
      }));

      return NextResponse.json(formatted);
    }

    // ── Batch list mode ────────────────────────────────────────────────────
    if (!item) {
      return NextResponse.json({ message: "Parameter 'item' diperlukan" }, { status: 400 });
    }

    const where = { itemName: item };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status && status !== "ALL") where.status = status;

    const batches = await prisma.stockBatch.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        deductions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        purchasing: {
          select: { noPO: true, supplier: true, qty: true, unit: true, createdAt: true },
        },
        receipt: {
          select: { receiptNo: true, suratJalan: true, receivedAt: true, vehicleNo: true, condition: true },
        },
        sttb: { select: { sttbNo: true, status: true } },
      },
      orderBy: { receivedAt: "asc" }, // FIFO order
    });

    const summary = {
      totalActive:   batches.filter(b => b.status === "ACTIVE").length,
      totalDepleted: batches.filter(b => b.status === "DEPLETED").length,
      totalQty:      batches.filter(b => b.status === "ACTIVE").reduce((s, b) => s + b.qtyRemaining, 0),
      oldestBatch:   batches.find(b => b.status === "ACTIVE"),
    };

    return NextResponse.json({ batches, summary });
  } catch (err) {
    console.error("BATCH_GET_ERROR:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ─── POST — manual batch IN (tanpa STTB, untuk stok awal / adjustment) ───────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (!["Admin", "Super Admin"].includes(session.user.role)) {
      return NextResponse.json({ message: "Hanya Admin yang bisa input batch manual" }, { status: 403 });
    }

    const body = await request.json();
    const {
      itemName, warehouseId, qty, unit,
      supplierName, noPO, suratJalan,
      category, type, price, condition, notes,
    } = body;

    if (!itemName || !warehouseId || !qty || qty <= 0) {
      return NextResponse.json({ message: "itemName, warehouseId, dan qty wajib diisi" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat batch baru
      const batch = await createBatch(tx, itemName, warehouseId, parseFloat(qty), unit || "KG", {
        supplierName, noPO, suratJalan, category, type, price, condition,
        notes: notes || `Manual batch entry oleh ${session.user.name}`,
      });

      // 2. Update / upsert tabel Stock
      await tx.stock.upsert({
        where:  { name_warehouseId: { name: itemName, warehouseId } },
        update: { stock: { increment: parseFloat(qty) }, updatedAt: new Date() },
        create: {
          name:       itemName,
          category:   category || "General",
          stock:      parseFloat(qty),
          unit:       unit     || "KG",
          type:       type     || "STOCKS",
          price:      price    || null,
          status:     "READY",
          warehouseId,
        },
      });

      // 3. Catat history
      await tx.history.create({
        data: {
          action:      "BATCH_MANUAL_IN",
          item:        itemName,
          category:    category || "General",
          type:        type     || "STOCKS",
          quantity:    parseFloat(qty),
          unit:        unit     || "KG",
          user:        session.user.name,
          referenceId: batch.id,
          batchId:     batch.id,
          notes:       `Manual batch IN: ${batch.batchNo} | Supplier: ${supplierName || "-"} | ${notes || ""}`,
        },
      });

      return batch;
    });

    return NextResponse.json({
      message: `Batch ${result.batchNo} berhasil dibuat`,
      batch:   result,
    }, { status: 201 });
  } catch (err) {
    console.error("BATCH_POST_ERROR:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}