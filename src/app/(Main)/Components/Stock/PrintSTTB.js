'use client'

import React from 'react';

const PrintSTTB = ({ data }) => {
  if (!data) return null;

  return (
    <div 
      id="print-area" 
      className="hidden print:block print:absolute print:inset-0 print:z-[9999] bg-white text-black min-h-screen p-0 print:p-0"
    >
      <div className="max-w-[210mm] mx-auto p-12">
        
        {/* Header STTB */}
        <div className="flex justify-between border-b-4 border-black pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Surat Tanda Terima Barang</h1>
            <div className="flex gap-4 mt-2">
              <p className="text-xs font-bold px-2 py-1 bg-black text-white italic">STTB-INBOUND</p>
              <p className="text-sm font-bold text-gray-800">No. PO: {data.noPO}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase italic font-black">KEBOEN BAPAK ERP</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-tight">
              Warehouse & Logistics Department<br/>
              Integrated Management System
            </p>
          </div>
        </div>

        {/* Info Transaksi & Pengiriman */}
        <div className="grid grid-cols-2 gap-10 mb-10 border-b border-gray-100 pb-8">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">Dikirim Oleh (Vendor):</p>
              <p className="font-black text-lg uppercase leading-none">{data.supplier || "Supplier Umum"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">No. Surat Jalan Vendor:</p>
              <p className="font-bold text-md tracking-widest uppercase">{data.suratJalan || "____________________"}</p>
            </div>
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">Tanggal Diterima:</p>
              <p className="font-bold text-lg leading-none">
                {data.receivedAt 
                  ? new Date(data.receivedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                  : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                }
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">Waktu Kedatangan:</p>
              <p className="font-bold uppercase">
                {data.receivedAt 
                  ? new Date(data.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                  : "-- : --"} WIB
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Detail Barang */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase mb-3 text-gray-400 italic">Rincian Item Yang Diterima:</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y-2 border-black bg-gray-50 print:bg-gray-100">
                <th className="py-4 px-4 text-left text-xs uppercase font-black">Deskripsi Barang / Material</th>
                <th className="py-4 px-4 text-center text-xs uppercase font-black w-32">Kuantitas</th>
                <th className="py-4 px-4 text-center text-xs uppercase font-black">Satuan</th>
                <th className="py-4 px-4 text-left text-xs uppercase font-black">Kondisi</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-gray-100">
                <td className="py-6 px-4">
                  <p className="font-black text-lg uppercase tracking-tight leading-none">{data.item}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Ref ID: {data.id?.slice(-8).toUpperCase() || 'N/A'}</p>
                </td>
                <td className="py-6 px-4 text-center">
                  <span className="text-xl font-black italic">{data.qty?.split(' ')[0] || data.qty}</span>
                </td>
                <td className="py-6 px-4 text-center uppercase font-bold">
                  {data.qty?.split(' ')[1] || 'Unit'}
                </td>
                <td className="py-6 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[8px] font-bold">OK</div>
                    <span className="text-[12px] font-bold uppercase">Baik</span>
                    <div className="w-4 h-4 border border-black rounded-sm ml-2"></div>
                    <span className="text-[12px] font-bold uppercase">Rusak</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Area Catatan & Tanda Tangan */}
        <div className="grid grid-cols-2 gap-10 mt-10">
          <div className="border-2 border-dashed border-gray-200 p-4 rounded-xl">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 italic">Catatan Pemeriksaan Gudang:</p>
            <div className="h-16"></div>
          </div>
          
          <div className="text-center flex flex-col items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Diterima Oleh,</p>
              <p className="text-[10px] font-black uppercase italic underline decoration-2">Petugas Gudang (PIC)</p>
            </div>
            <div className="mt-12">
              <p className="font-black border-b-2 border-black inline-block px-8 py-1 uppercase tracking-widest leading-none mb-1">
                {data.receivedBy || "...................."}
              </p>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">
                {data.receivedBy ? "SYSTEM VERIFIED" : "MANUAL SIGNATURE"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Dokumen */}
        <div className="fixed bottom-12 left-12 right-12 border-t border-gray-200 pt-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[8px] text-gray-400 italic font-bold">
                * Putih: Gudang | Merah: Finance | Kuning: Vendor
              </p>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                Generated via Next.js Stock History Module
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-300 uppercase italic">
                Printed: {new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintSTTB;