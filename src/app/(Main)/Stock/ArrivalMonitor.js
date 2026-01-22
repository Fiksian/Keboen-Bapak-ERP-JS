'use client'

import React, { useState } from 'react';
import { Clock, PackageCheck, X, FileText, User, ClipboardCheck, Loader2 } from 'lucide-react';

const ArrivalMonitor = ({ arrivals, onRefresh }) => {
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    suratJalan: '',
    receivedBy: '',
    notes: '',
    condition: 'GOOD'
  });

  if (arrivals.length === 0) return null;

  const handleOpenReceipt = (arrival) => {
    setSelectedArrival(arrival);
    setFormData({ ...formData, receivedBy: '' }); // Reset form
  };

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/purchasing/${selectedArrival.id}/receive`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receivedQty: parseFloat(selectedArrival.qty) // Sesuai skema
        }) 
      });

      if (res.ok) {
        setSelectedArrival(null);
        onRefresh();
      } else {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.message}`);
      }
    } catch (error) {
      console.error("RECEIVE_ERROR:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-orange-50/50 p-6 rounded-[32px] border border-orange-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-200">
          <Clock size={16} />
        </div>
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest italic">
          Arrival Monitor <span className="text-orange-500">({arrivals.length} In-Transit)</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arrivals.map((arrival) => (
          <div 
            key={arrival.id} 
            className="bg-white p-5 rounded-[24px] flex justify-between items-center shadow-sm border border-transparent hover:border-orange-500 transition-all group"
          >
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <PackageCheck size={14} className="text-orange-500" />
                <p className="font-black text-gray-800 uppercase text-xs tracking-tight">
                  {arrival.item}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                {arrival.qty} • {arrival.category}
              </p>
            </div>
            
            <button 
              onClick={() => handleOpenReceipt(arrival)} 
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-xl cursor-pointer transition-colors shadow-md shadow-orange-100"
            >
              TERIMA
            </button>
          </div>
        ))}
      </div>

      {/* MODAL RECEIPT / BUKTI PENERIMAAN */}
      {selectedArrival && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setSelectedArrival(null)} />
          
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Goods Receipt</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Validasi Penerimaan Barang</p>
                </div>
                <button onClick={() => setSelectedArrival(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
                <p className="text-[9px] font-black text-blue-600 uppercase italic mb-1">Item to Receive:</p>
                <p className="font-black text-gray-800 uppercase leading-none">{selectedArrival.item}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 italic">PO No: {selectedArrival.noPO}</p>
              </div>

              <form onSubmit={handleSubmitReceipt} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">No. Surat Jalan Vendor</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="Contoh: SJ-2026-001"
                      value={formData.suratJalan}
                      onChange={(e) => setFormData({...formData, suratJalan: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Petugas Penerima (PIC)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      required
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="Nama Lengkap Anda"
                      value={formData.receivedBy}
                      onChange={(e) => setFormData({...formData, receivedBy: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Kondisi Fisik</label>
                    <select 
                      className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-xs font-black uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <option value="GOOD">BAIK / OK</option>
                      <option value="DAMAGED">RUSAK</option>
                      <option value="INCOMPLETE">TIDAK LENGKAP</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Qty Diterima</label>
                    <div className="w-full bg-gray-200/50 rounded-2xl py-3 px-4 text-xs font-black text-gray-500">
                      {selectedArrival.qty}
                    </div>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <ClipboardCheck size={18} /> Submit Penerimaan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrivalMonitor;