// lib/productionFifoService.js
//
// Fungsi server-side untuk logika FIFO produksi:
//   1. computeFIFOAllocation  — hitung alokasi batch secara otomatis (Auto-FIFO)
//   2. validateManualAllocation — validasi alokasi manual dari user
//   3. softReserveBatches     — soft-reserve saat QC approve (tahap 1)
//   4. releaseSoftReserve     — lepas reserve saat order dibatalkan
//   5. deductReservedBatches  — potong permanen saat Manager approve (tahap 4)
//   6. getAvailableBatches    — ambil batch tersedia (qtyRemaining - reservedQty)
//   7. syncStockFromBatches   — (re-export dari fifoService untuk convenience)

import prisma from "@/lib/prisma";
import { createBatch, syncStockFromBatches } from "@/lib/fifoService";

// ─── Helper: qty yang benar-benar tersedia (belum di-reserve) ─────────────────
const effectiveQty = (b) => Math.max(0, b.qtyRemaining - (b.reservedQty || 0));

// ─── 1. Auto-FIFO: hitung alokasi batch secara otomatis ──────────────────────
//
// Params:
//   itemName    : nama bahan baku
//   warehouseId : gudang sumber
//   qtyNeeded   : total qty yang dibutuhkan
//   options     : { excludeReserved: boolean } default true
//
// Returns: { success, allocations[], shortfall, totalAvailable }
//   allocations = [{ batchId, batchNo, qty, price, supplier, noPO, receivedAt, qtyRemaining, reservedQty }]
export const computeFIFOAllocation = async (itemName, warehouseId, qtyNeeded, options = {}) => {
  const { excludeReserved = true } = options;

  // Ambil semua batch ACTIVE, urut FIFO (oldest first)
  const batches = await prisma.stockBatch.findMany({
    where:   { itemName, warehouseId, status: "ACTIVE", qtyRemaining: { gt: 0 } },
    orderBy: { receivedAt: "asc" },
  });

  let remaining = parseFloat(qtyNeeded) || 0;
  const allocations = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const available = excludeReserved ? effectiveQty(batch) : batch.qtyRemaining;
    if (available <= 0) continue;

    const take = Math.min(remaining, available);
    allocations.push({
      batchId:      batch.id,
      batchNo:      batch.batchNo,
      qty:          parseFloat(take.toFixed(6)),
      price:        batch.price || "0",
      supplier:     batch.supplierName || "-",
      noPO:         batch.noPO         || "-",
      receivedAt:   batch.receivedAt,
      qtyRemaining: batch.qtyRemaining,
      reservedQty:  batch.reservedQty || 0,
      qtyAvailable: available,
    });
    remaining -= take;
  }

  const totalAvailable = batches.reduce((s, b) => s + effectiveQty(b), 0);

  return {
    success:        remaining <= 0,
    allocations,
    shortfall:      Math.max(0, remaining),
    totalAllocated: qtyNeeded - Math.max(0, remaining),
    totalAvailable,
    message: remaining > 0
      ? `Stok tidak mencukupi. Tersedia: ${totalAvailable.toFixed(2)}, dibutuhkan: ${qtyNeeded}. Kekurangan: ${remaining.toFixed(2)}.`
      : `Auto-FIFO: ${allocations.length} batch dialokasikan.`,
  };
};

// ─── 2. Validasi alokasi manual dari user ─────────────────────────────────────
//
// Memvalidasi bahwa alokasi yang dipilih user tidak melebihi qtyRemaining aktual
// dan total qty cukup.
//
// Params:
//   manualAllocations : [{ batchId, qty }]
//   qtyNeeded         : total yang dibutuhkan
//
// Returns: { valid, errors[], allocations[] (enriched dengan data batch) }
export const validateManualAllocation = async (manualAllocations, qtyNeeded) => {
  const errors = [];
  const enriched = [];
  let totalAllocated = 0;

  for (const alloc of manualAllocations) {
    const batch = await prisma.stockBatch.findUnique({ where: { id: alloc.batchId } });

    if (!batch) {
      errors.push(`Batch ID "${alloc.batchId}" tidak ditemukan.`);
      continue;
    }
    if (batch.status !== "ACTIVE") {
      errors.push(`Batch ${batch.batchNo} sudah ${batch.status}, tidak bisa digunakan.`);
      continue;
    }

    const available = effectiveQty(batch);
    const qty       = parseFloat(alloc.qty) || 0;

    if (qty <= 0) {
      errors.push(`Qty untuk batch ${batch.batchNo} harus > 0.`);
      continue;
    }
    if (qty > available) {
      errors.push(`Batch ${batch.batchNo}: diminta ${qty}, tersedia (setelah reserve) ${available.toFixed(2)}.`);
      continue;
    }

    enriched.push({
      batchId:      batch.id,
      batchNo:      batch.batchNo,
      qty,
      price:        batch.price || "0",
      supplier:     batch.supplierName || "-",
      noPO:         batch.noPO         || "-",
      receivedAt:   batch.receivedAt,
      qtyRemaining: batch.qtyRemaining,
      reservedQty:  batch.reservedQty || 0,
      qtyAvailable: available,
    });
    totalAllocated += qty;
  }

  if (totalAllocated < parseFloat(qtyNeeded)) {
    errors.push(`Total alokasi (${totalAllocated}) kurang dari kebutuhan (${qtyNeeded}).`);
  }

  return {
    valid:         errors.length === 0,
    errors,
    allocations:   enriched,
    totalAllocated,
  };
};

// ─── 3. Soft-reserve: cadangkan batch saat QC approve ────────────────────────
//
// Dipanggil di production/[id]/approve route saat stage = "qc".
// Menambahkan reservedQty di StockBatch agar batch tidak bisa dialokasikan
// ke produksi lain sebelum Manager memberikan final approval.
//
// Params:
//   tx           : Prisma transaction client
//   productionId : ID production order
//   approver     : nama user yang approve
//
// Returns: { reserved: true, details[] }
export const softReserveBatches = async (tx, productionId, approver) => {
  const production = await tx.production.findUnique({
    where:   { id: productionId },
    include: { components: true },
  });
  if (!production) throw new Error("Production order tidak ditemukan.");

  const details = [];

  for (const comp of production.components) {
    // Parse alokasi dari JSON
    let alloc = [];
    try {
      alloc = typeof comp.batchAllocation === "string"
        ? JSON.parse(comp.batchAllocation)
        : (comp.batchAllocation || []);
    } catch { alloc = []; }

    for (const a of alloc) {
      if (!a.batchId || !a.qty) continue;

      const batch = await tx.stockBatch.findUnique({ where: { id: a.batchId } });
      if (!batch) continue;

      const available = effectiveQty(batch);
      if (available < a.qty) {
        throw new Error(
          `Batch ${batch.batchNo} tidak bisa di-reserve: tersedia ${available.toFixed(2)}, dibutuhkan ${a.qty}. Stok mungkin sudah berubah.`
        );
      }

      // Naikkan reservedQty
      await tx.stockBatch.update({
        where: { id: batch.id },
        data:  { reservedQty: { increment: parseFloat(a.qty) } },
      });

      // Upsert record pivot (idempotent)
      await tx.productionBatchAllocation.upsert({
        where: {
          // Composite unique: cari berdasarkan component + batch
          // Jika belum ada index unik, gunakan create saja
          id: `${comp.id}_${batch.id}`,
        },
        create: {
          id:                    `${comp.id}_${batch.id}`,
          productionComponentId: comp.id,
          batchId:               batch.id,
          qtyAllocated:          parseFloat(a.qty),
          isReserved:            true,
          isDeducted:            false,
        },
        update: {
          qtyAllocated: parseFloat(a.qty),
          isReserved:   true,
        },
      });

      details.push({ batchNo: batch.batchNo, qty: a.qty, itemName: comp.itemName });
    }

    // Update reservedQty di component
    const totalCompQty = alloc.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
    await tx.productionComponent.update({
      where: { id: comp.id },
      data:  { reservedQty: totalCompQty },
    });
  }

  // Update Production → isReserved = true
  await tx.production.update({
    where: { id: productionId },
    data:  { isReserved: true, reservedAt: new Date(), reservedBy: approver },
  });

  return { reserved: true, details };
};

// ─── 4. Lepas soft-reserve saat order dibatalkan ──────────────────────────────
//
// Dipanggil saat status menjadi CANCELLED.
//
// Params:
//   tx           : Prisma transaction client
//   productionId : ID production order
//
// Returns: { released: true, details[] }
export const releaseSoftReserve = async (tx, productionId) => {
  const production = await tx.production.findUnique({
    where:   { id: productionId },
    include: { components: true },
  });
  if (!production || !production.isReserved) return { released: false, details: [] };

  const details = [];

  for (const comp of production.components) {
    if (!comp.reservedQty || comp.reservedQty <= 0) continue;

    let alloc = [];
    try {
      alloc = typeof comp.batchAllocation === "string"
        ? JSON.parse(comp.batchAllocation)
        : (comp.batchAllocation || []);
    } catch { alloc = []; }

    for (const a of alloc) {
      if (!a.batchId || !a.qty) continue;
      // Kurangi reservedQty (jangan sampai minus)
      await tx.stockBatch.update({
        where: { id: a.batchId },
        data:  { reservedQty: { decrement: Math.min(parseFloat(a.qty), 999999) } },
      });
      // Update pivot
      await tx.productionBatchAllocation.updateMany({
        where: { productionComponentId: comp.id, batchId: a.batchId },
        data:  { isReserved: false },
      });
      details.push({ batchId: a.batchId, qty: a.qty });
    }

    await tx.productionComponent.update({
      where: { id: comp.id },
      data:  { reservedQty: 0 },
    });
  }

  await tx.production.update({
    where: { id: productionId },
    data:  { isReserved: false },
  });

  return { released: true, details };
};

// ─── 5. Deduct permanenn (FIFO eksekusi saat Manager approve) ────────────────
//
// Memotong qtyRemaining dan reservedQty sekaligus.
// Dipanggil di dalam transaksi dari production/[id]/approve route (stage: "manager").
//
// Params:
//   tx           : Prisma transaction client
//   productionId : ID production order
//   approver     : nama approver
//   noBatch      : nomor batch produksi
//
// Returns: { totalCost, deductedItems[], hppPerUnit }
export const deductReservedBatches = async (tx, productionId, approver, noBatch) => {
  const production = await tx.production.findUnique({
    where:   { id: productionId },
    include: { components: true },
  });
  if (!production) throw new Error("Production tidak ditemukan.");

  let totalActualCost = 0;
  const deductedItems = [];
  const now = new Date();

  for (const comp of production.components) {
    const whId = comp.warehouseId;
    if (!whId) throw new Error(`Komponen "${comp.itemName}" tidak punya warehouseId.`);

    let alloc = [];
    try {
      alloc = typeof comp.batchAllocation === "string"
        ? JSON.parse(comp.batchAllocation)
        : (comp.batchAllocation || []);
    } catch { alloc = []; }

    // Jika tidak ada alokasi tersimpan, fallback ke Auto-FIFO
    if (!alloc.length) {
      const fifoResult = await computeFIFOAllocation(comp.itemName, whId, comp.qtyNeeded, { excludeReserved: false });
      if (!fifoResult.success) throw new Error(fifoResult.message);
      alloc = fifoResult.allocations;
    }

    for (const a of alloc) {
      const batch = await tx.stockBatch.findUnique({ where: { id: a.batchId } });
      if (!batch) throw new Error(`Batch ${a.batchId} tidak ditemukan saat deduction.`);

      const deductQty  = parseFloat(a.qty);
      const unitPrice  = parseFloat(batch.price) || 0;
      const lineCost   = unitPrice * deductQty;
      totalActualCost += lineCost;

      // Validasi stok masih cukup
      if (batch.qtyRemaining < deductQty) {
        throw new Error(`Batch ${batch.batchNo}: tersisa ${batch.qtyRemaining}, dibutuhkan ${deductQty}.`);
      }

      const newQtyRemaining = parseFloat((batch.qtyRemaining - deductQty).toFixed(6));
      const newReservedQty  = Math.max(0, (batch.reservedQty || 0) - deductQty);
      const isDepleted      = newQtyRemaining <= 0;

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
          referenceId:   productionId,
          referenceType: "PRODUCTION",
          referenceNo:   noBatch,
          qtyDeducted:   deductQty,
          unit:          batch.unit,
          deductedBy:    approver,
          notes:         `Produksi ${noBatch} | Batch ${batch.batchNo} | @Rp${unitPrice.toLocaleString("id-ID")}`,
        },
      });

      // Update pivot → isDeducted
      await tx.productionBatchAllocation.updateMany({
        where: { productionComponentId: comp.id, batchId: batch.id },
        data:  { isDeducted: true, isReserved: false },
      });

      // History per batch
      await tx.history.create({
        data: {
          action:      "PRODUCTION_OUT",
          item:        comp.itemName,
          category:    "Production",
          type:        "STOCKS",
          quantity:    -deductQty,
          unit:        comp.unit,
          user:        approver,
          referenceId: productionId,
          batchId:     batch.id,
          notes:       `${noBatch} | FIFO: ${batch.batchNo} | Supplier: ${batch.supplierName || "-"} | @Rp${unitPrice.toLocaleString("id-ID")}`,
        },
      });

      deductedItems.push({
        itemName:  comp.itemName,
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

    // Sync tabel Stock kumulatif
    await syncStockFromBatches(tx, comp.itemName, whId);
  }

  const hppPerUnit = production.targetQty > 0 ? totalActualCost / production.targetQty : 0;

  return { totalCost: totalActualCost, hppPerUnit, deductedItems };
};

// ─── 6. getAvailableBatches — untuk BatchPicker UI ───────────────────────────
//
// Mengambil batch beserta qtyAvailable (setelah dikurangi reserve).
// Digunakan oleh API /api/stock/batch dan BatchPicker component.
//
// Params:
//   itemName      : nama bahan
//   warehouseId   : ID gudang
//   searchQuery   : (opsional) cari berdasarkan batchNo / noPO / supplier
//   includeAll    : jika true, sertakan batch DEPLETED juga
export const getAvailableBatches = async (itemName, warehouseId, searchQuery = "", includeAll = false) => {
  const where = {
    itemName,
    ...(warehouseId ? { warehouseId } : {}),
    ...(includeAll ? {} : { status: "ACTIVE", qtyRemaining: { gt: 0 } }),
  };

  if (searchQuery) {
    where.OR = [
      { batchNo:      { contains: searchQuery, mode: "insensitive" } },
      { noPO:         { contains: searchQuery, mode: "insensitive" } },
      { supplierName: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const batches = await prisma.stockBatch.findMany({
    where,
    include: {
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: { receivedAt: "asc" }, // FIFO order
  });

  return batches.map((b, i) => ({
    id:            b.id,
    batchNo:       b.batchNo,
    itemName:      b.itemName,
    noPO:          b.noPO          || "-",
    supplierName:  b.supplierName  || "-",
    qtyInitial:    b.qtyInitial,
    qtyRemaining:  b.qtyRemaining,
    reservedQty:   b.reservedQty   || 0,
    qtyAvailable:  effectiveQty(b),
    unit:          b.unit,
    price:         b.price         || "0",
    condition:     b.condition     || "GOOD",
    receivedAt:    b.receivedAt,
    status:        b.status,
    warehouseName: b.warehouse?.name || "-",
    fifoPosition:  i + 1,  // posisi urutan FIFO (1 = tertua / NEXT OUT)
  }));
};

export { createBatch, syncStockFromBatches };
