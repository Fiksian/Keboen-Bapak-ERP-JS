import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, type = 'Daily') => {
  if (!data || !data.raw) return;

  const workbook = new ExcelJS.Workbook();
  const { raw, finance } = data;
  const dateStr = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  const styleHeader = (sheet, color) => {
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 25;
  };

  const sheetReport = workbook.addWorksheet('Report Summary');
  sheetReport.columns = [
    { header: 'ASPEK BISNIS', key: 'aspect', width: 25 },
    { header: 'METRIK / DESKRIPSI', key: 'metric', width: 40 },
    { header: `NILAI (${type.toUpperCase()})`, key: 'value', width: 25 },
  ];

  sheetReport.addRows([
    ['KEUANGAN', 'Total Pemasukan (Income)', finance.totalIncome],
    ['KEUANGAN', 'Total Pengeluaran (Expense)', finance.totalExpense],
    ['KEUANGAN', 'Saldo Bersih (Net Balance)', finance.netBalance],
    ['PENJUALAN', 'Total Nilai Invoice', finance.totalSalesInvoice || 0],
    ['PENJUALAN', 'Jumlah Transaksi Penjualan', raw.penjualan.length],
    ['PRODUKSI', 'Batch Produksi Baru', raw.productions.length],
    ['INVENTORI', 'Total Item Unik', raw.stocks.length],
    ['INVENTORI', 'Item Stok Kritis (< 10)', raw.stocks.filter(s => s.stock < 10).length],
    ['HR', 'Total Karyawan Aktif', raw.staffList.length],
    ['PURCHASING', 'PO Dibuat dalam Periode ini', raw.purchases.length],
    ['AKTIVITAS', 'Total Log Aktivitas', raw.histories.length],
    ['INFO', 'Periode Laporan', type],
    ['INFO', 'Tanggal Cetak', dateStr],
  ]);

  sheetReport.getColumn(3).numFmt = '#,##0';
  styleHeader(sheetReport, '1E293B');

  const sheetTrx = workbook.addWorksheet('Keuangan');
  sheetTrx.columns = [
    { header: 'Tanggal', key: 'date', width: 20 },
    { header: 'No. Transaksi', key: 'trxNo', width: 20 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Tipe', key: 'type', width: 12 },
    { header: 'Jumlah', key: 'amount', width: 15 },
    { header: 'Metode', key: 'method', width: 12 },
    { header: 'Deskripsi', key: 'description', width: 35 },
  ];
  raw.transactions.forEach(t => sheetTrx.addRow({ 
    ...t, 
    date: new Date(t.date).toLocaleString('id-ID') 
  }));
  sheetTrx.getColumn(5).numFmt = '#,##0';
  styleHeader(sheetTrx, '4F46E5');

  const sheetSales = workbook.addWorksheet('Penjualan');
  sheetSales.columns = [
    { header: 'Tanggal', key: 'createdAt', width: 20 },
    { header: 'Invoice ID', key: 'invoiceId', width: 20 },
    { header: 'Customer', key: 'customerName', width: 25 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Jml Item', key: 'totalItems', width: 10 },
  ];
  raw.penjualan.forEach(s => sheetSales.addRow({ 
    ...s, 
    createdAt: new Date(s.createdAt).toLocaleString('id-ID'),
  }));
  sheetSales.getColumn(4).numFmt = '#,##0';
  styleHeader(sheetSales, 'F59E0B');

  const sheetProd = workbook.addWorksheet('Produksi');
  sheetProd.columns = [
    { header: 'Tgl Mulai', key: 'startDate', width: 20 },
    { header: 'No. Batch', key: 'noBatch', width: 15 },
    { header: 'Produk', key: 'productName', width: 25 },
    { header: 'Target', key: 'targetQty', width: 12 },
    { header: 'Actual', key: 'actualQty', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Biaya Unit', key: 'unitCost', width: 15 },
  ];
  raw.productions.forEach(p => sheetProd.addRow({ 
    ...p, 
    startDate: new Date(p.startDate).toLocaleDateString('id-ID') 
  }));
  sheetProd.getColumn(7).numFmt = '#,##0';
  styleHeader(sheetProd, '10B981');

  const sheetPur = workbook.addWorksheet('Purchasing');
  sheetPur.columns = [
    { header: 'Tgl Pengajuan', key: 'createdAt', width: 20 },
    { header: 'No. PO', key: 'noPO', width: 15 },
    { header: 'Item', key: 'item', width: 25 },
    { header: 'Qty Order', key: 'qty', width: 12 },
    { header: 'Qty Diterima', key: 'totalReceived', width: 12 },
    { header: 'Supplier', key: 'supplier', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
  ];
  raw.purchases.forEach(p => sheetPur.addRow({
    ...p,
    createdAt: new Date(p.createdAt).toLocaleDateString('id-ID')
  }));
  styleHeader(sheetPur, '0891B2');

  const sheetStock = workbook.addWorksheet('Inventori');
  sheetStock.columns = [
    { header: 'Nama Barang', key: 'name', width: 30 },
    { header: 'Kategori', key: 'category', width: 15 },
    { header: 'Stok Saat Ini', key: 'stock', width: 15 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Tipe', key: 'type', width: 15 },
  ];
  raw.stocks.forEach(s => sheetStock.addRow(s));
  styleHeader(sheetStock, 'E11D48');

  const sheetHistory = workbook.addWorksheet('History Log');
  sheetHistory.columns = [
    { header: 'Waktu', key: 'createdAt', width: 20 },
    { header: 'User', key: 'user', width: 15 },
    { header: 'Aksi', key: 'action', width: 15 },
    { header: 'Item', key: 'item', width: 20 },
    { header: 'Qty', key: 'quantity', width: 10 },
    { header: 'Catatan', key: 'notes', width: 35 },
  ];
  raw.histories.forEach(h => sheetHistory.addRow({
    ...h,
    createdAt: new Date(h.createdAt).toLocaleString('id-ID')
  }));
  styleHeader(sheetHistory, '6B7280');

  const sheetStaff = workbook.addWorksheet('Karyawan');
  sheetStaff.columns = [
    { header: 'Staff ID', key: 'staffId', width: 15 },
    { header: 'Nama Depan', key: 'firstName', width: 15 },
    { header: 'Nama Belakang', key: 'lastName', width: 15 },
    { header: 'Jabatan', key: 'designation', width: 20 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Email', key: 'email', width: 25 },
  ];
  raw.staffList.forEach(s => sheetStaff.addRow(s));
  styleHeader(sheetStaff, '6366F1');

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `KeboenBapak_FullReport_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
};