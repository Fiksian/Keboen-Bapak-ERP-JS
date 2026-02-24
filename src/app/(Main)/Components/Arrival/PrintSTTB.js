'use client'

import React from 'react';

const PrintSTTB = ({ data }) => {
  if (!data) return null;

  const getQtyDetail = () => {
    if (data.netWeight) return { val: data.netWeight, unit: 'KG' };
    
    if (!data.qty) return { val: '0', unit: 'Unit' };
    const parts = data.qty.toString().split(' ');
    return {
      val: parts[0] || '0',
      unit: parts[1] || 'Unit'
    };
  };

  const { val, unit } = getQtyDetail();

  const displaySuratJalan = data.suratJalan || data.receipts?.[0]?.suratJalan || "____________________";
  const displayVehicleNo = data.vehicleNo || data.receipts?.[0]?.vehicleNo || "____________________";
  const displayCondition = data.condition || data.receipts?.[0]?.condition || "GOOD";
  const displayNotes = data.notes || data.receipts?.[0]?.notes || "Tidak ada catatan tambahan.";
  const displayReceivedAt = data.receivedAt || data.receipts?.[0]?.receivedAt || new Date();
  const displayReceivedBy = data.receivedBy || data.receipts?.[0]?.receivedBy || "System";
  const gross = data.grossWeight || data.receipts?.[0]?.grossWeight || 0;
  const tare = data.tareWeight || data.receipts?.[0]?.tareWeight || 0;
  const net = data.netWeight || data.receipts?.[0]?.netWeight || 0;

  return (
    <div 
      id="print-area" 
      className="hidden print:block print:absolute print:inset-0 print:z-9999 bg-white text-black min-h-screen p-0 print:p-0"
    >
      <div className="max-w-[210mm] mx-auto p-12">
        
        <div className="flex justify-between border-b-4 border-black pb-6 mb-8">
          <div className="text-left">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Surat Tanda Terima Barang</h1>
            <div className="flex gap-4 mt-3">
              <p className="text-[10px] font-black px-2 py-1 bg-black text-white italic tracking-widest uppercase">STTB-INBOUND</p>
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

        <div className="grid grid-cols-2 gap-10 mb-8 border-b border-gray-100 pb-8 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic mb-1">Dikirim Oleh (Vendor):</p>
              <p className="font-black text-lg uppercase leading-none tracking-tight">{data.supplier || "Supplier Umum"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase italic mb-1">No. Surat Jalan:</p>
                <p className="font-black text-md tracking-widest uppercase border-b-2 border-black inline-block w-full">
                  {displaySuratJalan}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase italic mb-1">No. Kendaraan:</p>
                <p className="font-black text-md tracking-widest uppercase border-b-2 border-black inline-block w-full">
                  {displayVehicleNo}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase italic mb-1">Tanggal & Waktu Terima:</p>
              <p className="font-bold text-lg leading-none uppercase">
                {new Date(displayReceivedAt).toLocaleDateString('id-ID', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                })}
              </p>
              <p className="text-xs font-black text-gray-600 mt-1 uppercase">
                Pukul {new Date(displayReceivedAt).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })} WIB
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 text-left">
          <p className="text-[10px] font-black uppercase mb-3 text-gray-400 italic">Rincian Item Yang Diterima:</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y-2 border-black bg-gray-50">
                <th className="py-4 px-4 text-left text-xs uppercase font-black">Deskripsi Barang / Material</th>
                <th className="py-4 px-4 text-center text-xs uppercase font-black w-32">Kuantitas</th>
                <th className="py-4 px-4 text-center text-xs uppercase font-black">Satuan</th>
                <th className="py-4 px-4 text-left text-xs uppercase font-black">Kondisi Fisik</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-gray-100">
                <td className="py-6 px-4 text-left">
                  <p className="font-black text-lg uppercase tracking-tight leading-none">{data.item}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Kategori: {data.category || 'General'}</p>
                </td>
                <td className="py-6 px-4 text-center">
                  <span className="text-2xl font-black italic">{val}</span>
                </td>
                <td className="py-6 px-4 text-center uppercase font-bold text-sm">
                  {unit}
                </td>
                <td className="py-6 px-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[8px] font-bold ${displayCondition === 'GOOD' ? 'bg-black text-white' : ''}`}>
                        {displayCondition === 'GOOD' ? '✓' : ''}
                      </div>
                      <span className="text-[11px] font-bold uppercase">Baik / OK</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[8px] font-bold ${displayCondition !== 'GOOD' ? 'bg-black text-white' : ''}`}>
                         {displayCondition !== 'GOOD' ? '✓' : ''}
                      </div>
                      <span className="text-[11px] font-bold uppercase">Rusak / Bermasalah</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-10 p-5 bg-gray-50 border-2 border-black rounded-2xl">
          <p className="text-[10px] font-black uppercase mb-4 text-black italic text-left">Verifikasi Timbangan (Kg):</p>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-left border-l-2 border-gray-200 pl-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Berat Isi (Gross)</p>
              <p className="text-xl font-black tracking-tight">{gross.toFixed(2)} KG</p>
            </div>
            <div className="text-left border-l-2 border-gray-200 pl-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Berat Kosong (Tare)</p>
              <p className="text-xl font-black tracking-tight">{tare.toFixed(2)} KG</p>
            </div>
            <div className="text-left border-l-2 border-black pl-4 bg-white py-2 shadow-sm">
              <p className="text-[9px] font-black text-black uppercase tracking-widest mb-1 italic">Netto (Bersih)</p>
              <p className="text-2xl font-black tracking-tighter text-black underline decoration-2">{net.toFixed(2)} KG</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-10 text-left">
          <div className="border-2 border-dashed border-gray-200 p-5 rounded-[24px]">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 italic">Catatan Pemeriksaan Gudang:</p>
            <p className="text-xs font-medium text-gray-700 leading-relaxed italic">
                {displayNotes}
            </p>
          </div>
          
          <div className="text-center flex flex-col items-center justify-between py-2">
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Verifikasi Sistem Gudang,</p>
              <p className="text-[10px] font-black uppercase italic underline decoration-2">Receiver PIC</p>
            </div>
            <div className="mt-8">
              <p className="font-black border-b-2 border-black inline-block px-10 py-1 uppercase tracking-widest leading-none mb-1 text-lg">
                {displayReceivedBy}
              </p>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">
                E-Signature Verified via ERP System
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-6">
          <div className="flex justify-between items-end">
            <div className="text-left space-y-1">
              <p className="text-[8px] text-gray-400 italic font-bold">
                * Putih: Arsip Gudang | Merah: Admin Finance | Kuning: Copy Vendor
              </p>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                Internal Document - Keboen Bapak Stock Management v2.0
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