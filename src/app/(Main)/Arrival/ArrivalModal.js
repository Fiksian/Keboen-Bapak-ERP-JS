'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, FileText, Truck, ChevronRight, Loader2, Scale,
  Camera, UploadCloud, CheckCircle2
} from 'lucide-react';

const ArrivalModal = ({ 
  arrival, 
  formData, 
  setFormData, 
  isSubmitting, 
  onClose, 
  onSubmit 
}) => {
  const [imagePreview, setImagePreview] = useState(null);
  
  useEffect(() => {
    if (arrival) {
      setFormData(prev => ({
        ...prev,
        receivedQty: arrival.qty,
        beratIsi: '',
        beratKosong: '',
        netto: '0.00',
        suratJalan: '',
        vehicleNo: '',
        condition: 'GOOD',
        image: null 
      }));
      setImagePreview(null);
    }
  }, [arrival, setFormData]);

  if (!arrival) return null;

  const isWeightBased = ['KG', 'TON', 'GRAM'].includes(arrival.unit?.toUpperCase());

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File terlalu besar. Maksimal 2MB.");
        return;
      }
      
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    const newWeightData = { ...formData, [name]: value };
    
    const gross = parseFloat(newWeightData.beratIsi) || 0;
    const tare = parseFloat(newWeightData.beratKosong) || 0;
    const netto = Math.max(0, gross - tare);

    setFormData({
      ...newWeightData,
      netto: netto.toFixed(2),
      receivedQty: netto.toFixed(2)
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
              <div className="flex items-center gap-1.5 mt-2 bg-orange-50 w-fit px-2 py-1 rounded-lg">
                <Camera size={12} className="text-orange-600" />
                <p className="text-[8px] md:text-[9px] text-orange-600 font-black uppercase tracking-widest">Verification: Photo Attachment Required</p>
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
          
          <div className="mb-6 p-5 bg-slate-900 rounded-[24px] border border-slate-800 shadow-inner relative overflow-hidden group text-left">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck size={60} className="text-white -rotate-12" />
             </div>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Target Procurement:</p>
             <p className="text-sm font-black text-white uppercase leading-tight pr-10">
                {arrival.item}
             </p>
             <div className="flex items-center gap-3 mt-3">
                <div className="bg-blue-600 px-3 py-1 rounded-lg">
                    <p className="text-[10px] font-black text-white uppercase italic">
                        {arrival.noPO || "NO PO"}
                    </p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {arrival.qty.toLocaleString('id-ID')} {arrival.unit}
                </p>
             </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-left">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex justify-between ml-1">
                Upload Foto Surat Jalan 
              </label>
              
              <div className="relative group">
                <input 
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  id="sj-upload"
                  disabled={isSubmitting}
                  required
                />
                
                <label 
                  htmlFor="sj-upload"
                  className={`relative flex flex-col items-center justify-center w-full min-h-[140px] rounded-[24px] border-2 border-dashed transition-all cursor-pointer overflow-hidden
                    ${imagePreview ? 'border-green-500 bg-green-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'}
                  `}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-[180px] group">
                      <img src={imagePreview} alt="Preview SJ" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg">
                          <Camera size={14} className="text-slate-900" />
                          <span className="text-[10px] font-black text-slate-900 uppercase">Ganti Foto</span>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 inline-block">
                        <UploadCloud className="text-blue-500" size={32} />
                      </div>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Klik untuk Ambil Foto</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Gunakan Kamera HP Untuk Hasil Terbaik Max 2MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {isWeightBased ? (
              <div className="p-5 bg-orange-50/50 rounded-[24px] border border-orange-100 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <Scale size={14} className="text-orange-600" />
                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Jembatan Timbang ({arrival.unit})</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Gross</label>
                    <input 
                      required
                      name="beratIsi"
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      value={formData.beratIsi || ''}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Tare</label>
                    <input 
                      required
                      name="beratKosong"
                      type="number"
                      step="0.01"
                      disabled={isSubmitting}
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      value={formData.beratKosong || ''}
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
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No. Surat Jalan</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    disabled={isSubmitting}
                    type="text"
                    placeholder="No. Surat"
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
                  <option value="GOOD">✅ KONDISI BAIK</option>
                  <option value="DAMAGED">❌ RUSAK</option>
                  <option value="PARTIAL">⚠️ TIDAK SESUAI SPEK</option>
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <button 
              disabled={isSubmitting || !formData.image || !formData.suratJalan || !formData.vehicleNo || (isWeightBased && !formData.beratIsi)}
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