'use client';

import React, { useEffect } from 'react';
import { 
  X, AlertCircle, ClipboardCheck, FileText, 
  Truck, ChevronRight, Loader2, Scale 
} from 'lucide-react';

const ArrivalModal = ({ 
  arrival, 
  confirmPO, 
  setConfirmPO, 
  formData, 
  setFormData, 
  isSubmitting, 
  onClose, 
  onSubmit 
}) => {
  
  useEffect(() => {
    if (arrival) {
      setFormData(prev => ({
        ...prev,
        receivedQty: arrival.qty
      }));
    }
  }, [arrival, setFormData]);

  if (!arrival) return null;

  const isWeightBased = ['KG', 'TON', 'GRAM'].includes(arrival.unit?.toUpperCase());

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    const newWeightData = { ...formData, [name]: value };
    
    const gross = parseFloat(newWeightData.beratIsi) || 0;
    const tare = parseFloat(newWeightData.beratKosong) || 0;
    const netto = Math.max(0, gross - tare);

    setFormData({
      ...newWeightData,
      netto: netto.toFixed(2),
      receivedQty: netto
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md transition-all">
      <div className="absolute inset-0 bg-slate-900/60" onClick={() => !isSubmitting && onClose()} />
      
      <div className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[95vh] flex flex-col">
        
        <div className="p-6 md:p-8 pb-4 shrink-0 bg-white z-10">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Confirm Receipt</h3>
              <div className="flex items-center gap-1.5 mt-2 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                <AlertCircle size={12} className="text-blue-600" />
                <p className="text-[8px] md:text-[9px] text-blue-600 font-black uppercase tracking-widest">Verification Mode: {arrival.noPO ? 'Strict PO Match' : 'Manual'}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar flex-1 pb-10 md:pb-8">
          
          <div className="mb-6 p-5 bg-slate-900 rounded-[24px] border border-slate-800 shadow-inner relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck size={60} className="text-white -rotate-12" />
             </div>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-left">Target Procurement:</p>
             <p className="text-sm font-black text-white uppercase leading-tight text-left pr-10">
                {arrival.item}
             </p>
             <div className="flex items-center gap-3 mt-3">
                <div className="bg-orange-500 px-3 py-1 rounded-lg">
                    <p className="text-[10px] font-black text-white uppercase italic">
                        Qty: {arrival.qty.toLocaleString('id-ID')} {arrival.unit}
                    </p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Vendor: {arrival.supplier}
                </p>
             </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-left">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-red-600 tracking-widest flex justify-between ml-1">
                Input No. PO Untuk Verifikasi <span>*Wajib Sesuai</span>
              </label>
              <div className="relative">
                <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                <input 
                  required
                  disabled={isSubmitting}
                  type="text"
                  placeholder="Ketik Nomor PO (Contoh: PO/2026/01/001)"
                  className="w-full text-slate-700 bg-red-50/20 border border-red-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-red-200 uppercase"
                  value={confirmPO}
                  onChange={(e) => setConfirmPO(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {isWeightBased ? (
              <div className="p-5 bg-orange-50/50 rounded-[24px] border border-orange-100 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <Scale size={14} className="text-orange-600" />
                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Jembatan Timbang (KG)</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Gross (Isi)</label>
                    <input 
                      required
                      name="beratIsi"
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      value={formData.beratIsi}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Tare (Ksg)</label>
                    <input 
                      required
                      name="beratKosong"
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      value={formData.beratKosong}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-orange-600 uppercase">Netto</label>
                    <div className="w-full bg-orange-500 rounded-xl py-3 px-3 text-xs font-black text-white h-[42px] flex items-center justify-center shadow-md">
                      {formData.netto || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kuantitas Diterima ({arrival.unit})</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Scale size={16} />
                  </div>
                  <input 
                    required
                    disabled={isSubmitting}
                    type="number"
                    step="0.01"
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:bg-white focus:border-blue-500 transition-all"
                    value={formData.receivedQty}
                    onChange={(e) => setFormData({...formData, receivedQty: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Surat Jalan</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text"
                    placeholder="No. SJ Supplier"
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold outline-none focus:bg-white transition-all uppercase"
                    value={formData.suratJalan}
                    onChange={(e) => setFormData({...formData, suratJalan: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No. Kendaraan</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text"
                    placeholder="B 1234 ABC"
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-bold outline-none focus:bg-white transition-all uppercase"
                    value={formData.vehicleNo}
                    onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kondisi Fisik Barang</label>
              <div className="relative">
                <select 
                  disabled={isSubmitting}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-[11px] font-black uppercase cursor-pointer appearance-none outline-none focus:bg-white transition-all"
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                >
                  <option value="GOOD">✅ KONDISI BAIK (NORMAL)</option>
                  <option value="DAMAGED">❌ RUSAK / CACAT</option>
                  <option value="PARTIAL">⚠️ TIDAK SESUAI SPEK</option>
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <button 
              disabled={isSubmitting || !confirmPO || !formData.suratJalan || !formData.vehicleNo || (isWeightBased && !formData.beratIsi)}
              type="submit" 
              className="w-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 mt-6 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Mencatat Gudang...
                </>
              ) : (
                "Selesaikan Penerimaan"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArrivalModal;