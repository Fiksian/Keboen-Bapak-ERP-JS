'use client';

import React from 'react';
import { 
  X, AlertCircle, ClipboardCheck, FileText, 
  Truck, ChevronRight, Loader2 
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
  if (!arrival) return null;

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    const newWeightData = { ...formData, [name]: value };
    
    const gross = parseFloat(newWeightData.beratIsi) || 0;
    const tare = parseFloat(newWeightData.beratKosong) || 0;
    const netto = Math.max(0, gross - tare);

    setFormData({
      ...newWeightData,
      netto: netto.toFixed(2)
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md transition-all">
      <div className="absolute inset-0 bg-slate-900/60" onClick={() => !isSubmitting && onClose()} />
      
      <div className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[95vh] flex flex-col">
        
        <div className="p-6 md:p-8 pb-4 shrink-0">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Confirm Receipt</h3>
              <div className="flex items-center gap-1.5 mt-2 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                <AlertCircle size={12} className="text-blue-600" />
                <p className="text-[8px] md:text-[9px] text-blue-600 font-black uppercase tracking-widest">Blind Verification Active</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={isSubmitting} 
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar flex-1 pb-10 md:pb-8">
          
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Incoming Goods:</p>
             <p className="text-sm font-black text-slate-700 uppercase leading-tight text-left">
                {arrival.item}
             </p>
             <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase italic tracking-tighter text-left">
                Qty PO: {(parseFloat(arrival.qty) || 0).toLocaleString('id-ID')} {arrival.unit}
             </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-left">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-red-600 tracking-widest flex justify-between ml-1">
                Verify No. PO <span>*Strict Security</span>
              </label>
              <div className="relative">
                <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                <input 
                  required
                  disabled={isSubmitting}
                  type="text"
                  placeholder="Input Manual PO Number..."
                  className="w-full text-slate-700 bg-red-50/30 border border-red-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-red-200"
                  value={confirmPO}
                  onChange={(e) => setConfirmPO(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-3">
              <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest ml-1">Weight Verification (KG)</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Berat Isi</label>
                  <input 
                    required
                    name="beratIsi"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-black outline-none focus:border-orange-500 transition-all appearance-none"
                    value={formData.beratIsi}
                    onChange={handleWeightChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Berat Kosong</label>
                  <input 
                    required
                    name="beratKosong"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-black outline-none focus:border-orange-500 transition-all appearance-none"
                    value={formData.beratKosong}
                    onChange={handleWeightChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Netto</label>
                  <div className="w-full bg-orange-100 border border-orange-200 rounded-xl py-2 px-3 text-xs font-black text-orange-700 h-[34px] flex items-center">
                    {formData.netto || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Surat Jalan</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text"
                    placeholder="SJ Number"
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white transition-all"
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
                    disabled={isSubmitting}
                    type="text"
                    placeholder="B 1234 XXX"
                    className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none focus:bg-white transition-all"
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
                  disabled={isSubmitting}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[11px] font-black uppercase cursor-pointer appearance-none outline-none focus:bg-white transition-all"
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
              disabled={isSubmitting || !confirmPO || !formData.suratJalan || !formData.vehicleNo || !formData.beratIsi}
              type="submit" 
              className="w-full bg-gray-900 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 mt-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                "Finalize Receipt"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArrivalModal;