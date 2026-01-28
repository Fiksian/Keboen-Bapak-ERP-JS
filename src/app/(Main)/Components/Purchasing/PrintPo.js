'use client'

import React from 'react';

const PrintPO = ({ data }) => {
  if (!data) return null;

  const total = (parseFloat(data.qty?.split(' ')[0]) || 0) * (parseFloat(data.amount) || 0);

  return (
    <div id="print-area" className="hidden print:block p-10 bg-white text-black min-h-screen">
      {/* Header Nota */}
      <div className="flex justify-between border-b-4 border-black pb-6 mb-8">
          <div className="text-left">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Purchasing Order</h1>
            <div className="flex gap-4 mt-3">
              <p className="text-sm font-bold text-gray-800 uppercase tracking-tighter">No. PO: {data.noPO}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase italic font-black leading-none">KEBOEN BAPAK ERP</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-tight mt-2 text-right">
              Warehouse & Logistics Department<br/>
              Integrated Management System
            </p>
          </div>
        </div>

      {/* Info Transaksi */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase italic">Supplier / Vendor:</p>
          <p className="font-bold text-lg">{data.supplier}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase italic">Tanggal Order:</p>
          <p className="font-bold">{new Date(data.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Tabel Barang */}
      <table className="w-full border-collapse mb-10">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="py-3 text-left text-xs uppercase italic">Deskripsi Barang</th>
            <th className="py-3 text-center text-xs uppercase italic">Qty</th>
            <th className="py-3 text-right text-xs uppercase italic">Harga Satuan</th>
            <th className="py-3 text-right text-xs uppercase italic">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4 font-bold uppercase">{data.item}</td>
            <td className="py-4 text-center font-bold">{data.qty}</td>
            <td className="py-4 text-right">Rp {parseFloat(data.amount).toLocaleString('id-ID')}</td>
            <td className="py-4 text-right font-bold">Rp {total.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td colSpan="3" className="py-4 text-right font-black uppercase italic">Grand Total</td>
            <td className="py-4 text-right font-black text-xl italic">Rp {total.toLocaleString('id-ID')}</td>
          </tr>
        </tfoot>
      </table>

      {/* Tanda Tangan */}
      <div className="grid grid-cols-2 gap-10 mt-20 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase mb-16">Dipesan Oleh,</p>
          <p className="font-black border-b border-black inline-block px-4">{data.requestedBy}</p>
          <p className="text-[9px] text-gray-500 mt-1 italic italic italic">Purchasing Dept.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase mb-16">Disetujui Oleh,</p>
          <p className="font-black border-b border-black inline-block px-4">{data.approvedBy || "...................."}</p>
          <p className="text-[9px] text-gray-500 mt-1 italic">Direktur / Manager</p>
        </div>
      </div>

      {/* Footer Nota */}
      <div className="mt-20 border-t border-dotted border-gray-300 pt-4">
        <p className="text-[8px] text-gray-400 italic">
          Dokumen ini dihasilkan secara otomatis oleh sistem pada {new Date().toLocaleString('id-ID')}. 
          Berfungsi sebagai PO resmi dan bukti tanda terima (STTB) jika telah ditandatangani bagian gudang.
        </p>
      </div>
    </div>
  );
};

export default PrintPO;