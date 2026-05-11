'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X, Truck, Loader2, Scale, UploadCloud, Info,
  CheckCircle2, Plus, Trash2, AlertTriangle,
  FileSpreadsheet, Wifi
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtKg  = (v) => `${(parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
const SUSUT_WARN     = 8.0;
const SUSUT_CRITICAL = 8.5;

// ─── Satu baris truk ──────────────────────────────────────────────────────────
const TrukRow = ({ truk, index, onChange, onRemove, canRemove }) => {
  const net = Math.max(0, (parseFloat(truk.grossWeight) || 0) - (parseFloat(truk.tareWeight) || 0));
  const avg = truk.headCount > 0 ? net / parseFloat(truk.headCount) : 0;

  return (
    <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Truk #{index + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)}
            className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-100 transition-all active:scale-90">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">No. Truk *</label>
          <input type="text" placeholder="B 1234 ABC" required
            value={truk.noTruk} onChange={e => onChange(index, 'noTruk', e.target.value.toUpperCase())}
            className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-gray-700 uppercase outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Jml Ekor *</label>
          <input type="number" min="1" placeholder="0"
            value={truk.headCount} onChange={e => onChange(index, 'headCount', e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2.5 text-[11px] font-black text-center text-gray-700 outline-none focus:border-orange-400"
          />
        </div>
      </div>

      {/* Timbangan */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Gross (kg)</label>
          <input type="number" step="0.01" placeholder="0"
            value={truk.grossWeight} onChange={e => onChange(index, 'grossWeight', e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-xl px-2 py-2.5 text-[11px] font-black text-center text-gray-700 outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Tare (kg)</label>
          <input type="number" step="0.01" placeholder="0"
            value={truk.tareWeight} onChange={e => onChange(index, 'tareWeight', e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-xl px-2 py-2.5 text-[11px] font-black text-center text-gray-700 outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-orange-600 uppercase block mb-1 italic">Net (kg)</label>
          <div className="w-full bg-orange-500 text-white rounded-xl px-2 py-2.5 text-[11px] font-black text-center">
            {net.toFixed(1)}
          </div>
        </div>
      </div>

      {net > 0 && truk.headCount > 0 && (
        <p className="text-[9px] font-bold text-orange-600 text-right">
          Avg: {avg.toFixed(1)} kg/ekor
        </p>
      )}
    </div>
  );
};

// ─── Susut Indicator ──────────────────────────────────────────────────────────
const SusutIndicator = ({ avgPurchase, avgReceived }) => {
  if (!avgPurchase || !avgReceived) return null;
  const susutKg  = Math.max(0, avgPurchase - avgReceived);
  const susutPct = avgPurchase > 0 ? (susutKg / avgPurchase) * 100 : 0;
  const isWarn   = susutPct > SUSUT_WARN;
  const isCrit   = susutPct > SUSUT_CRITICAL;

  return (
    <div className={`p-3 rounded-2xl border flex items-start gap-2 ${isCrit ? 'bg-red-50 border-red-200' : isWarn ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
      {isCrit ? <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" /> :
       isWarn  ? <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /> :
                 <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />}
      <div>
        <p className={`text-[10px] font-black uppercase ${isCrit ? 'text-red-700' : isWarn ? 'text-amber-700' : 'text-green-700'}`}>
          Susut Transit: {susutKg.toFixed(1)} kg ({susutPct.toFixed(1)}%)
          {isCrit && ' ⚠ MELEBIHI TOLERANSI 8.5%!'}
          {isWarn && !isCrit && ' — Mendekati batas toleransi'}
        </p>
        <p className="text-[9px] text-gray-500 mt-0.5">
          Beli: {avgPurchase.toFixed(1)} kg → Terima: {avgReceived.toFixed(1)} kg/ekor
        </p>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const CattleArrivalModal = ({
  arrival,           // CattlePurchasing record
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const EMPTY_TRUK = { noTruk: '', headCount: '', grossWeight: '', tareWeight: '', notes: '' };

  const [trucks,       setTrucks]       = useState([{ ...EMPTY_TRUK }]);
  const [rfidFile,     setRfidFile]     = useState(null);
  const [rfidPreview,  setRfidPreview]  = useState(null);  // { count, rows[] }
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    namaKapal: '', noBl: '', namaPBM: '', namaMKL: '',
    noSuratJalan: '', warehouseId: '', notes: '',
  });
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    if (arrival) {
      setTrucks([{ ...EMPTY_TRUK }]);
      setRfidFile(null); setRfidPreview(null);
      setPhotoFile(null); setPhotoPreview(null);
      fetch('/api/warehouse').then(r => r.ok ? r.json() : []).then(setWarehouses).catch(console.error);
    }
  }, [arrival]);

  if (!arrival) return null;

  // ── Agregat dari semua truk ────────────────────────────────────────────────
  const aggr = trucks.reduce((a, t) => {
    const net = Math.max(0, (parseFloat(t.grossWeight) || 0) - (parseFloat(t.tareWeight) || 0));
    a.grossTotal += parseFloat(t.grossWeight) || 0;
    a.tareTotal  += parseFloat(t.tareWeight)  || 0;
    a.netTotal   += net;
    a.headTotal  += parseInt(t.headCount)     || 0;
    return a;
  }, { grossTotal: 0, tareTotal: 0, netTotal: 0, headTotal: 0 });
  const avgReceived = aggr.headTotal > 0 ? aggr.netTotal / aggr.headTotal : 0;

  // ── Truk CRUD ──────────────────────────────────────────────────────────────
  const addTruk    = () => setTrucks(p => [...p, { ...EMPTY_TRUK }]);
  const removeTruk = (i) => setTrucks(p => p.filter((_, idx) => idx !== i));
  const changeTruk = (i, k, v) => setTrucks(p => {
    const n = [...p]; n[i] = { ...n[i], [k]: v }; return n;
  });

  // ── Upload foto SJ ─────────────────────────────────────────────────────────
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Maks 2MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Upload RFID XLS ────────────────────────────────────────────────────────
  const handleRfid = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRfidFile(file);
    // Preview jumlah baris di client (opsional — pakai SheetJS jika tersedia)
    setRfidPreview({ name: file.name, size: (file.size / 1024).toFixed(1) });
  };

  // ── Validasi ───────────────────────────────────────────────────────────────
  const isFormValid =
    photoFile &&
    trucks.every(t => t.noTruk && parseFloat(t.headCount) > 0) &&
    aggr.headTotal > 0;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const payload = new FormData();
    payload.append('purchasingId', arrival.id);
    payload.append('trucks',       JSON.stringify(trucks.map(t => ({
      noTruk:      t.noTruk,
      headCount:   parseInt(t.headCount) || 0,
      grossWeight: parseFloat(t.grossWeight) || 0,
      tareWeight:  parseFloat(t.tareWeight)  || 0,
      notes:       t.notes || '',
    }))));
    Object.entries(form).forEach(([k, v]) => payload.append(k, v));
    payload.append('file', photoFile);
    if (rfidFile) payload.append('rfidFile', rfidFile);
    onSubmit(e, payload);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-slate-900/60" onClick={() => !isSubmitting && onClose()} />

      <div className="relative bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[97vh] flex flex-col">

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-50 shrink-0 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Kedatangan Sapi</h3>
            <div className="flex items-center gap-1.5 mt-1 bg-orange-50 w-fit px-2 py-1 rounded-lg">
              <Truck size={11} className="text-orange-500" />
              <p className="text-[8px] text-orange-600 font-black uppercase tracking-widest">Penerimaan Fisik · Timbang Truk</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 custom-scrollbar">

          {/* PO Info */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">PO: {arrival.noPO}</p>
            <p className="text-lg font-bold text-blue-600">{arrival.vendorName}</p>
            <p className="text-[10px] text-blue-500 mt-1">
              Beli avg: {arrival.avgWeightKg} kg/ekor · HPP: Rp {(arrival.hppAwalPerEkor || 0).toLocaleString('id-ID')}/ekor
            </p>
          </div>

          {/* ── Upload RFID XLS ───────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex justify-between ml-1 italic">
              <span className="flex items-center gap-1"><Wifi size={10} /> Upload File RFID / Eartag (XLS)</span>
              {rfidPreview && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={11} /> READY</span>}
            </label>
            <input type="file" accept=".xls,.xlsx,.csv" onChange={handleRfid}
              className="hidden" id="rfid-upload" disabled={isSubmitting} />
            <label htmlFor="rfid-upload"
              className={`flex flex-col items-center justify-center w-full min-h-[80px] rounded-[20px] border-2 border-dashed transition-all cursor-pointer ${rfidPreview ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              {rfidPreview ? (
                <div className="text-center py-3">
                  <FileSpreadsheet size={20} className="text-indigo-500 mx-auto mb-1" />
                  <p className="text-[10px] font-black text-indigo-700">{rfidPreview.name}</p>
                  <p className="text-[9px] text-indigo-400">{rfidPreview.size} KB · Akan diproses server</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileSpreadsheet size={22} className="text-indigo-400 mx-auto mb-1" />
                  <p className="text-[10px] font-black text-slate-600 uppercase">Pilih file XLS dari Scanner</p>
                  <p className="text-[9px] text-slate-400">Kolom: Waktu Scan · No. RFID · Jenis Data</p>
                </div>
              )}
            </label>
          </div>

          {/* ── Foto Surat Jalan ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex justify-between ml-1 italic">
              <span>Foto Surat Jalan / Dokumen *</span>
              {photoPreview && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={11} /> READY</span>}
            </label>
            <input type="file" accept="image/*" capture="environment"
              onChange={handlePhoto} className="hidden" id="sj-cattle-upload" disabled={isSubmitting} />
            <label htmlFor="sj-cattle-upload"
              className={`relative flex flex-col items-center justify-center w-full min-h-[100px] rounded-[20px] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${photoPreview ? 'border-green-500 bg-green-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="w-full h-[120px] object-cover animate-in fade-in" />
                : <div className="text-center py-4"><UploadCloud size={24} className="text-blue-400 mx-auto mb-1" /><p className="text-[10px] font-black text-slate-600 uppercase">Ambil Foto Dokumen</p></div>}
            </label>
          </div>

          {/* ── Info logistik ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'namaKapal',    l: 'Nama Kapal',    p: 'MV ...' },
              { k: 'noBl',         l: 'No. B/L',       p: 'BL-XXXX' },
              { k: 'namaPBM',      l: 'Nama PBM',      p: 'Perusahaan Bongkar Muat' },
              { k: 'namaMKL',      l: 'MKL / Ekspedisi', p: 'PT ...' },
              { k: 'noSuratJalan', l: 'No. Surat Jalan', p: 'SJ-XXXX' },
            ].map(({ k, l, p }) => (
              <div key={k} className={k === 'namaPBM' || k === 'namaMKL' ? 'col-span-2' : ''}>
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1 ml-1">{l}</label>
                <input type="text" placeholder={p}
                  value={form[k]} onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-[11px] font-bold text-gray-700 outline-none focus:border-blue-300"
                />
              </div>
            ))}

            {/* Gudang */}
            <div className="col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1 ml-1">Gudang / Kandang *</label>
              <select value={form.warehouseId} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-[11px] font-black text-gray-700 outline-none appearance-none">
                <option value="">-- Pilih Kandang --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          {/* ── Data Truk ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5 italic">
                <Scale size={12} /> Timbang Per Truk *
              </label>
              <button type="button" onClick={addTruk}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-orange-600 active:scale-90">
                <Plus size={11} strokeWidth={3} /> Truk
              </button>
            </div>
            <div className="space-y-3">
              {trucks.map((t, i) => (
                <TrukRow key={i} truk={t} index={i}
                  onChange={changeTruk} onRemove={removeTruk}
                  canRemove={trucks.length > 1}
                />
              ))}
            </div>
          </div>

          {/* ── Ringkasan timbang ─────────────────────────────────────────── */}
          {aggr.headTotal > 0 && (
            <div className="p-4 bg-slate-900 rounded-2xl space-y-1.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ringkasan Timbang</p>
              {[
                { l: 'Total Ekor',     v: `${aggr.headTotal} ekor`        },
                { l: 'Gross Total',    v: fmtKg(aggr.grossTotal)           },
                { l: 'Tare Total',     v: fmtKg(aggr.tareTotal)            },
                { l: 'Net Total',      v: fmtKg(aggr.netTotal),  bold: true },
                { l: 'Avg /Ekor',      v: fmtKg(avgReceived)     },
              ].map((r, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="text-slate-500 font-bold uppercase">{r.l}</span>
                  <span className={`font-black italic ${r.bold ? 'text-orange-400' : 'text-white'}`}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Susut indicator */}
          <SusutIndicator avgPurchase={arrival.avgWeightKg} avgReceived={avgReceived} />

          {/* Catatan */}
          <div>
            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1 ml-1">Catatan (Opsional)</label>
            <textarea rows={2} placeholder="Catatan kondisi sapi, masalah selama pengiriman..."
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-[11px] font-medium text-gray-700 outline-none resize-none focus:border-blue-300"
            />
          </div>

          {/* Submit */}
          <button disabled={isSubmitting || !isFormValid} onClick={handleSubmit} type="button"
            className="w-full bg-slate-900 hover:bg-orange-600 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:active:scale-100">
            {isSubmitting
              ? <><Loader2 className="animate-spin" size={18} /> Memproses...</>
              : `Konfirmasi Kedatangan · ${aggr.headTotal} Ekor`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CattleArrivalModal;
