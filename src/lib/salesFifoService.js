// lib/salesFifoService.js  — OPTIMIZED
//
// Perubahan utama dari versi lama:
//   1. deductSalesBatches: ambil SEMUA batch sekaligus dengan findMany di awal
//      (eliminasi N+1 — tidak ada lagi findUnique di dalam loop)
//   2. Validasi stok sebelum mulai deduction (fail-fast, hindari partial state)
//   3. Response lean: kembalikan hanya data yang diperlukan

import prisma from "@/lib/prisma";
import { syncStockFromBatches } from "@/lib/fifoService";

// ─── Helper ───────────────────────────────────────────────────────────────────
const effQty = (b) => Math.max(0, b.qtyRemaining - (b.reservedQty || 0));

const parseAlloc = (raw) => {
  if (!raw) return [];
  try { return typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); }
  catch { return []; }
};

// ─── 1. Auto-FIFO allocation ──────────────────────────────────────────────────
export const computeSalesFIFO = async (itemName, warehouseId, qtyNeeded) => {
  const batches = await prisma.stockBatch.findMany({
    where: {
      itemName,
      status:       "ACTIVE",
      qtyRemaining: { gt: 0 },
      ...(warehouseId ? { warehouseId } : {}),
    },
    orderBy: { receivedAt: "asc" },
  });

  let remaining     = parseFloat(qtyNeeded) || 0;
  const allocations = [];

  for (const b of batches) {
    if (remaining <= 0) break;
    const available = effQty(b);
    if (available <= 0) continue;
    const take = parseFloat(Math.min(remaining, available).toFixed(6));
    allocations.push({
      batchId:     b.id,
      batchNo:     b.batchNo,
      qty:         take,
      price:       b.price || "0",
      supplier:    b.supplierName || "-",
      noPO:        b.noPO         || "-",
      receivedAt:  b.receivedAt,
      warehouseId: b.warehouseId,
    });
    remaining -= take;
  }

  const totalAvailable = batches.reduce((s, b) => s + effQty(b), 0);
  const totalCost      = allocations.reduce((s, a) => s + (parseFloat(a.price) || 0) * a.qty, 0);
  const totalAllocQty  = allocations.reduce((s, a) => s + a.qty, 0);

  return {
    success:        remaining <= 0,
    allocations,
    shortfall:      Math.max(0, remaining),
    totalAllocated: totalAllocQty,
    totalAvailable,
    totalCost,
    unitCost:       totalAllocQty > 0 ? totalCost / totalAllocQty : 0,
    message: remaining > 0
      ? `Stok FIFO "${itemName}" tidak cukup. Tersedia: ${totalAvailable.toFixed(2)}, dibutuhkan: ${qtyNeeded}.`
      : `Auto-FIFO OK: ${allocations.length} batch dialokasikan.`,
  };
};

// ─── 2. Validasi alokasi manual ───────────────────────────────────────────────
export const validateSalesAllocation = async (itemName, allocations, qtyNeeded) => {
  if (!allocations?.length) return { valid: false, errors: ["Tidak ada alokasi."], allocations: [], totalAllocated: 0 };

  // Satu query untuk semua batch sekaligus
  const batchIds    = allocations.map((a) => a.batchId).filter(Boolean);
  const batchMap    = new Map(
    (await prisma.stockBatch.findMany({ where: { id: { in: batchIds } } }))
      .map((b) => [b.id, b])
  );

  const errors      = [];
  const enriched    = [];
  let totalAllocated = 0;

  for (const a of allocations) {
    const batch = batchMap.get(a.batchId);
    if (!batch) { errors.push(`Batch ${a.batchNo || a.batchId} tidak ditemukan.`); continue; }
    if (batch.status !== "ACTIVE") { errors.push(`Batch ${batch.batchNo} tidak aktif (${batch.status}).`); continue; }
    const qty = parseFloat(a.qty) || 0;
    if (qty <= 0) { errors.push(`Qty untuk batch ${batch.batchNo} harus > 0.`); continue; }
    if (qty > batch.qtyRemaining) {
      errors.push(`Batch ${batch.batchNo}: diminta ${qty}, tersisa ${batch.qtyRemaining.toFixed(2)}.`);
      continue;
    }
    enriched.push({ ...a, qty, price: batch.price || "0", supplier: batch.supplierName || "-", noPO: batch.noPO || "-" });
    totalAllocated += qty;
  }

  if (totalAllocated < parseFloat(qtyNeeded)) {
    errors.push(`Total alokasi (${totalAllocated.toFixed(2)}) kurang dari kebutuhan (${qtyNeeded}).`);
  }

  return { valid: errors.length === 0, errors, allocations: enriched, totalAllocated };
};

// ─── 3. Deduct FIFO — OPTIMIZED ───────────────────────────────────────────────
// Returns: { deductedItems[], totalCost, marginTotal }
export const deductSalesBatches = async (tx, saleId, invoiceId, approver) => {
  // ── 1 query: ambil sale + semua items sekaligus ────────────────────────────
  const sale = await tx.penjualan.findUnique({
    where:   { id: saleId },
    include: { items: true },
  });
  if (!sale) throw new Error("Penjualan tidak ditemukan.");

  // ── Kumpulkan semua batchId dari semua items ───────────────────────────────
  const allAllocations = [];
  const itemAllocMap   = new Map(); // itemId → allocations

  for (const item of sale.items) {
    let alloc = parseAlloc(item.batchAllocation);
    if (!alloc.length) {
      // Fallback Auto-FIFO (sync, di dalam tx)
      const fifo = await computeSalesFIFO(item.productName, item.warehouseId, item.quantity);
      if (!fifo.success) throw new Error(fifo.message);
      alloc = fifo.allocations;
    }
    itemAllocMap.set(item.id, alloc);
    allAllocations.push(...alloc);
  }

  // ── 1 query: fetch semua batch yang dibutuhkan ────────────────────────────
  const allBatchIds = [...new Set(allAllocations.map((a) => a.batchId))];
  const batchList   = await tx.stockBatch.findMany({ where: { id: { in: allBatchIds } } });
  const batchMap    = new Map(batchList.map((b) => [b.id, b]));

  // ── Validasi stok SEBELUM write (fail-fast) ───────────────────────────────
  // Hitung total kebutuhan per batch dari semua items
  const batchDemand = new Map();
  for (const [, alloc] of itemAllocMap) {
    for (const a of alloc) {
      batchDemand.set(a.batchId, (batchDemand.get(a.batchId) || 0) + parseFloat(a.qty));
    }
  }
  for (const [bId, demand] of batchDemand) {
    const batch = batchMap.get(bId);
    if (!batch) throw new Error(`Batch ${bId} tidak ditemukan.`);
    if (batch.qtyRemaining < demand) {
      throw new Error(`Batch ${batch.batchNo} tidak cukup. Tersisa ${batch.qtyRemaining.toFixed(2)}, dibutuhkan ${demand.toFixed(2)}.`);
    }
  }

  // ── Eksekusi deduction ─────────────────────────────────────────────────────
  const deductedItems      = [];
  const batchDeductionRows = [];
  const historyRows        = [];
  let totalSalesCost        = 0;
  let totalMargin           = 0;
  const now                 = new Date();

  // Track running qtyRemaining per batch (karena mungkin satu batch dipakai oleh 2 items)
  const runningQty = new Map(batchList.map((b) => [b.id, b.qtyRemaining]));

  for (const item of sale.items) {
    const alloc       = itemAllocMap.get(item.id) || [];
    let lineCostTotal = 0;

    for (const a of alloc) {
      const batch       = batchMap.get(a.batchId);
      const deductQty   = parseFloat(a.qty);
      const unitPrice   = parseFloat(batch.price) || 0;
      const lineCost    = unitPrice * deductQty;
      lineCostTotal    += lineCost;
      totalSalesCost   += lineCost;

      const currentRemaining = runningQty.get(batch.id);
      const newQtyRemaining  = parseFloat((currentRemaining - deductQty).toFixed(6));
      const isDepleted       = newQtyRemaining <= 0;
      runningQty.set(batch.id, newQtyRemaining);

      // Update batch (per batch, 1 update per unique batchId)
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          qtyRemaining: newQtyRemaining,
          reservedQty:  Math.max(0, (batch.reservedQty || 0) - deductQty),
          status:       isDepleted ? "DEPLETED" : "ACTIVE",
          depletedAt:   isDepleted ? now : null,
          updatedAt:    now,
        },
      });

      batchDeductionRows.push({
        batchId:       batch.id,
        referenceId:   saleId,
        referenceType: "SALES",
        referenceNo:   invoiceId,
        qtyDeducted:   deductQty,
        unit:          batch.unit,
        deductedBy:    approver,
        notes:         `${invoiceId} | ${batch.batchNo} | ${batch.supplierName || "-"} | @Rp${unitPrice.toLocaleString("id-ID")}`,
      });

      historyRows.push({
        action:      "SALES_OUT",
        item:        item.productName,
        category:    "Sales",
        type:        "STOCKS",
        quantity:    -deductQty,
        unit:        item.unit || "Unit",
        user:        approver,
        referenceId: saleId,
        batchId:     batch.id,
        notes:       `${invoiceId} | FIFO: ${batch.batchNo} | ${batch.supplierName || "-"} | HPP @Rp${unitPrice.toLocaleString("id-ID")}`,
      });

      deductedItems.push({
        itemName:  item.productName,
        batchNo:   batch.batchNo,
        batchId:   batch.id,
        qty:       deductQty,
        unitPrice,
        lineCost,
        supplier:  batch.supplierName || "-",
        noPO:      batch.noPO         || "-",
        depleted:  isDepleted,
      });
    }

    const itemMargin = item.price * item.quantity - lineCostTotal;
    totalMargin     += itemMargin;

    // Update PenjualanItem
    await tx.penjualanItem.update({
      where: { id: item.id },
      data: {
        unitCost:        item.quantity > 0 ? lineCostTotal / item.quantity : 0,
        totalCost:       lineCostTotal,
        margin:          itemMargin,
        batchAllocation: JSON.stringify(alloc),
      },
    });

    // Sync Stock kumulatif
    const whId = item.warehouseId || alloc[0]?.warehouseId;
    if (whId) await syncStockFromBatches(tx, item.productName, whId);
  }

  // ── createMany untuk BatchDeduction (1 query untuk semua rows) ───────────
  if (batchDeductionRows.length > 0) {
    await tx.batchDeduction.createMany({ data: batchDeductionRows });
  }

  // ── createMany untuk History (1 query untuk semua rows) ──────────────────
  if (historyRows.length > 0) {
    await tx.history.createMany({ data: historyRows });
  }

  // Mark stock deducted
  await tx.penjualan.update({ where: { id: saleId }, data: { isStockDeducted: true } });

  return { deductedItems, totalCost: totalSalesCost, marginTotal: totalMargin };
};

// ─── 4. Get available batches untuk UI dropdown ───────────────────────────────
export const getAvailableSalesBatches = async (itemName, warehouseId, search = "") => {
  const batches = await prisma.stockBatch.findMany({
    where: {
      itemName,
      status:       "ACTIVE",
      qtyRemaining: { gt: 0 },
      ...(warehouseId ? { warehouseId } : {}),
      ...(search
        ? { OR: [
            { batchNo:      { contains: search, mode: "insensitive" } },
            { noPO:         { contains: search, mode: "insensitive" } },
            { supplierName: { contains: search, mode: "insensitive" } },
          ] }
        : {}),
    },
    include: { warehouse: { select: { id: true, name: true } } },
    orderBy: { receivedAt: "asc" },
  });

  return batches.map((b, i) => ({
    id:            b.id,
    batchNo:       b.batchNo,
    itemName:      b.itemName,
    noPO:          b.noPO          || "-",
    supplierName:  b.supplierName  || "-",
    qtyRemaining:  b.qtyRemaining,
    reservedQty:   b.reservedQty   || 0,
    qtyAvailable:  effQty(b),
    unit:          b.unit,
    price:         b.price         || "0",
    condition:     b.condition     || "GOOD",
    receivedAt:    b.receivedAt,
    warehouseName: b.warehouse?.name || "-",
    warehouseId:   b.warehouseId,
    fifoPosition:  i + 1,
  }));
};