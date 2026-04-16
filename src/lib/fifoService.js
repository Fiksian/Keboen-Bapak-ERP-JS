// lib/fifoService.js
//
// Layanan FIFO untuk manajemen stok berbasis batch.
// Digunakan oleh: STTB approve route (IN), produksi route (OUT), penjualan route (OUT)
//
// ──────────────────────────────────────────────────────────────────────────────
// PRINSIP FIFO:
//   Batch diurutkan berdasarkan receivedAt ASC (yang masuk lebih dulu, keluar lebih dulu).
//   Jika satu batch tidak mencukupi, ambil dari batch berikutnya secara berurutan.
//
// CONTOH (sesuai skenario permintaan):
//   Batch A: masuk 100 unit Jan 1
//   Batch B: masuk 50 unit Jan 5
//   Permintaan: 120 unit
//   → Potong 100 dari Batch A (habis, status → DEPLETED)
//   → Potong 20 dari Batch B (sisa 30)
// ──────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";

// ─── Generate nomor batch ────────────────────────────────────────────────────
export const generateBatchNo = async (tx) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix  = `BATCH/${dateStr}/`;
  const count   = await (tx || prisma).stockBatch.count({
    where: { batchNo: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

// ─── Buat batch baru (dipanggil saat STTB final approved) ────────────────────
// Params:
//   tx          : Prisma transaction client
//   itemName    : nama barang
//   warehouseId : ID gudang tujuan
//   qty         : qty yang masuk (hasil netto timbang)
//   unit        : satuan
//   opts        : { purchasingId, receiptId, sttbId, supplierName, noPO, suratJalan,
//                   category, type, price, condition, notes }
export const createBatch = async (tx, itemName, warehouseId, qty, unit, opts = {}) => {
  const batchNo = await generateBatchNo(tx);
  const now     = new Date();

  const batch = await tx.stockBatch.create({
    data: {
      batchNo,
      itemName,
      warehouseId,
      purchasingId:  opts.purchasingId  || null,
      receiptId:     opts.receiptId     || null,
      sttbId:        opts.sttbId        || null,
      supplierName:  opts.supplierName  || null,
      noPO:          opts.noPO          || null,
      suratJalan:    opts.suratJalan    || null,
      qtyInitial:    qty,
      qtyRemaining:  qty,
      unit,
      category:      opts.category || "General",
      type:          opts.type     || "STOCKS",
      price:         opts.price    || null,
      condition:     opts.condition || "GOOD",
      notes:         opts.notes    || null,
      status:        "ACTIVE",
      receivedAt:    now,
      updatedAt:     now,
    },
  });

  return batch;
};

// ─── FIFO Deduction ───────────────────────────────────────────────────────────
// Kurangi stok dari batch yang masuk paling lama terlebih dahulu.
//
// Params:
//   tx            : Prisma transaction client
//   itemName      : nama barang yang akan dikurangi
//   warehouseId   : ID gudang sumber
//   qtyNeeded     : total qty yang dibutuhkan
//   referenceId   : ID transaksi (produksi/penjualan) yang memicu deduction
//   referenceType : "PRODUCTION" | "SALES" | "MANUAL_OUT" | "ADJUSTMENT"
//   referenceNo   : nomor human-readable (noBatch produksi / invoiceId penjualan)
//   deductedBy    : nama user
//   notes         : catatan tambahan
//
// Returns:
//   { success, deductions: [{batchNo, supplier, qtyDeducted, qtyBefore, qtyAfter}],
//     totalDeducted, shortfall }
//   shortfall > 0 artinya stok tidak cukup
export const deductStockFIFO = async (
  tx,
  itemName,
  warehouseId,
  qtyNeeded,
  referenceId,
  referenceType,
  referenceNo,
  deductedBy = "System",
  notes = ""
) => {
  // Ambil semua batch ACTIVE untuk item ini, urut FIFO (paling lama dulu)
  const activeBatches = await tx.stockBatch.findMany({
    where: {
      itemName,
      warehouseId,
      status:       "ACTIVE",
      qtyRemaining: { gt: 0 },
    },
    orderBy: { receivedAt: "asc" }, // FIFO: oldest first
  });

  let remaining      = qtyNeeded;
  const deductions   = [];
  const now          = new Date();

  for (const batch of activeBatches) {
    if (remaining <= 0) break;

    const toDeduct  = Math.min(remaining, batch.qtyRemaining);
    const newQty    = parseFloat((batch.qtyRemaining - toDeduct).toFixed(6));
    const isDepleted = newQty <= 0;

    // Update batch
    await tx.stockBatch.update({
      where: { id: batch.id },
      data:  {
        qtyRemaining: newQty,
        status:       isDepleted ? "DEPLETED" : "ACTIVE",
        depletedAt:   isDepleted ? now : null,
        updatedAt:    now,
      },
    });

    // Catat deduction line
    await tx.batchDeduction.create({
      data: {
        batchId:       batch.id,
        referenceId,
        referenceType,
        referenceNo,
        qtyDeducted:   toDeduct,
        unit:          batch.unit,
        deductedBy,
        notes,
        createdAt:     now,
      },
    });

    deductions.push({
      batchId:     batch.id,
      batchNo:     batch.batchNo,
      supplier:    batch.supplierName || "-",
      noPO:        batch.noPO        || "-",
      receivedAt:  batch.receivedAt,
      qtyDeducted: toDeduct,
      qtyBefore:   batch.qtyRemaining,
      qtyAfter:    newQty,
      depleted:    isDepleted,
    });

    remaining -= toDeduct;
  }

  const totalDeducted = qtyNeeded - remaining;
  const shortfall     = remaining; // sisa yang tidak terpenuhi (> 0 = stok kurang)

  return {
    success:      shortfall <= 0,
    deductions,
    totalDeducted,
    shortfall,
    message:      shortfall > 0
      ? `Stok tidak mencukupi. Tersedia: ${totalDeducted} dari ${qtyNeeded} yang dibutuhkan. Kekurangan: ${shortfall}`
      : `FIFO deduction selesai: ${totalDeducted} dari ${deductions.length} batch.`,
  };
};

// ─── Cek total stok FIFO untuk satu item ──────────────────────────────────────
// Menghitung dari batch (bukan dari tabel Stock langsung)
export const getBatchTotalStock = async (itemName, warehouseId) => {
  const result = await prisma.stockBatch.aggregate({
    where: { itemName, warehouseId, status: "ACTIVE" },
    _sum:  { qtyRemaining: true },
  });
  return result._sum.qtyRemaining || 0;
};

// ─── List batch aktif untuk satu item ─────────────────────────────────────────
export const getActiveBatches = async (itemName, warehouseId) => {
  return prisma.stockBatch.findMany({
    where: {
      itemName,
      warehouseId,
      status: { in: ["ACTIVE"] },
    },
    include: {
      deductions: {
        orderBy: { createdAt: "desc" },
        take:     20,
      },
    },
    orderBy: { receivedAt: "asc" }, // FIFO order
  });
};

// ─── Semua batch (termasuk depleted) untuk traceability ──────────────────────
export const getAllBatchesForItem = async (itemName, warehouseId) => {
  return prisma.stockBatch.findMany({
    where:   { itemName, warehouseId },
    include: {
      deductions: { orderBy: { createdAt: "asc" } },
      purchasing: { select: { noPO: true, supplier: true, qty: true, unit: true } },
    },
    orderBy: { receivedAt: "desc" },
  });
};

// ─── Traceability: lacak balik dari referenceId ke batch asalnya ──────────────
// Berguna untuk reject analysis: "dari produksi/penjualan X, batch apa yang dipakai?"
export const traceBatchByReference = async (referenceId) => {
  const deductions = await prisma.batchDeduction.findMany({
    where:   { referenceId },
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

  return deductions.map(d => ({
    deductionId:    d.id,
    qtyDeducted:    d.qtyDeducted,
    unit:           d.unit,
    deductedAt:     d.createdAt,
    referenceType:  d.referenceType,
    referenceNo:    d.referenceNo,
    batch: {
      id:           d.batch.id,
      batchNo:      d.batch.batchNo,
      itemName:     d.batch.itemName,
      supplier:     d.batch.supplierName || d.batch.purchasing?.supplier || "-",
      noPO:         d.batch.noPO         || d.batch.purchasing?.noPO     || "-",
      suratJalan:   d.batch.suratJalan   || d.batch.receipt?.suratJalan  || "-",
      sttbNo:       d.batch.sttb?.sttbNo  || "-",
      receivedAt:   d.batch.receivedAt,
      condition:    d.batch.condition,
      qtyInitial:   d.batch.qtyInitial,
    },
  }));
};

// ─── Sync tabel Stock dengan total batch ─────────────────────────────────────
// Panggil setelah deduction agar tabel Stock tetap konsisten dengan batch
// ─── Sync tabel Stock dengan total batch ─────────────────────────────────────
export const syncStockFromBatches = async (tx, itemName, warehouseId) => {
  const db = tx || prisma;

  const result = await db.stockBatch.aggregate({
    where: { itemName, warehouseId, status: "ACTIVE" },
    _sum:  { qtyRemaining: true },
  });
  const totalFromBatches = result._sum.qtyRemaining || 0;

  const autoStatus = (qty) => {
    if (qty <= 0)  return "EMPTY";
    if (qty <= 50) return "LIMITED";
    return "READY";
  };

  // AMAN: Menggunakan upsert agar barang baru otomatis terdaftar di tabel Stock
  await db.stock.upsert({
    where: {
      name_warehouseId: { 
        name: itemName, 
        warehouseId: warehouseId 
      }
    },
    update: { 
      stock: totalFromBatches, 
      status: autoStatus(totalFromBatches), 
      updatedAt: new Date() 
    },
    create: {
      name: itemName,
      warehouseId: warehouseId,
      stock: totalFromBatches,
      status: autoStatus(totalFromBatches),
      unit: "UNIT", // Sesuaikan default unit
      type: "STOCKS"
    }
  });

  return totalFromBatches;
};