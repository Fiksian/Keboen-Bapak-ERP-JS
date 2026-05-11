// lib/cattleService.js
//
// Business logic untuk modul sapi:
//   1. calcHppAwal           — Landed cost per ekor
//   2. calcSusut             — Susut transit dengan alert
//   3. calcNetWeight         — Auto net-weight dari timbang truk
//   4. createCattleBatch     — Buat FIFO batch baru
//   5. deductCattleBatch     — Keluarkan ekor dari batch (FIFO)
//   6. updateOverheadKumulatif — Akumulasikan overhead ke HPP batch
//   7. parseRfidXls          — Parse file XLS dari scanner RFID
//   8. generateBatchNo / generateArrivalNo

import prisma from "@/lib/prisma";

// ─── 1. Kalkulasi HPP Awal (Landed Cost) per ekor ─────────────────────────────
//
// Formula:
//   hppAwal = (pricePerHeadUSD × exchangeRate)
//           + biayaBongkar + biayaTracking + biayaKarantina + biayaLainLain
//
export const calcHppAwal = ({
  pricePerHeadUSD = 0,
  exchangeRate    = 0,
  biayaBongkar    = 0,
  biayaTracking   = 0,
  biayaKarantina  = 0,
  biayaLainLain   = 0,
}) => {
  const biayaUSD  = parseFloat(pricePerHeadUSD) * parseFloat(exchangeRate);
  const biayaIDR  = parseFloat(biayaBongkar)
                  + parseFloat(biayaTracking)
                  + parseFloat(biayaKarantina)
                  + parseFloat(biayaLainLain);
  return parseFloat((biayaUSD + biayaIDR).toFixed(2));
};

// ─── 2. Kalkulasi Susut Transit ────────────────────────────────────────────────
//
// Toleransi normal: ≤ 8%
// Alert: > 8.5%
//
const SUSUT_ALERT_THRESHOLD = 8.5; // persen

export const calcSusut = (weightPurchase, weightReceived) => {
  const wP   = parseFloat(weightPurchase) || 0;
  const wR   = parseFloat(weightReceived) || 0;
  if (wP <= 0) return { susutKg: 0, susutPct: 0, susutAlert: false };

  const susutKg  = Math.max(0, wP - wR);
  const susutPct = parseFloat(((susutKg / wP) * 100).toFixed(2));
  return {
    susutKg,
    susutPct,
    susutAlert: susutPct > SUSUT_ALERT_THRESHOLD,
  };
};

// ─── 3. Kalkulasi Net Weight per Truk ─────────────────────────────────────────
export const calcNetWeight = (grossWeight, tareWeight) => {
  return Math.max(0, parseFloat(grossWeight || 0) - parseFloat(tareWeight || 0));
};

// ─── 4. Generate nomor batch sapi ─────────────────────────────────────────────
export const generateCattleBatchNo = async (tx) => {
  const now    = new Date();
  const y      = now.getFullYear();
  const m      = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CBATCH/${y}/${m}/`;
  const last   = await tx.cattleBatch.findFirst({
    where:   { batchNo: { startsWith: prefix } },
    orderBy: { batchNo: "desc" },
    select:  { batchNo: true },
  });
  const seq = last ? parseInt(last.batchNo.split("/").pop()) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
};

// ─── 5. Generate nomor arrival ─────────────────────────────────────────────────
export const generateArrivalNo = async (tx) => {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const prefix  = `ARR/${dateStr}/`;
  const count   = await tx.cattleArrival.count({ where: { arrivalNo: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
};

// ─── 6. Buat CattleBatch baru (dipanggil saat arrival COMPLETED) ──────────────
//
// Params:
//   tx           : Prisma transaction client
//   purchasingId : ID CattlePurchasing
//   warehouseId  : ID Warehouse
//   headCount    : Jumlah ekor masuk batch
//   avgWeight    : Berat rata-rata per ekor
//   hppAwalPerEkor: HPP landed cost per ekor
//   meta         : { vendorName, noPO, priceUSD, exchangeRate }
//
export const createCattleBatch = async (tx, purchasingId, warehouseId, headCount, avgWeight, hppAwalPerEkor, meta = {}) => {
  const batchNo = await generateCattleBatchNo(tx);
  return tx.cattleBatch.create({
    data: {
      batchNo,
      purchasingId,
      warehouseId,
      vendorName:          meta.vendorName || "-",
      noPO:                meta.noPO       || "-",
      headInitial:         headCount,
      headRemaining:       headCount,
      avgWeightReceived:   avgWeight,
      avgWeightCurrent:    avgWeight,
      totalWeightCurrent:  headCount * avgWeight,
      hppAwalPerEkor,
      hppKumulatifPerEkor: hppAwalPerEkor,
      totalHppKumulatif:   hppAwalPerEkor * headCount,
      priceUSD:            meta.priceUSD      || 0,
      exchangeRate:        meta.exchangeRate   || 0,
      status:              "ACTIVE",
      arrivedAt:           new Date(),
    },
  });
};

// ─── 7. Deduct FIFO — keluarkan ekor dari batch ───────────────────────────────
//
// Params:
//   tx          : Prisma transaction client
//   warehouseId : Gudang sumber
//   headNeeded  : Jumlah ekor yang akan dikeluarkan
//   referenceId : ID transaksi (penjualan / transfer)
//   referenceType: "SALES" | "TRANSFER" | "DEAD"
//   referenceNo : Nomor referensi
//   deductedBy  : Nama user
//
// Returns: { success, deductions[], shortfall, totalHpp }
export const deductCattleBatchFIFO = async (
  tx, warehouseId, headNeeded, referenceId, referenceType, referenceNo, deductedBy
) => {
  // Ambil batch aktif (FIFO — tertua first)
  const batches = await tx.cattleBatch.findMany({
    where: { warehouseId, status: { in: ["ACTIVE", "PARTIAL"] }, headRemaining: { gt: 0 } },
    orderBy: { arrivedAt: "asc" },
  });

  let remaining   = parseInt(headNeeded);
  const deductions = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const available = batch.headRemaining - batch.headReserved;
    if (available <= 0) continue;

    const take = Math.min(remaining, available);

    const newHeadRemaining = batch.headRemaining - take;
    const isDepleted       = newHeadRemaining <= 0;

    await tx.cattleBatch.update({
      where: { id: batch.id },
      data: {
        headRemaining:       newHeadRemaining,
        headSold:            { increment: take },
        totalWeightCurrent:  newHeadRemaining * batch.avgWeightCurrent,
        totalHppKumulatif:   newHeadRemaining * batch.hppKumulatifPerEkor,
        status:              isDepleted ? "DEPLETED" : "PARTIAL",
        depletedAt:          isDepleted ? new Date() : null,
        updatedAt:           new Date(),
      },
    });

    const deductionCost = take * batch.hppKumulatifPerEkor;

    await tx.cattleBatchDeduction.create({
      data: {
        batchId:       batch.id,
        referenceId,
        referenceType,
        referenceNo,
        headDeducted:  take,
        avgWeightKg:   batch.avgWeightCurrent,
        hppPerEkor:    batch.hppKumulatifPerEkor,
        totalHpp:      deductionCost,
        deductedBy,
      },
    });

    deductions.push({
      batchNo:     batch.batchNo,
      batchId:     batch.id,
      headTaken:   take,
      avgWeight:   batch.avgWeightCurrent,
      hppPerEkor:  batch.hppKumulatifPerEkor,
      cost:        deductionCost,
    });

    remaining -= take;
  }

  const totalHpp = deductions.reduce((s, d) => s + d.cost, 0);

  return {
    success:     remaining <= 0,
    deductions,
    shortfall:   Math.max(0, remaining),
    totalHpp,
    message:     remaining > 0
      ? `Stok sapi tidak cukup. Tersedia: ${headNeeded - remaining}, dibutuhkan: ${headNeeded}.`
      : `FIFO OK: ${deductions.length} batch, ${headNeeded} ekor dikeluarkan.`,
  };
};

// ─── 8. Update HPP Kumulatif setelah overhead dicatat ─────────────────────────
//
// Dipanggil setelah CattleOverhead baru disimpan.
// Akumulasikan biayaPerEkor ke hppKumulatifPerEkor semua ekor di batch.
//
export const updateHppKumulatif = async (tx, batchId) => {
  // Hitung total overhead per ekor untuk batch ini
  const overheads = await tx.cattleOverhead.findMany({
    where:  { batchId },
    select: { biayaPerEkor: true },
  });

  const totalOverheadPerEkor = overheads.reduce((s, o) => s + (o.biayaPerEkor || 0), 0);

  const batch = await tx.cattleBatch.findUnique({ where: { id: batchId } });
  if (!batch) return;

  const newHppKumulatif = batch.hppAwalPerEkor + totalOverheadPerEkor;

  await tx.cattleBatch.update({
    where: { id: batchId },
    data: {
      hppKumulatifPerEkor: newHppKumulatif,
      totalHppKumulatif:   newHppKumulatif * batch.headRemaining,
      updatedAt:           new Date(),
    },
  });

  // Update juga setiap ekor (CattleInventory) dalam batch
  await tx.cattleInventory.updateMany({
    where: { batchId, status: "ACTIVE" },
    data:  { hppKumulatif: newHppKumulatif },
  });

  return newHppKumulatif;
};

// ─── 9. Parse RFID XLS dari scanner ───────────────────────────────────────────
//
// File XLS format:
//   Kolom: [waktu_scan, nomor_rfid, jenis_data]
//   (nama kolom bisa bervariasi — fungsi ini handle kolom index)
//
// Dipanggil di server (API route) menggunakan paket xlsx.
// Return: [{ rfidNo, scannedAt, jenisData }]
//
export const parseRfidXls = (buffer) => {
  // Paket xlsx harus di-import di API route ybs:
  //   import * as XLSX from 'xlsx';
  // Fungsi ini menerima workbook yang sudah di-parse.
  //
  // Contoh penggunaan di API route:
  //   const XLSX   = require('xlsx');
  //   const wb     = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  //   const ws     = wb.Sheets[wb.SheetNames[0]];
  //   const rows   = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  //   const parsed = parseRfidRows(rows);
  //
  // Fungsi parseRfidRows ada di bawah.
  throw new Error("Gunakan parseRfidRows() dengan row array dari XLSX.utils.sheet_to_json");
};

// Fungsi yang sebenarnya dipanggil setelah XLSX parsing
export const parseRfidRows = (rows) => {
  if (!rows?.length) return [];

  // Cari header row (baris yang mengandung kata "rfid" atau "eartag")
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i]?.some?.(c => String(c || "").toLowerCase().includes("rfid") || String(c || "").toLowerCase().includes("tag"))) {
      headerIdx = i;
      break;
    }
  }

  const headers = (rows[headerIdx] || []).map(h => String(h || "").toLowerCase().trim());

  // Deteksi kolom secara fleksibel
  const colTime  = headers.findIndex(h => h.includes("waktu") || h.includes("time") || h.includes("scan") || h.includes("tanggal"));
  const colRfid  = headers.findIndex(h => h.includes("rfid") || h.includes("tag") || h.includes("nomor") || h.includes("no"));
  const colJenis = headers.findIndex(h => h.includes("jenis") || h.includes("type") || h.includes("data"));

  // Fallback: kolom 0=waktu, 1=rfid, 2=jenis (sesuai format umum scanner)
  const iTime  = colTime  >= 0 ? colTime  : 0;
  const iRfid  = colRfid  >= 0 ? colRfid  : 1;
  const iJenis = colJenis >= 0 ? colJenis : 2;

  const results = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rfidRaw = String(row[iRfid] ?? "").trim();
    if (!rfidRaw || rfidRaw.toLowerCase() === "null" || rfidRaw === "") continue;

    let scannedAt = new Date();
    if (row[iTime]) {
      const d = new Date(row[iTime]);
      if (!isNaN(d.getTime())) scannedAt = d;
    }

    results.push({
      rfidNo:     rfidRaw.toUpperCase(),
      scannedAt,
      jenisData:  String(row[iJenis] ?? "").trim() || "EARTAG",
    });
  }

  // Deduplicate by rfidNo (keep last scan)
  const seen = new Map();
  for (const r of results) seen.set(r.rfidNo, r);
  return Array.from(seen.values());
};

// ─── 10. Get available cattle batches untuk UI ────────────────────────────────
export const getAvailableCattleBatches = async (warehouseId) => {
  const batches = await prisma.cattleBatch.findMany({
    where: {
      ...(warehouseId ? { warehouseId } : {}),
      status:       { in: ["ACTIVE", "PARTIAL"] },
      headRemaining: { gt: 0 },
    },
    orderBy: { arrivedAt: "asc" },
    include: { warehouse: { select: { id: true, name: true } } },
  });

  return batches.map((b, i) => ({
    id:                 b.id,
    batchNo:            b.batchNo,
    vendorName:         b.vendorName,
    noPO:               b.noPO,
    headInitial:        b.headInitial,
    headRemaining:      b.headRemaining,
    headAvailable:      b.headRemaining - b.headReserved,
    avgWeightCurrent:   b.avgWeightCurrent,
    hppPerEkor:         b.hppKumulatifPerEkor,
    totalHpp:           b.totalHppKumulatif,
    arrivedAt:          b.arrivedAt,
    warehouseName:      b.warehouse?.name || "-",
    fifoPosition:       i + 1,
  }));
};
