'use client'

import React, { useState } from 'react';
import { 
  Clock, PackageCheck, X, FileText, 
  Truck, ClipboardCheck, Loader2, AlertCircle,
  Lock, ChevronRight
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const ArrivalMonitor = ({ arrivals, onRefresh }) => {
  const { data: session } = useSession();
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPO, setConfirmPO] = useState('');
  const [formData, setFormData] = useState({
    suratJalan: '',
    vehicleNo: '',
    condition: 'GOOD',
    notes: ''
  });

  const isAuthorized = ["Admin", "Supervisor", "Test"].includes(session?.user?.role);

  if (!arrivals || arrivals.length === 0) return null;

  const handleOpenModal = (arrival) => {
    if (!isAuthorized) return; 
    
    setSelectedArrival(arrival);
    setConfirmPO('');
    setFormData({
      suratJalan: '',
      vehicleNo: '',
      condition: 'GOOD',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (confirmPO.trim().toUpperCase() !== selectedArrival.noPO.toUpperCase()) {
      return alert("NOMOR PO TIDAK SESUAI! Harap periksa kembali dokumen fisik PO Anda.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/purchasing/${selectedArrival.id}/receive`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receivedBy: session?.user?.name || 'Warehouse Staff',
          receivedQty: parseFloat(selectedArrival.qty) || 0
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
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-orange-50/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-orange-100 mb-8">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200 shrink-0">
            <Clock size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-[11px] md:text-xs font-black text-gray-800 uppercase tracking-widest italic leading-none">Arrival Monitor</h3>
            <p className="text-[9px] md:text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-tighter">
              {arrivals.length} Units In-Transit / Pending
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="text-[8px] font-black bg-orange-200/50 text-orange-700 px-2 py-1 rounded-lg uppercase italic">Live Sync</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {arrivals.map((arrival) => (
          <div 
            key={arrival.id} 
            onClick={() => isAuthorized && handleOpenModal(arrival)}
            className={`bg-white p-4 md:p-5 rounded-[20px] md:rounded-[24px] flex justify-between items-center shadow-sm border border-transparent transition-all group ${isAuthorized ? 'cursor-pointer hover:border-orange-500 hover:shadow-md active:scale-[0.98]' : ''}`}
          >
            <div className="space-y-1 text-left min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <PackageCheck size={14} className="text-orange-500 shrink-0" />
                <p className="font-black text-gray-800 uppercase text-[11px] md:text-xs tracking-tight truncate">
                  {arrival.item}
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[8px] md:text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">
                  {(parseFloat(arrival.qty) || 0).toLocaleString('id-ID')} {arrival.unit || 'UNIT'}
                </span>
                <span className="text-[8px] md:text-[9px] text-orange-400 font-bold uppercase tracking-tighter truncate italic">
                  {arrival.supplier || 'Vendor'}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {isAuthorized ? (
                <div className="flex items-center gap-1 text-orange-500 font-black text-[10px] uppercase italic group-hover:translate-x-1 transition-transform">
                  <span className="hidden md:inline">Terima</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              ) : (
                <div className="p-2 bg-slate-50 text-slate-300 rounded-lg border border-slate-100">
                  <Lock size={12} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedArrival && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md transition-all">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !isSubmitting && setSelectedArrival(null)} />
          
          <div className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            
            <div className="p-6 md:p-8 pb-4 shrink-0">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Confirm Receipt</h3>
                  <div className="flex items-center gap-1.5 mt-2 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                    <AlertCircle size={12} className="text-blue-600" />
                    <p className="text-[8px] md:text-[9px] text-blue-600 font-black uppercase tracking-widest">Blind Verification Active</p>
                  </div>
                </div>
                <button onClick={() => setSelectedArrival(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar flex-1 pb-10 md:pb-8">
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming Goods:</p>
                 <p className="text-sm font-black text-slate-700 uppercase leading-tight">
                    {selectedArrival.item}
                 </p>
                 <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase italic tracking-tighter">
                    Qty: {(parseFloat(selectedArrival.qty) || 0).toLocaleString('id-ID')} {selectedArrival.unit}
                 </p>
              </div>

              <form id="receive-form" onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-red-600 tracking-widest flex justify-between ml-1">
                    Verify No. PO <span>*Strict Security</span>
                  </label>
                  <div className="relative">
                    <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                    <input 
                      required
                      type="text"
                      placeholder="Input Manual PO Number..."
                      className="w-full text-slate-700 bg-red-50/30 border border-red-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-red-200"
                      value={confirmPO}
                      onChange={(e) => setConfirmPO(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Surat Jalan</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text"
                        placeholder="SJ Number"
                        className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:bg-white transition-all outline-none"
                        value={formData.suratJalan}
                        onChange={(e) => setFormData({...formData, suratJalan: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vehicle No.</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text"
                        placeholder="B 1234 XXX"
                        className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:bg-white transition-all outline-none"
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Physical Condition</label>
                  <div className="relative">
                    <select 
                      className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[11px] font-black uppercase cursor-pointer appearance-none focus:bg-white transition-all outline-none"
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    >
                      <option value="GOOD">✅ GOOD (NORMAL)</option>
                      <option value="DAMAGED">❌ DAMAGED (RUSAK)</option>
                      <option value="PARTIAL">⚠️ PARTIAL (TIDAK LENGKAP)</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting || !confirmPO || !formData.suratJalan || !formData.vehicleNo}
                  type="submit" 
                  className="w-full bg-gray-900 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 mt-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-gray-200"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Finalize Receipt"}
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