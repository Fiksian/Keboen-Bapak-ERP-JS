'use client';

import React, { useEffect, useState } from 'react';
import {
  X, Truck, Loader2, Scale,
  UploadCloud, Warehouse,
  MapPin, CheckCircle2
} from 'lucide-react';
import { convertQty, cleanNumber } from "@/lib/unitConverter";

const ArrivalModal = ({
  arrival,
  warehouses = [],
  formData,
  setFormData,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [displayNetto, setDisplayNetto] = useState('0.00');

  useEffect(() => {
    if (arrival) {
      setFormData((prev) => ({
        ...prev,
        suratJalan:   '',
        vehicleNo:    '',
        condition:    'GOOD',
        notes:        '',
        beratIsi:     '',
        beratKosong:  '',
        netto:        '0.00',
        receivedQty:  arrival.qty,
        sourceUnit:   arrival.unit || 'KG',
        warehouseId:  '',
        image:        null,
      }));
      setDisplayNetto('0.00');
      setImagePreview(null);
    }
  }, [arrival, setFormData]);

  if (!arrival) return null;

  const isWeightBased = ['KG', 'TON', 'GRAM', 'GR'].includes(
    formData.sourceUnit?.toUpperCase()
  );

  const isFormValid =
    formData.image &&
    formData.suratJalan &&
    formData.vehicleNo &&
    formData.warehouseId &&
    (!isWeightBased || (formData.beratIsi && formData.beratKosong));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 2MB.");
      return;
    }
    setFormData({ ...formData, image: file });
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };

    const gross = parseFloat(updated.beratIsi) || 0;
    const tare  = parseFloat(updated.beratKosong) || 0;
    const nettoLocal = Math.max(0, gross - tare);

    const convertedQty = convertQty(
      nettoLocal,
      formData.sourceUnit,
      formData.warehouseUnit
    );

    setDisplayNetto(nettoLocal.toFixed(2));
    setFormData({
      ...updated,
      netto: nettoLocal.toFixed(2),
      receivedQty: cleanNumber(convertedQty),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md transition-all text-left">
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[95vh] flex flex-col">

        <div className="p-6 md:p-8 pb-4 shrink-0 bg-white z-10 border-b border-slate-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">
                Konfirmasi Penerimaan
              </h3>
              <div className="flex items-center gap-1.5 mt-2 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                <Warehouse size={12} className="text-blue-600" />
                <p className="text-[8px] md:text-[9px] text-blue-600 font-black uppercase tracking-widest leading-none">
                  Inbound Logistics System
                </p>
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

        <div className="px-6 md:p-8 pt-6 overflow-y-auto flex-1 pb-10 md:pb-8 space-y-6">

          <div className="p-5 bg-slate-900 rounded-[24px] border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Truck size={60} className="text-white -rotate-12" />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
              Item Kedatangan:
            </p>
            <p className="text-sm font-black text-white uppercase pr-10 leading-tight">
              {arrival.item}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="bg-[#8da070] px-3 py-1 rounded-lg">
                <p className="text-[10px] font-black text-white uppercase italic">
                  {arrival.noPO || "NO PO"}
                </p>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                Est: {arrival.qty.toLocaleString('id-ID')} {arrival.unit}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-rose-500" />
                Lokasi Gudang Tujuan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  disabled={isSubmitting}
                  className={`w-full text-slate-700 bg-slate-50 border rounded-2xl py-4 px-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer ${
                    formData.warehouseId ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100'
                  }`}
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                >
                  <option value="" disabled>-- PILIH GUDANG PENYIMPANAN --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name.toUpperCase()} {wh.code ? `[${wh.code}]` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  {formData.warehouseId
                    ? <CheckCircle2 size={18} className="text-blue-500" />
                    : <Warehouse size={18} />
                  }
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex justify-between ml-1 italic">
                <span>Foto Surat Jalan / Bukti</span>
                {imagePreview && <span className="text-green-500">READY</span>}
              </label>
              <div className="relative">
                <input
                  type="file" accept="image/*" capture="environment"
                  onChange={handleImageChange}
                  className="hidden" id="sj-upload"
                  disabled={isSubmitting} required
                />
                <label
                  htmlFor="sj-upload"
                  className={`relative flex flex-col items-center justify-center w-full min-h-[140px] rounded-[24px] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                    imagePreview
                      ? 'border-green-500 bg-green-50/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" className="w-full h-[180px] object-cover animate-in fade-in" />
                    : (
                      <div className="p-6 text-center">
                        <UploadCloud className="text-blue-500 mx-auto mb-2" size={32} />
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">
                          Ambil Foto Dokumen
                        </p>
                      </div>
                    )
                  }
                </label>
              </div>
            </div>

            {isWeightBased ? (
              <div className="p-5 bg-orange-50/50 rounded-[24px] border border-orange-100 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Scale size={14} className="text-orange-600" />
                  <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest italic">
                    Kalkulator Timbangan ({formData.sourceUnit})
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Gross</label>
                    <input
                      required name="beratIsi" type="number" step="0.01"
                      disabled={isSubmitting} placeholder="0.00"
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:border-orange-500 transition-all"
                      value={formData.beratIsi || ''}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Tare</label>
                    <input
                      required name="beratKosong" type="number" step="0.01"
                      disabled={isSubmitting} placeholder="0.00"
                      className="w-full text-slate-800 bg-white border border-orange-200 rounded-xl py-3 px-3 text-xs font-black outline-none focus:border-orange-500 transition-all"
                      value={formData.beratKosong || ''}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-orange-600 uppercase">Netto</label>
                    <div className="w-full bg-orange-500 rounded-xl py-3 px-3 text-xs font-black text-white h-[42px] flex items-center justify-center shadow-inner">
                      {displayNetto}
                    </div>
                  </div>
                </div>

                <div className="mt-1 pt-2 border-t border-orange-200 flex justify-between items-center">
                  <p className="text-[9px] font-bold text-slate-500 italic">
                    Stock Masuk ({formData.warehouseUnit}):
                  </p>
                  <p className="text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded-md border border-orange-100">
                    {formData.receivedQty} {formData.warehouseUnit}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Qty Diterima ({formData.sourceUnit})
                </label>
                <input
                  required disabled={isSubmitting} type="number" step="0.01"
                  className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={formData.receivedQty}
                  onChange={(e) => setFormData({ ...formData, receivedQty: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Surat Jalan
                </label>
                <input
                  required disabled={isSubmitting} type="text" placeholder="SJ-XXXX"
                  className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[11px] font-bold outline-none uppercase focus:border-blue-300 transition-all"
                  value={formData.suratJalan}
                  onChange={(e) => setFormData({ ...formData, suratJalan: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  No. Plat
                </label>
                <input
                  required disabled={isSubmitting} type="text" placeholder="D 1234 ABC"
                  className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[11px] font-bold outline-none uppercase focus:border-blue-300 transition-all"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Inspeksi Fisik
              </label>
              <select
                disabled={isSubmitting}
                className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="GOOD">✅ KONDISI BAIK & SEGEL UTUH</option>
                <option value="DAMAGED">❌ RUSAK / BOCOR / CACAT</option>
                <option value="PARTIAL">⚠️ TIDAK SESUAI SPESIFIKASI</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Catatan (Opsional)
              </label>
              <textarea
                disabled={isSubmitting} rows={2}
                placeholder="Tambahkan catatan jika ada..."
                className="w-full text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-[11px] font-medium outline-none focus:border-blue-300 transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <button
              disabled={isSubmitting || !isFormValid}
              type="submit"
              className="w-full bg-slate-900 hover:bg-blue-600 text-white py-4.5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting
                ? <><Loader2 className="animate-spin" size={18} /> Menyimpan Data...</>
                : "Selesaikan Penerimaan"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArrivalModal;