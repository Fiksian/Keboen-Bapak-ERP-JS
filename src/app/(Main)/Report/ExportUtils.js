/**
 * ExportUtils.js
 * 
 * Format output mengikuti standar FORM_LAPORAN_PRODUKSI_FEEDMIL.xlsx:
 *  - Baris 1 : Nama Perusahaan (merge A1:K1)
 *  - Baris 2 : Judul Laporan  (merge A2:K2)
 *  - Baris 3 : Periode        (merge A3:K3)
 *  - Baris 4 : (kosong / spacer)
 *  - Baris 5 : Header Kolom   → bold, border tipis, background abu-abu muda (#D9D9D9)
 *  - Baris 6+ : Data           → border tipis, Netto = formula Excel (QTY - QTY×Refraksi)
 *  - Baris terakhir : TOTAL row
 * 
 * Sheet yang dihasilkan:
 *  1. Kedatangan Bahan Baku  (receipts / STTB data) ← format utama template perusahaan
 *  2. Laporan PO              (purchasing orders)
 *  3. Laporan Penjualan       (sales)
 *  4. Laporan Produksi        (production batches)
 *  5. Inventori               (current stock)
 *  6. Keuangan                (transactions)
 *  7. History Log             (activity log)
 *  8. Karyawan                (staff list)
 * 
 * CSV: data mentah tanpa styling, delimiter koma.
 */

/**
 * ROOT CAUSE FIX:
 *   ExcelJS membutuhkan format { formula: 'SUM(A1:A5)' } untuk formula.
 *   Jika ditulis cell.value = "=SUM(...)" → ExcelJS menyimpannya sebagai
 *   teks literal, terlihat sebagai '=SUM(...) di Excel (dengan apostrof di depan).
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─── Warna ────────────────────────────────────────────────────────────────────
const COLOR = {
  HEADER_BG:    'FFD9D9D9',
  COMPANY_FONT: 'FF1E3A5F',
  TOTAL_BG:     'FFFFFDE7',
};

// ─── Border helper ────────────────────────────────────────────────────────────
const mkBorder = (style = 'thin') => ({
  top: { style }, bottom: { style }, left: { style }, right: { style },
});

// ─── Hitung huruf kolom (1=A, 26=Z, 27=AA …) ─────────────────────────────────
const colLetter = (n) => {
  let s = '';
  while (n > 0) {
    s = String.fromCharCode(64 + ((n - 1) % 26 + 1)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// ─── Tulis baris 1-3: header laporan ─────────────────────────────────────────
const writeReportHeader = (sheet, totalCols, company, title, periode) => {
  const last = colLetter(totalCols);
  [[1, company, 14, true, false], [2, title, 12, true, false], [3, periode, 11, false, true]]
    .forEach(([rowNum, value, size, bold, italic]) => {
      sheet.mergeCells(`A${rowNum}:${last}${rowNum}`);
      const cell     = sheet.getCell(`A${rowNum}`);
      cell.value     = value;
      cell.font      = { name: 'Calibri', size, bold, italic, color: rowNum === 1 ? { argb: COLOR.COMPANY_FONT } : undefined };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(rowNum).height = rowNum === 1 ? 22 : 18;
    });
  sheet.getRow(4).height = 6;
};

// ─── Tulis baris 5: header kolom ─────────────────────────────────────────────
const writeColHeader = (sheet, headers) => {
  const row  = sheet.getRow(5);
  row.height = 20;
  headers.forEach((text, i) => {
    const cell     = row.getCell(i + 1);
    cell.value     = text;
    cell.font      = { name: 'Calibri', size: 11, bold: true };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = mkBorder('medium');
  });
};

/**
 * Tulis satu baris data.
 * values: array — elemen berupa nilai biasa ATAU { formula: 'SUM(A1:A5)' }
 *
 * KEY FIX: Cell dengan { formula: '...' } langsung di-assign ke cell.value.
 * ExcelJS mendeteksi objek dengan key 'formula' dan memperlakukannya sebagai
 * formula Excel, BUKAN string literal.
 */
const writeDataRow = (sheet, rowNum, values, {
  boldCols  = [],   // 0-based kolom yang bold
  rightCols = [],   // 0-based kolom yang right-aligned
  numFmtMap = {},   // { 0: '#,##0', 1: '0.00%', ... }
} = {}) => {
  const row  = sheet.getRow(rowNum);
  row.height = 16;
  values.forEach((val, c) => {
    const cell     = row.getCell(c + 1);
    cell.value     = val;                                // { formula: '...' } atau nilai biasa
    cell.font      = { name: 'Calibri', size: 11, bold: boldCols.includes(c) };
    cell.border    = mkBorder('thin');
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (numFmtMap[c]) cell.numFmt = numFmtMap[c];
  });
};

/**
 * Tulis baris TOTAL.
 * sumCols: { colIndex0based: { formula: 'SUM(F6:F10)', numFmt: '#,##0' } }
 * Label 'TOTAL' selalu di kolom pertama (index 0).
 */
const writeTotalRow = (sheet, rowNum, totalCols, sumCols = {}) => {
  const row  = sheet.getRow(rowNum);
  row.height = 20;
  for (let c = 1; c <= totalCols; c++) {
    const cell     = row.getCell(c);
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.TOTAL_BG } };
    cell.font      = { name: 'Calibri', size: 11, bold: true };
    cell.border    = mkBorder('medium');
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (c === 1) {
      cell.value = 'TOTAL';
    } else {
      const cfg = sumCols[c - 1]; // key adalah 0-based
      if (cfg) {
        cell.value  = { formula: cfg.formula }; // ← ExcelJS formula object
        if (cfg.numFmt) cell.numFmt = cfg.numFmt;
      }
    }
  }
};

// ─── Format tanggal ───────────────────────────────────────────────────────────
const fmtDate = (dt) => dt
  ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '-';

const fmtDateTime = (dt) => dt
  ? new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  : '-';

// =============================================================================
// MAIN: exportToExcel
// =============================================================================
export const exportToExcel = async (data, type = 'Daily') => {
  if (!data?.raw) return;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Keboen Bapak ERP';
  wb.created = new Date();

  const { raw, config } = data;
  const COMPANY    = (config?.entityName || 'KEBOEN BAPAK MANAGEMENT').toUpperCase();
  const now        = new Date();
  const periodeStr =
    type === 'Daily'   ? `Harian - ${now.toLocaleDateString('id-ID', { dateStyle: 'long' })}` :
    type === 'Weekly'  ? `Mingguan - Minggu ke-${Math.ceil(now.getDate() / 7)} ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` :
                         `Bulanan - ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

  const purchases    = raw.purchases    || [];
  const penjualan    = raw.penjualan    || [];
  const productions  = raw.productions  || [];
  const stocks       = raw.stocks       || [];
  const transactions = raw.transactions || [];
  const histories    = raw.histories    || [];
  const staffList    = raw.staffList    || [];

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — KEDATANGAN BAHAN BAKU
  // NETTO = QTY − (QTY × REFRAKSI)
  // Col map (1-based): A=NO B=TGL C=BARANG D=SUPPLIER E=STTB F=MOBIL
  //                    G=QTY H=REFRAKSI I=NETTO J=HARGA K=TOTAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Kedatangan Bahan Baku');
    const COLS   = 11;
    const WIDTHS = [6, 14, 22, 36, 32, 14, 12, 13, 12, 14, 18];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'LAPORAN KEDATANGAN BAHAN BAKU', periodeStr);
    writeColHeader(sh, ['NO','TANGGAL','JENIS BAHAN BAKU','SUPPLIER',
                        'NO STTB','NO MOBIL','QTY','REFRAKSI (%)','NETTO','HARGA','TOT. TRANSAKSI']);

    let r = 6;
    purchases.forEach((p, idx) => {
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },  // nomor urut
        fmtDate(p.createdAt),
        (p.item     || '').toUpperCase(),
        (p.supplier || 'SUPPLIER UMUM').toUpperCase(),
        p.noPO      || '-',
        p.vehicleNo || '-',
        parseFloat(p.qty)   || 0,                   // QTY (kolom G)
        0,                                           // Refraksi default 0 (kolom H)
        { formula: `G${r}-(G${r}*H${r})` },         // NETTO: formula =G6-(G6*H6)
        parseFloat(p.price) || 0,                    // Harga (kolom J)
        { formula: `I${r}*J${r}` },                  // Total: =I6*J6
      ], {
        boldCols:  [2, 3],
        rightCols: [6, 7, 8, 9, 10],
        numFmtMap: { 6: '#,##0.##', 7: '0.00%', 8: '#,##0.##', 9: '#,##0', 10: '#,##0' },
      });
      r++;
    });

    if (purchases.length > 0) {
      writeTotalRow(sh, r, COLS, {
        6:  { formula: `SUM(G6:G${r-1})`, numFmt: '#,##0.##' }, // QTY total
        8:  { formula: `SUM(I6:I${r-1})`, numFmt: '#,##0.##' }, // Netto total
        10: { formula: `SUM(K6:K${r-1})`, numFmt: '#,##0'    }, // Total transaksi
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — LAPORAN PO
  // SISA PO = QTY PO − QTY DITERIMA
  // Col map: A=NO B=BARANG C=SUPPLIER D=TGL E=NOPO F=QTYPO G=HARGA H=DITERIMA I=SISA J=STATUS
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Laporan PO');
    const COLS   = 10;
    const WIDTHS = [6, 25, 32, 14, 32, 12, 14, 14, 12, 12];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'LAPORAN PURCHASE ORDER', periodeStr);
    writeColHeader(sh, ['NO','NAMA BARANG','NAMA SUPPLIER','TGL PO','NO. PO',
                        'QTY PO','HARGA','QTY DITERIMA','SISA PO','STATUS']);

    let r = 6;
    purchases.forEach((p, idx) => {
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        (p.item     || '').toUpperCase(),
        (p.supplier || 'SUPPLIER UMUM').toUpperCase(),
        fmtDate(p.createdAt),
        p.noPO || '-',
        parseFloat(p.qty)          || 0,
        parseFloat(p.price)        || 0,
        parseFloat(p.totalReceived)|| 0,
        { formula: `F${r}-H${r}` },                 // SISA PO: =F6-H6
        p.status || 'PENDING',
      ], {
        boldCols:  [1, 2],
        rightCols: [5, 6, 7, 8],
        numFmtMap: { 5: '#,##0.##', 6: '#,##0', 7: '#,##0.##', 8: '#,##0.##' },
      });
      r++;
    });

    if (purchases.length > 0) {
      writeTotalRow(sh, r, COLS, {
        5: { formula: `SUM(F6:F${r-1})`, numFmt: '#,##0.##' },
        7: { formula: `SUM(H6:H${r-1})`, numFmt: '#,##0.##' },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — REKAP PENJUALAN
  // TOTAL HARGA = TOTAL AMOUNT × HARGA SATUAN
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Rekap Penjualan');
    const COLS   = 10;
    const WIDTHS = [6, 14, 14, 28, 28, 18, 14, 14, 16, 12];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'REKAP PENJUALAN', periodeStr);
    writeColHeader(sh, ['NO','BULAN','TGL KIRIM','CUSTOMER','PRODUK / ITEM',
                        'NOMOR INVOICE','TOTAL AMOUNT','HARGA SATUAN','TOTAL HARGA','STATUS']);

    let r = 6;
    penjualan.forEach((s, idx) => {
      const tgl = new Date(s.createdAt || Date.now());
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        tgl.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        fmtDate(s.createdAt),
        (s.customerName || 'UMUM').toUpperCase(),
        '-',
        s.invoiceId || '-',
        parseFloat(s.totalAmount) || 0,
        0,
        { formula: `G${r}*H${r}` },                 // Total Harga: =G6*H6
        s.status || 'PENDING',
      ], {
        boldCols:  [3],
        rightCols: [6, 7, 8],
        numFmtMap: { 6: '#,##0', 7: '#,##0', 8: '#,##0' },
      });
      r++;
    });

    if (penjualan.length > 0) {
      writeTotalRow(sh, r, COLS, {
        8: { formula: `SUM(I6:I${r-1})`, numFmt: '#,##0' },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 4 — LAPORAN PRODUKSI & STOK
  // TOTAL BIAYA = TARGET QTY × BIAYA UNIT
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Laporan Produksi & Stok');
    const COLS   = 9;
    const WIDTHS = [6, 14, 16, 30, 12, 12, 18, 14, 14];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'LAPORAN PRODUKSI & STOK', periodeStr);
    writeColHeader(sh, ['NO','TGL MULAI','NO. BATCH','NAMA PRODUK',
                        'TARGET QTY','ACTUAL QTY','STATUS','BIAYA UNIT','TOTAL BIAYA']);

    let r = 6;
    productions.forEach((p, idx) => {
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        fmtDate(p.startDate),
        p.noBatch || '-',
        (p.productName || '').toUpperCase(),
        parseFloat(p.targetQty) || 0,
        parseFloat(p.actualQty) || 0,
        p.status   || '-',
        parseFloat(p.unitCost)  || 0,
        { formula: `E${r}*H${r}` },                 // Total Biaya: =E6*H6
      ], {
        boldCols:  [3],
        rightCols: [4, 5, 7, 8],
        numFmtMap: { 4: '#,##0.##', 5: '#,##0.##', 7: '#,##0', 8: '#,##0' },
      });
      r++;
    });

    if (productions.length > 0) {
      writeTotalRow(sh, r, COLS, {
        4: { formula: `SUM(E6:E${r-1})`, numFmt: '#,##0.##' },
        5: { formula: `SUM(F6:F${r-1})`, numFmt: '#,##0.##' },
        8: { formula: `SUM(I6:I${r-1})`, numFmt: '#,##0'    },
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 5 — INVENTORI
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Inventori');
    const COLS   = 6;
    const WIDTHS = [6, 35, 18, 16, 10, 12];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'LAPORAN INVENTORI / STOK', periodeStr);
    writeColHeader(sh, ['NO','NAMA BARANG','KATEGORI','STOK SAAT INI','SATUAN','STATUS']);

    let r = 6;
    stocks.forEach((s, idx) => {
      const isCritical = (parseFloat(s.stock) || 0) < 10;
      const rowEl      = sh.getRow(r);
      rowEl.height     = 16;
      [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        (s.name     || '').toUpperCase(),
        (s.category || '').toUpperCase(),
        parseFloat(s.stock) || 0,
        (s.unit || '').toUpperCase(),
        isCritical ? 'KRITIS' : 'AMAN',
      ].forEach((val, c) => {
        const cell     = rowEl.getCell(c + 1);
        cell.value     = val;
        cell.border    = mkBorder('thin');
        cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'right' : 'center' };
        cell.font      = {
          name:  'Calibri',
          size:  11,
          bold:  c === 1,
          color: (c === 5 && isCritical) ? { argb: 'FFCC0000' } : undefined,
        };
        if (c === 3) cell.numFmt = '#,##0.##';
      });
      r++;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 6 — KEUANGAN
  // Summary: SUMIF INCOME, SUMIF EXPENSE, NET = INCOME − EXPENSE
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Keuangan');
    const COLS   = 7;
    const WIDTHS = [6, 18, 22, 18, 10, 18, 40];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, COLS, COMPANY, 'LAPORAN KEUANGAN', periodeStr);
    writeColHeader(sh, ['NO','TANGGAL','NO. TRANSAKSI','KATEGORI','TIPE','JUMLAH (Rp)','KETERANGAN']);

    let r = 6;
    transactions.forEach((t, idx) => {
      const isIncome = t.type === 'INCOME';
      const rowEl    = sh.getRow(r);
      rowEl.height   = 16;
      [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        fmtDate(t.date),
        t.trxNo     || '-',
        (t.category || '').toUpperCase(),
        t.type      || '-',
        parseFloat(t.amount) || 0,
        t.description || '-',
      ].forEach((val, c) => {
        const cell     = rowEl.getCell(c + 1);
        cell.value     = val;
        cell.border    = mkBorder('thin');
        cell.alignment = { vertical: 'middle', horizontal: c === 5 ? 'right' : 'center' };
        cell.font      = {
          name:  'Calibri',
          size:  11,
          color: c === 5 ? { argb: isIncome ? 'FF006600' : 'FFCC0000' } : undefined,
        };
        if (c === 5) cell.numFmt = '#,##0';
      });
      r++;
    });

    // Baris summary keuangan (3 baris: income, expense, net)
    if (transactions.length > 0) {
      const dataEnd    = r - 1;
      const incomeRow  = r + 1;  // +1 spacer
      const expenseRow = r + 2;
      const netRow     = r + 3;

      [
        { rowNum: incomeRow,  label: 'TOTAL INCOME',  formula: `SUMIF(E6:E${dataEnd},"INCOME",F6:F${dataEnd})` },
        { rowNum: expenseRow, label: 'TOTAL EXPENSE', formula: `SUMIF(E6:E${dataEnd},"EXPENSE",F6:F${dataEnd})` },
        { rowNum: netRow,     label: 'NET BALANCE',   formula: `F${incomeRow}-F${expenseRow}` },
      ].forEach(({ rowNum, label, formula }) => {
        const shRow = sh.getRow(rowNum);
        shRow.height = 18;
        for (let c = 1; c <= COLS; c++) {
          const cell     = shRow.getCell(c);
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.TOTAL_BG } };
          cell.font      = { name: 'Calibri', size: 11, bold: true };
          cell.border    = mkBorder('medium');
          cell.alignment = { vertical: 'middle', horizontal: c === 6 ? 'right' : 'center' };
          if (c === 5) cell.value = label;
          if (c === 6) {
            cell.value  = { formula };  // ← { formula } object, bukan string "=..."
            cell.numFmt = '#,##0';
          }
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 7 — HISTORY LOG
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('History Log');
    const WIDTHS = [6, 20, 18, 22, 22, 10, 45];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, 7, COMPANY, 'HISTORY LOG AKTIVITAS SISTEM', periodeStr);
    writeColHeader(sh, ['NO','WAKTU','USER','AKSI','ITEM','QTY','CATATAN']);

    let r = 6;
    histories.forEach((h, idx) => {
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        fmtDateTime(h.createdAt),
        (h.user   || '').toUpperCase(),
        (h.action || '').replace(/_/g, ' '),
        (h.item   || '').toUpperCase(),
        parseFloat(h.quantity) || 0,
        h.notes || '-',
      ], { rightCols: [5], numFmtMap: { 5: '#,##0.##' } });
      r++;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 8 — KARYAWAN
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sh     = wb.addWorksheet('Karyawan');
    const WIDTHS = [6, 14, 20, 20, 25, 14, 30];
    WIDTHS.forEach((w, i) => { sh.getColumn(i + 1).width = w; });
    writeReportHeader(sh, 7, COMPANY, 'DATA KARYAWAN', periodeStr);
    writeColHeader(sh, ['NO','STAFF ID','NAMA DEPAN','NAMA BELAKANG','JABATAN','ROLE','EMAIL']);

    let r = 6;
    staffList.forEach((s, idx) => {
      writeDataRow(sh, r, [
        idx === 0 ? 1 : { formula: `A${r-1}+1` },
        s.staffId          || '-',
        (s.firstName       || '').toUpperCase(),
        (s.lastName        || '').toUpperCase(),
        (s.designation     || '').toUpperCase(),
        (s.role            || '').toUpperCase(),
        s.email            || '-',
      ], { boldCols: [2, 3] });
      r++;
    });
  }

  // ── Simpan file ───────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `KeboenBapak_Laporan_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
  );
};

// =============================================================================
// CSV EXPORT — data mentah, delimiter koma, tanpa styling
// Kalkulasi dilakukan di JS karena CSV tidak mendukung formula
// =============================================================================
export const exportToCSV = (data, type = 'Daily') => {
  if (!data?.raw) return;

  const { raw, config } = data;
  const COMPANY = config?.entityName || 'Keboen Bapak Management';
  const now     = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  const esc    = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const csvRow = (cells) => cells.map(esc).join(',');

  const purchases = raw.purchases || [];
  let totalQTY = 0;
  let totalNetto  = 0;

  const dataRows = purchases.map((p, i) => {
    const QTY   = parseFloat(p.qty)   || 0;
    const refraksi = 0;
    const netto    = QTY - QTY * refraksi;
    const harga    = parseFloat(p.price) || 0;
    totalQTY   += QTY;
    totalNetto    += netto;
    return csvRow([
      i + 1,
      fmtDate(p.createdAt),
      (p.item     || '').toUpperCase(),
      (p.supplier || 'SUPPLIER UMUM').toUpperCase(),
      p.noPO      || '-',
      p.vehicleNo || '-',
      QTY,
      refraksi,
      netto.toFixed(2),
      harga,
      (netto * harga).toFixed(0),
    ]);
  });

  const lines = [
    csvRow([COMPANY]),
    csvRow(['LAPORAN KEDATANGAN BAHAN BAKU']),
    csvRow([`Periode: ${type} - ${now}`]),
    '',
    csvRow(['NO','TANGGAL','JENIS BAHAN BAKU','SUPPLIER','NO STTB',
            'NO MOBIL','QTY','REFRAKSI','NETTO','HARGA','TOT. TRANSAKSI']),
    ...dataRows,
    csvRow(['TOTAL','','','','','', totalQTY.toFixed(2), '', totalNetto.toFixed(2), '', '']),
  ];

  saveAs(
    new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `KeboenBapak_Kedatangan_${type}_${new Date().toISOString().split('T')[0]}.csv`
  );
};