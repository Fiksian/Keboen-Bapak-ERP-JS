// lib/salesFifoService.js
//
// Fungsi server-side FIFO khusus modul Penjualan:
//   1. computeSalesFIFO       — hitung alokasi batch otomatis (oldest first)
//   2. validateSalesAllocation — validasi alokasi manual dari user
//   3. deductSalesBatches     — potong batch saat Manager approve / Direct sale
//   4. getAvailableSalesBatches — ambil batch tersedia untuk dropdown
//   5. releaseSalesAlloc      — (future: jika perlu soft-reserve untuk penjualan besar)

import prisma from "@/lib/prisma";
import { syncStockFromBatches } from "@/lib/fifoService";

// ─── Helper: qty efektif (belum di-reserve) ───────────────────────────────────
const effQty = (b) => Math.max(0, b.qtyRemaining - (b.reservedQty || 0));

// ─── 1. Auto-FIFO allocation untuk satu item penjualan ───────────────────────
//
// Returns: { success, allocations[], shortfall, totalAvailable, totalCost }
//   allocations = [{ batchId, batchNo, qty, price, supplier, noPO, receivedAt }]
export const computeSalesFIFO = async (itemName, warehouseId, qtyNeeded) => {
  const where = {
    itemName,
    status:       "ACTIVE",
    qtyRemaining: { gt: 0 },
  };
  if (warehouseId) where.warehouseId = warehouseId;

  const batches = await prisma.stockBatch.findMany({
    where,
    orderBy: { receivedAt: "asc" }, // oldest first = FIFO
  });

  let remaining   = parseFloat(qtyNeeded) || 0;
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
      price:       b.price   || "0",
      supplier:    b.supplierName || "-",
      noPO:        b.noPO    || "-",
      receivedAt:  b.receivedAt,
      warehouseId: b.warehouseId,
    });
    remaining -= take;
  }

  const totalAvailable = batches.reduce((s, b) => s + effQty(b), 0);
  const totalCost      = allocations.reduce((s, a) => s + (parseFloat(a.price) || 0) * a.qty, 0);

  return {
    success:        remaining <= 0,
    allocations,
    shortfall:      Math.max(0, remaining),
    totalAllocated: qtyNeeded - Math.max(0, remaining),
    totalAvailable,
    totalCost,
    unitCost:       allocations.reduce((s, a) => s + a.qty, 0) > 0
                    ? totalCost / allocations.reduce((s, a) => s + a.qty, 0)
                    : 0,
    message: remaining > 0
      ? `Stok FIFO "${itemName}" tidak cukup. Tersedia: ${totalAvailable.toFixed(2)}, dibutuhkan: ${qtyNeeded}.`
      : `Auto-FIFO OK: ${allocations.length} batch dialokasikan.`,
  };
};

// ─── 2. Validasi alokasi manual ────────────────────────────────────────────────
export const validateSalesAllocation = async (itemName, allocations, qtyNeeded) => {
  const errors = [];
  let totalAllocated = 0;
  const enriched = [];

  for (const a of allocations) {
    const batch = await prisma.stockBatch.findUnique({ where: { id: a.batchId } });
    if (!batch) { errors.push(`Batch ${a.batchNo || a.batchId} tidak ditemukan.`); continue; }
    if (batch.status !== "ACTIVE") { errors.push(`Batch ${batch.batchNo} tidak aktif.`); continue; }

    const available = effQty(batch);
    const qty       = parseFloat(a.qty) || 0;
    if (qty <= 0)         { errors.push(`Qty untuk batch ${batch.batchNo} harus > 0.`); continue; }
    if (qty > batch.qtyRemaining) {
      errors.push(`Batch ${batch.batchNo}: diminta ${qty}, tersisa ${batch.qtyRemaining.toFixed(2)}.`);
      continue;
    }

    enriched.push({ ...a, qty, price: batch.price || "0", supplier: batch.supplierName || "-", noPO: batch.noPO || "-" });
    totalAllocated += qty;
  }

  if (totalAllocated < parseFloat(qtyNeeded)) {
    errors.push(`Total alokasi (${totalAllocated}) kurang dari kebutuhan (${qtyNeeded}).`);
  }

  return { valid: errors.length === 0, errors, allocations: enriched, totalAllocated };
};

// ─── 3. Deduct FIFO batch — dipanggil saat Manager approve ATAU Direct sale ──
//
// Params:
//   tx          : Prisma transaction client
//   saleId      : ID penjualan
//   invoiceId   : nomor invoice (untuk referenceNo)
//   approver    : nama user yang trigger
//
// Returns: { deductedItems[], totalCost, marginTotal }
export const deductSalesBatches = async (tx, saleId, invoiceId, approver) => {
  const sale = await tx.penjualan.findUnique({
    where:   { id: saleId },
    include: { items: true },
  });
  if (!sale) throw new Error("Penjualan tidak ditemukan.");

  const deductedItems  = [];
  let totalSalesCost   = 0;  // akumulasi HPP (dari batch)
  let totalMargin      = 0;
  const now            = new Date();

  for (const item of sale.items) {
    let alloc = [];
    try {
      alloc = typeof item.batchAllocation === "string"
        ? JSON.parse(item.batchAllocation)
        : (item.batchAllocation || []);
    } catch { alloc = []; }

    // Jika tidak ada alokasi tersimpan → fallback Auto-FIFO
    if (!alloc.length) {
      const fifo = await computeSalesFIFO(item.productName, item.warehouseId, item.quantity);
      if (!fifo.success) throw new Error(fifo.message);
      alloc = fifo.allocations;
    }

    let lineCostTotal = 0;

    for (const a of alloc) {
      const batch     = await tx.stockBatch.findUnique({ where: { id: a.batchId } });
      if (!batch) throw new Error(`Batch ${a.batchId} tidak ditemukan saat deduction.`);

      const deductQty = parseFloat(a.qty);
      if (batch.qtyRemaining < deductQty) {
        throw new Error(`Batch ${batch.batchNo} tidak cukup. Tersisa ${batch.qtyRemaining.toFixed(2)}, dibutuhkan ${deductQty}.`);
      }

      const unitPrice  = parseFloat(batch.price) || 0;
      const lineCost   = unitPrice * deductQty;
      lineCostTotal   += lineCost;
      totalSalesCost  += lineCost;

      const newQtyRemaining = parseFloat((batch.qtyRemaining - deductQty).toFixed(6));
      const isDepleted      = newQtyRemaining <= 0;
      const newReservedQty  = Math.max(0, (batch.reservedQty || 0) - deductQty);

      // Potong batch
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          qtyRemaining: newQtyRemaining,
          reservedQty:  newReservedQty,
          status:       isDepleted ? "DEPLETED" : "ACTIVE",
          depletedAt:   isDepleted ? now : null,
          updatedAt:    now,
        },
      });

      // Catat BatchDeduction
      await tx.batchDeduction.create({
        data: {
          batchId:       batch.id,
          referenceId:   saleId,
          referenceType: "SALES",
          referenceNo:   invoiceId,
          qtyDeducted:   deductQty,
          unit:          batch.unit,
          deductedBy:    approver,
          notes:         `Invoice ${invoiceId} | Batch ${batch.batchNo} | Supplier: ${batch.supplierName || "-"} | @Rp${unitPrice.toLocaleString("id-ID")}`,
        },
      });

      // History per batch
      await tx.history.create({
        data: {
          action:      "SALES_OUT",
          item:        item.productName,
          category:    "Sales",
          type:        "STOCKS",
          quantity:    -deductQty,
          unit:        item.unit || "Unit",
          user:        approver,
          referenceId: saleId,
          batchId:     batch.id,
          notes:       `Invoice ${invoiceId} | FIFO: ${batch.batchNo} | Supplier: ${batch.supplierName || "-"} | HPP @Rp${unitPrice.toLocaleString("id-ID")}`,
        },
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

    // Hitung margin item
    const itemMargin   = item.price * item.quantity - lineCostTotal;
    totalMargin       += itemMargin;

    // Update PenjualanItem dengan data HPP aktual
    await tx.penjualanItem.update({
      where: { id: item.id },
      data: {
        unitCost:  item.quantity > 0 ? lineCostTotal / item.quantity : 0,
        totalCost: lineCostTotal,
        margin:    itemMargin,
        batchAllocation: JSON.stringify(alloc),
      },
    });

    // Sync tabel Stock kumulatif
    const whId = item.warehouseId || alloc[0]?.warehouseId;
    if (whId) await syncStockFromBatches(tx, item.productName, whId);
  }

  // Update isStockDeducted di Penjualan
  await tx.penjualan.update({
    where: { id: saleId },
    data:  { isStockDeducted: true },
  });

  return { deductedItems, totalCost: totalSalesCost, marginTotal: totalMargin };
};

// ─── 4. Get available batches untuk UI dropdown ───────────────────────────────
export const getAvailableSalesBatches = async (itemName, warehouseId, search = "") => {
  const where = {
    itemName,
    status:       "ACTIVE",
    qtyRemaining: { gt: 0 },
    ...(warehouseId ? { warehouseId } : {}),
    ...(search ? {
      OR: [
        { batchNo:      { contains: search, mode: "insensitive" } },
        { noPO:         { contains: search, mode: "insensitive" } },
        { supplierName: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };

  const batches = await prisma.stockBatch.findMany({
    where,
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