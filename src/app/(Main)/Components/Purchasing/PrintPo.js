'use client'

import React from 'react';

const PrintPO = ({ data }) => {
  if (!data) return null;

  const qtyValue = parseFloat(data.qty) || 0;
  const unitLabel = data.unit || "Unit";

  const parsePrice = (p) => {
    if (!p) return 0;
    const cleanPrice = typeof p === 'string' ? p.replace(/[^0-9.-]+/g, "") : p;
    return parseFloat(cleanPrice) || 0;
  };

  const priceValue = parsePrice(data.price);
  const total = qtyValue * priceValue;

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Default: Portrait. Ganti ke 'landscape' jika ingin melebar */
          @page { 
            size: auto; /* Membiarkan user memilih di dialog print */
            margin: 0mm; 
          }
          
          body {
            background-color: white !important;
          }

          /* Memastikan warna background (seperti bg-gray-50) ikut tercetak */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div id="print-area" className="hidden print:block p-10 bg-white text-black min-h-screen font-sans">
        <div className="max-w-[210mm] mx-auto"> 
          
          <div className="flex justify-between border-b-4 border-black pb-6 mb-8">
            <div className="text-left">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Purchasing Order</h1>
              <div className="flex gap-4 mt-3">
                <p className="text-sm font-bold text-gray-800 uppercase tracking-tighter">No. PO: {data.noPO || '-'}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black uppercase italic leading-none">KEBOEN BAPAK ERP</h2>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-tight mt-2">
                Warehouse & Logistics Department<br/>
                Integrated Management System
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="space-y-1 border-l-2 border-black pl-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">Supplier / Vendor:</p>
              <p className="font-black text-lg uppercase">{data.supplier || 'General Supplier'}</p>
            </div>
            <div className="text-right space-y-1 border-r-2 border-black pr-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase italic">Tanggal Order:</p>
              <p className="font-black uppercase">
                {data.createdAt 
                  ? new Date(data.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '-'}
              </p>
            </div>
          </div>

          <table className="w-full border-collapse mb-10 table-fixed">
            <thead>
              <tr className="border-y-2 border-black bg-gray-50 text-[10px]">
                <th className="py-3 px-2 text-left font-black uppercase italic w-[40%]">Deskripsi Barang</th>
                <th className="py-3 px-2 text-center font-black uppercase italic w-[15%]">Quantity</th>
                <th className="py-3 px-2 text-center font-black uppercase italic w-[15%]">Satuan</th>
                <th className="py-3 px-2 text-right font-black uppercase italic w-[15%]">Harga Satuan</th>
                <th className="py-3 px-2 text-right font-black uppercase italic w-[15%]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-6 px-2 font-black uppercase text-sm tracking-tight break-words">
                  {data.item || 'Produk Tidak Diketahui'}
                </td>
                <td className="py-6 px-2 text-center font-black text-sm">{qtyValue.toLocaleString('id-ID')}</td>
                <td className="py-6 px-2 text-center font-bold text-xs text-gray-600 uppercase italic">{unitLabel}</td>
                <td className="py-6 px-2 text-right text-sm">
                  Rp {priceValue.toLocaleString('id-ID')}
                </td>
                <td className="py-6 px-2 text-right font-black text-sm">
                  Rp {total.toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-4 border-black bg-gray-50">
                <td colSpan="4" className="py-4 px-2 text-right font-black uppercase italic text-sm text-gray-500">Grand Total</td>
                <td className="py-4 px-2 text-right font-black text-xl italic tracking-tighter">
                  Rp {total.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-20 mt-24 text-center">
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase mb-20 tracking-widest">Dipesan Oleh,</p>
              <div className="w-48 border-b-2 border-black pb-1">
                <p className="font-black uppercase text-sm">{data.requestedBy || '-'}</p>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 font-bold uppercase italic tracking-widest">Staff Purchasing</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase mb-20 tracking-widest">Disetujui Oleh,</p>
              <div className="w-48 border-b-2 border-black pb-1">
                <p className="font-black uppercase text-sm">{data.approvedBy || "...................."}</p>
              </div>
              <p className="text-[9px] text-gray-500 mt-1 font-bold uppercase italic tracking-widest">Authorized Manager</p>
            </div>
          </div>

          <div className="mt-20 border-t border-black pt-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-black uppercase italic">Kategori: {data.category || '-'}</p>
                 <p className="text-[8px] text-gray-500 italic max-w-md leading-relaxed">
                  Dokumen ini dihasilkan secara otomatis oleh Keboen Bapak ERP pada {new Date().toLocaleString('id-ID')}. 
                  Berfungsi sebagai PO resmi yang sah.
                </p>
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">
                PO-TYPE: {data.type} / ID: {data.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintPO;