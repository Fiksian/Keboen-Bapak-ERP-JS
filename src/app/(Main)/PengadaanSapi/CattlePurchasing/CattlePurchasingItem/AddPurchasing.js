'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, ShoppingBag, CheckCircle2, Users, Loader2, Plus,
  Trash2, Globe, DollarSign, Scale, Hash, ChevronRight,
  AlertCircle, TrendingUp, Shield, Search
} from 'lucide-react';

const fmtRp = (v) => new Intl.NumberFormat('id-ID').format(parseFloat(v)||0);

// ─── Breed Picker (pengganti Item Picker barang) ──────────────────────────────
const BreedPicker = ({ value, onChange, breeds, disabled }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');
  const ref             = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() =>
    !q ? breeds.slice(0, 10) : breeds.filter(b => b.name.toLowerCase().includes(q.toLowerCase())),
    [q, breeds]
  );

  const isValid = breeds.some(b => b.name.toUpperCase() === (value||'').toUpperCase());

  return (
    <div ref={ref} className="relative">
      <div onClick={() => !disabled && setOpen(o => !o)}
        className={`flex items-center gap-2 w-full bg-white border rounded-xl px-3 py-3 cursor-pointer transition-all ${isValid ? 'border-[#8da070] bg-[#8da070]/5' : value ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200 hover:border-[#8da070]/50'}`}>
        <span className="text-base">🐄</span>
        <span className={`flex-1 text-xs font-bold uppercase truncate ${isValid ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || 'Pilih Jenis Sapi...'}
        </span>
        {isValid && <CheckCircle2 size={12} className="text-[#8da070] shrink-0" />}
      </div>
      {open && (
        <div className="absolute z-[400] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[220px] flex flex-col">
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none text-gray-600"
                placeholder="Cari jenis sapi..." value={q} onChange={e => setQ(e.target.value)}
                onClick={e => e.stopPropagation()} />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filtered.map(b => (
              <div key={b.id} onClick={() => { onChange(b); setOpen(false); setQ(''); }}
                className="px-4 py-3 border-b border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex items-center gap-3 group transition-colors">
                <span className="text-base shrink-0">🐄</span>
                <div>
                  <p className="text-[10px] font-black uppercase">{b.name}</p>
                  {b.description && <p className="text-[8px] opacity-60 italic">{b.description}</p>}
                </div>
              </div>
            ))}
            {/* Allow custom input */}
            {q && !filtered.find(b => b.name.toUpperCase() === q.toUpperCase()) && (
              <div onClick={() => { onChange({ id: null, name: q.toUpperCase() }); setOpen(false); setQ(''); }}
                className="px-4 py-3 border-b border-gray-50 hover:bg-amber-500 hover:text-white cursor-pointer flex items-center gap-3 group transition-colors">
                <Plus size={12} className="text-amber-500 group-hover:text-white shrink-0" />
                <p className="text-[10px] font-black uppercase">Tambah "{q.toUpperCase()}" (custom)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Kalkulasi HPP live per item ───────────────────────────────────────────────
const calcItemHPP = (item, biayaPerKg = 0) => {
  const wt    = parseFloat(item.weightKg)  || 0;
  const pKg   = parseFloat(item.pricePerKg) || 0;
  const total = wt * pKg;
  const hppPKg  = pKg + parseFloat(biayaPerKg);
  const hppTotal = wt * hppPKg;
  return { total, hppPKg, hppTotal };
};

const EMPTY_ITEM = {
  id: Date.now(), jenisSapi: '', breedId: null,
  gender: 'CAMPUR', headOrdered: '', weightKg: '', avgWeightKg: '',
  pricePerKg: '', doItemId: null, notes: '',
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const AddCattlePurchasing = ({ isOpen, onClose, onAdd, doItemsAvailable = [] }) => {
  const { data: session }   = useSession();
  const [loading, setLoading] = useState(false);
  const [vendors,    setVendors]    = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [breeds,     setBreeds]     = useState([]);
  const [showVendorDrop, setShowVendorDrop] = useState(false);
  const vendorRef = useRef(null);

  const [form, setForm] = useState({
    vendorName: '', vendorCountry: 'Australia', vendorEksportir: '',
    biayaBongkar: '', biayaTracking: '', biayaKarantina: '', biayaLainLain: '',
    warehouseId: '', notes: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM, id: Date.now() }]);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/contacts?type=SUPPLIER').then(r => r.ok ? r.json() : []),
      fetch('/api/warehouse').then(r => r.ok ? r.json() : []),
      fetch('/api/cattle/breeds').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([v, w, b]) => { setVendors(v); setWarehouses(w); setBreeds(b.length ? b : FALLBACK_BREEDS); });
  }, [isOpen]);

  const FALLBACK_BREEDS = [
    { id: 'lim', name: 'LIMOUSIN', description: 'Sapi potong Prancis' },
    { id: 'sim', name: 'SIMENTAL', description: 'Sapi Swiss' },
    { id: 'bx',  name: 'BX', description: 'Brahman Cross Australia' },
    { id: 'bra', name: 'BRAHMAN', description: 'Sapi impor Amerika' },
    { id: 'ang', name: 'ANGUS', description: 'Sapi premium Skotlandia' },
    { id: 'cam', name: 'CAMPURAN', description: 'Campuran' },
  ];

  useEffect(() => {
    const h = (e) => { if (vendorRef.current && !vendorRef.current.contains(e.target)) setShowVendorDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filteredVendors = useMemo(() =>
    !form.vendorName ? [] : vendors.filter(v => v.name.toLowerCase().includes(form.vendorName.toLowerCase())).slice(0, 8),
    [form.vendorName, vendors]
  );

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateItem = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));

  const addItem    = () => setItems(p => [...p, { ...EMPTY_ITEM, id: Date.now() }]);
  const removeItem = (id) => setItems(p => p.filter(i => i.id !== id));

  const isVendorValid = vendors.some(v => v.name.toUpperCase() === form.vendorName.toUpperCase());

  // Biaya overhead total per kg (dibagi total bobot semua item)
  const totalWeightKg = items.reduce((s, i) => s + (parseFloat(i.weightKg)||0), 0);
  const totalBiaya    = (parseFloat(form.biayaBongkar)||0) + (parseFloat(form.biayaTracking)||0) +
                        (parseFloat(form.biayaKarantina)||0) + (parseFloat(form.biayaLainLain)||0);
  const biayaPerKg    = totalWeightKg > 0 ? totalBiaya / totalWeightKg : 0;

  // Grand total
  const grandTotal = items.reduce((s, i) => {
    return s + (parseFloat(i.weightKg)||0) * (parseFloat(i.pricePerKg)||0);
  }, 0);

  const hppGrandTotal = grandTotal + totalBiaya;

  const isValid = form.vendorName && items.every(i => i.jenisSapi && parseFloat(i.weightKg) > 0 && parseFloat(i.pricePerKg) > 0 && parseInt(i.headOrdered) > 0);

  const handleClose = useCallback(() => {
    setForm({ vendorName: '', vendorCountry: 'Australia', vendorEksportir: '', biayaBongkar: '', biayaTracking: '', biayaKarantina: '', biayaLainLain: '', warehouseId: '', notes: '' });
    setItems([{ ...EMPTY_ITEM, id: Date.now() }]);
    setShowVendorDrop(false);
    onClose();
  }, [onClose]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map(i => ({
          jenisSapi:   i.jenisSapi,
          breedId:     i.breedId || null,
          gender:      i.gender,
          headOrdered: parseInt(i.headOrdered),
          weightKg:    parseFloat(i.weightKg),
          avgWeightKg: parseInt(i.headOrdered) > 0 ? parseFloat(i.weightKg) / parseInt(i.headOrdered) : 0,
          pricePerKg:  parseFloat(i.pricePerKg),
          doItemId:    i.doItemId || null,
          notes:       i.notes || null,
        })),
      };
      const res  = await fetch('/api/cattle/purchasing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onAdd?.();
      handleClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const COUNTRIES = ['Australia', 'New Zealand', 'Brazil', 'India', 'USA', 'Lainnya'];
  const GENDERS   = ['JANTAN', 'BETINA', 'CAMPUR'];

  return (
    <div className="fixed inset-0 z-[150] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FDFDFD] w-full max-w-4xl rounded-t-[32px] lg:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] lg:max-h-[94vh]">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#8da070] rounded-2xl text-white shadow-lg shadow-[#8da070]/20">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic text-gray-900">Create PO Sapi</h2>
              <p className="text-[10px] text-[#8da070] font-bold uppercase tracking-widest mt-0.5 italic">
                Bobot × Harga/Kg · HPP Otomatis
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 custom-scrollbar">

          {/* ── Vendor ─────────────────────────────────────────────────────── */}
          <div className={`p-5 rounded-[20px] border transition-all ${!isVendorValid && form.vendorName ? 'bg-red-50 border-red-200' : 'bg-blue-50/30 border-blue-100'}`} ref={vendorRef}>
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 ${!isVendorValid && form.vendorName ? 'text-red-600' : 'text-blue-600'}`}>
              <Users size={11} /> Vendor Eksportir *{!isVendorValid && form.vendorName && ' — Tidak Terdaftar'}
            </label>
            <div className="relative mt-3">
              <input required autoComplete="off"
                className={`w-full bg-white border rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all uppercase ${!isVendorValid && form.vendorName ? 'border-red-300 focus:ring-4 focus:ring-red-100' : 'border-blue-200 focus:ring-4 focus:ring-blue-100'}`}
                placeholder="Cari & Pilih Vendor Eksportir..."
                value={form.vendorName}
                onChange={e => { setF('vendorName', e.target.value); setShowVendorDrop(true); }}
              />
              {showVendorDrop && filteredVendors.length > 0 && (
                <div className="absolute z-[200] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {filteredVendors.map(v => (
                    <div key={v.id} onClick={() => { setF('vendorName', v.name); setShowVendorDrop(false); }}
                      className="px-5 py-4 border-b border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex justify-between items-center group transition-colors">
                      <div>
                        <p className="text-xs font-black uppercase italic">{v.name}</p>
                        <p className="text-[9px] font-bold opacity-70 uppercase">{v.companyName || 'Verified Eksportir'}</p>
                      </div>
                      <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <select value={form.vendorCountry} onChange={e => setF('vendorCountry', e.target.value)}
                className="w-full text-gray-600 bg-white border border-blue-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none appearance-none">
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="Nama perusahaan eksportir (opsional)"
                value={form.vendorEksportir} onChange={e => setF('vendorEksportir', e.target.value)}
                className="w-full text-gray-600 bg-white border border-blue-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
            </div>
          </div>

          {/* ── Item sapi ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                Daftar Sapi ({items.length} jenis)
              </label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-[#8da070] text-white rounded-xl text-[10px] font-black uppercase italic shadow-md hover:bg-[#7a8c61] transition-all active:scale-95">
                <Plus size={13} strokeWidth={3} /> Tambah Jenis
              </button>
            </div>

            <div className="space-y-4">
              {items.map((row, idx) => {
                const { total, hppPKg, hppTotal } = calcItemHPP(row, biayaPerKg);
                const avgWt = parseInt(row.headOrdered) > 0 ? (parseFloat(row.weightKg)||0) / parseInt(row.headOrdered) : 0;

                return (
                  <div key={row.id} className="group relative p-5 rounded-[24px] border border-gray-100 bg-white shadow-sm hover:border-[#8da070]/40 transition-all">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(row.id)}
                        className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10">
                        <Trash2 size={13} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                      {/* Jenis Sapi */}
                      <div className="md:col-span-3 space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">
                          Jenis Sapi *
                        </p>
                        <BreedPicker
                          value={row.jenisSapi}
                          breeds={breeds}
                          onChange={b => {
                            updateItem(row.id, 'jenisSapi', b.name);
                            updateItem(row.id, 'breedId', b.id);
                          }}
                        />
                      </div>

                      {/* Gender */}
                      <div className="md:col-span-2 space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Gender</p>
                        <div className="flex gap-1">
                          {GENDERS.map(g => (
                            <button type="button" key={g}
                              onClick={() => updateItem(row.id, 'gender', g)}
                              className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase border transition-all ${
                                row.gender === g ? 'bg-[#8da070] text-white border-[#8da070] shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-[#8da070]/40'}`}>
                              {g === 'JANTAN' ? '♂' : g === 'BETINA' ? '♀' : '±'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ekor */}
                      <div className="md:col-span-2 space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1 flex items-center gap-1">
                          <Hash size={9} /> Ekor *
                        </p>
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2">
                          <input type="number" step="1" min="1" required
                            className="w-full py-3 bg-transparent text-xs font-black text-center text-gray-700 outline-none"
                            value={row.headOrdered}
                            onChange={e => { updateItem(row.id, 'headOrdered', e.target.value); updateItem(row.id, 'avgWeightKg', ''); }}
                          />
                          <span className="text-[9px] text-gray-400 shrink-0">ekor</span>
                        </div>
                      </div>

                      {/* Total Bobot */}
                      <div className="md:col-span-2 space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1 flex items-center gap-1">
                          <Scale size={9} /> Bobot (Kg) *
                        </p>
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2">
                          <input type="number" step="any" min="0.1" required
                            className="w-full py-3 bg-transparent text-xs font-black text-center text-gray-700 outline-none"
                            value={row.weightKg}
                            onChange={e => updateItem(row.id, 'weightKg', e.target.value)}
                          />
                          <span className="text-[9px] text-gray-400 shrink-0">kg</span>
                        </div>
                        {avgWt > 0 && (
                          <p className="text-[8px] text-[#8da070] font-bold ml-1">≈{avgWt.toFixed(1)} kg/ekor</p>
                        )}
                      </div>

                      {/* Harga per Kg */}
                      <div className="md:col-span-3 space-y-1.5">
                        <p className="text-[9px] font-black text-[#8da070] uppercase tracking-tighter ml-1 flex items-center gap-1">
                          <DollarSign size={9} /> Harga / Kg (Rp) *
                        </p>
                        <div className="flex items-center bg-[#8da070]/5 border border-[#8da070]/30 rounded-xl px-3 focus-within:border-[#8da070] transition-all">
                          <span className="text-[10px] font-bold text-gray-400 mr-1 shrink-0">Rp</span>
                          <input type="number" min="1" required
                            className="w-full py-3 bg-transparent text-xs font-black text-right text-gray-700 outline-none"
                            value={row.pricePerKg}
                            onChange={e => updateItem(row.id, 'pricePerKg', e.target.value)}
                          />
                        </div>
                        {/* Subtotal row */}
                        {total > 0 && (
                          <div className="bg-slate-900 rounded-xl px-3 py-2 flex justify-between items-center">
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Subtotal</p>
                            <p className="text-[10px] font-black text-white italic">Rp {fmtRp(total)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HPP baris */}
                    {hppTotal > 0 && (
                      <div className="mt-3 flex items-center gap-3 text-[9px] bg-[#8da070]/5 border border-[#8da070]/20 rounded-xl px-3 py-2">
                        <TrendingUp size={11} className="text-[#8da070] shrink-0" />
                        <span className="font-bold text-gray-500">HPP:</span>
                        <span className="font-black text-[#8da070]">Rp {fmtRp(hppPKg)}/kg</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-black text-gray-700">Total Rp {fmtRp(hppTotal)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Biaya Landed Cost ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic px-1 flex items-center gap-2">
              Biaya Landed Cost (total, bukan per ekor)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'biayaBongkar',   l: 'Bongkar Muat (PBM)',  cc: 'border-orange-100 bg-orange-50/30 focus-within:border-orange-400' },
                { k: 'biayaTracking',  l: 'Tracking / MKL',      cc: 'border-blue-100 bg-blue-50/30 focus-within:border-blue-400'       },
                { k: 'biayaKarantina', l: 'Karantina',            cc: 'border-purple-100 bg-purple-50/30 focus-within:border-purple-400' },
                { k: 'biayaLainLain',  l: 'Lain-lain',            cc: 'border-gray-100 bg-gray-50 focus-within:border-gray-400'          },
              ].map(({ k, l, cc }) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{l}</label>
                  <div className={`flex items-center border rounded-xl px-3 transition-all ${cc}`}>
                    <span className="text-[10px] text-gray-400 mr-1 shrink-0">Rp</span>
                    <input type="number" step="1000" min="0" placeholder="0"
                      value={form[k]} onChange={e => setF(k, e.target.value)}
                      className="flex-1 py-3 bg-transparent text-sm font-bold text-gray-700 outline-none text-right" />
                  </div>
                </div>
              ))}
            </div>
            {totalBiaya > 0 && totalWeightKg > 0 && (
              <p className="text-[10px] font-bold text-gray-500 ml-1">
                ≈ Rp {fmtRp(biayaPerKg)}/kg overhead · Total overhead: Rp {fmtRp(totalBiaya)}
              </p>
            )}
          </div>

          {/* ── Gudang & Catatan ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Kandang / Gudang</label>
              <select value={form.warehouseId} onChange={e => setF('warehouseId', e.target.value)}
                className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none appearance-none">
                <option value="">-- Pilih Kandang --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Catatan</label>
              <input placeholder="Catatan internal..."
                value={form.notes} onChange={e => setF('notes', e.target.value)}
                className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-medium outline-none" />
            </div>
          </div>

          {!isVendorValid && form.vendorName && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-[11px] font-bold text-red-600">Vendor belum terdaftar. Daftarkan di menu Kontak terlebih dahulu.</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="bg-slate-900 px-6 py-4 rounded-2xl w-full sm:w-auto shadow-lg text-left">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Estimasi (incl. landed)</p>
              <p className="text-xl font-black text-white italic tracking-tighter">
                Rp {fmtRp(hppGrandTotal)}
              </p>
              {totalWeightKg > 0 && (
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                  {totalWeightKg.toLocaleString('id-ID')} kg · {items.reduce((s,i) => s+(parseInt(i.headOrdered)||0),0)} ekor
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleClose}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-colors">
                Discard
              </button>
              <button onClick={handleSubmit} disabled={loading || !isValid}
                className="flex-[2] sm:flex-none bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl px-10 py-4 text-[11px] font-black shadow-xl shadow-[#8da070]/20 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Submit {items.length} PO Item</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCattlePurchasing;
