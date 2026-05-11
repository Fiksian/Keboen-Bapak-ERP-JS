'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, FileText, Plus, Trash2, Loader2, CheckCircle2,
  ShieldCheck, Clock, PackageCheck, AlertCircle,
  Building2, Hash, Calendar, Eye, Search,
  Scale, ChevronRight, Users, TrendingUp, ShoppingCart,
  ArrowRight, Globe, DollarSign
} from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:     { label: 'Draft',           cls: 'bg-gray-50 text-gray-500 border-gray-200',    pulse: false },
  PENDING:   { label: 'Menunggu Approval',cls: 'bg-amber-50 text-amber-700 border-amber-200', pulse: true  },
  APPROVED:  { label: 'Disetujui',        cls: 'bg-green-50 text-green-700 border-green-200', pulse: false },
  PARTIAL:   { label: 'Sebagian PO',      cls: 'bg-blue-50 text-blue-700 border-blue-200',    pulse: false },
  FULFILLED: { label: 'Semua PO Dibuat',  cls: 'bg-purple-50 text-purple-700 border-purple-200', pulse: false },
  REJECTED:  { label: 'Ditolak',          cls: 'bg-red-50 text-red-600 border-red-200',       pulse: false },
};

export const DOStatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${s.cls} ${s.pulse ? 'animate-pulse' : ''}`}>
      {s.label}
    </span>
  );
};

const fmtRp  = (v) => new Intl.NumberFormat('id-ID').format(Math.round(parseFloat(v)||0));
const fmtQty = (v) => (parseFloat(v)||0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

// ─── Fulfillment bar ─────────────────────────────────────────────────────────
const FulfillmentBar = ({ headRequired, headOrdered }) => {
  const pct = Math.min(100, Math.round(headRequired > 0 ? (headOrdered / headRequired) * 100 : 0));
  const isFull    = pct >= 100;
  const isPartial = pct > 0 && !isFull;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-[8px] font-black uppercase ${isFull ? 'text-green-600' : isPartial ? 'text-blue-600' : 'text-gray-400'}`}>
          {isFull ? '✓ Terpenuhi' : isPartial ? `${pct}% Diorder` : 'Belum ada PO'}
        </span>
        <span className="text-[8px] font-bold text-gray-500">{headOrdered}/{headRequired} ekor</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isFull ? 'bg-green-500' : isPartial ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Breed picker untuk form item ─────────────────────────────────────────────
const BreedPicker = ({ value, onChange, breeds, placeholder = 'Pilih Jenis Sapi...' }) => {
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
      <div onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 w-full bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-all ${isValid ? 'border-[#8da070] bg-[#8da070]/5' : value ? 'border-amber-300' : 'border-gray-100 hover:border-[#8da070]/40'}`}>
        <span className="text-sm shrink-0">🐄</span>
        <span className={`flex-1 text-xs font-bold uppercase truncate ${isValid ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        {isValid && <CheckCircle2 size={11} className="text-[#8da070] shrink-0" />}
      </div>
      {open && (
        <div className="absolute z-[400] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 outline-none"
                placeholder="Cari jenis sapi..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filtered.map(b => (
              <div key={b.id || b.name} onClick={() => { onChange(b); setOpen(false); setQ(''); }}
                className="px-4 py-3 border-b border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex items-center gap-3 group transition-colors">
                <span className="text-sm shrink-0">🐄</span>
                <div>
                  <p className="text-[10px] font-black uppercase">{b.name}</p>
                  {b.description && <p className="text-[8px] opacity-60 italic">{b.description}</p>}
                </div>
              </div>
            ))}
            {q && !filtered.find(b => b.name.toUpperCase() === q.toUpperCase()) && (
              <div onClick={() => { onChange({ id: null, name: q.toUpperCase() }); setOpen(false); setQ(''); }}
                className="px-4 py-3 hover:bg-amber-500 hover:text-white cursor-pointer flex items-center gap-2 transition-colors">
                <Plus size={12} className="text-amber-500" />
                <p className="text-[10px] font-black uppercase">Tambah "{q.toUpperCase()}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GENDERS = [
  { k: 'JANTAN', l: '♂ Jantan' },
  { k: 'BETINA', l: '♀ Betina' },
  { k: 'CAMPUR', l: '± Campur' },
];

// ─── AddDOModal ────────────────────────────────────────────────────────────────
export const AddDOModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { data: session }   = useSession();
  const [loading,      setLoading]    = useState(false);
  const [breeds,       setBreeds]     = useState([]);
  const [title,        setTitle]      = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [doNotes,      setDoNotes]    = useState('');

  const EMPTY_ITEM = useCallback(() => ({
    id: Date.now() + Math.random(),
    jenisSapi: '', breedId: null, gender: 'CAMPUR',
    headRequired: '', weightRequiredKg: '',
    estimasiHargaPerKg: '', notes: '',
  }), []);

  const [items, setItems] = useState([EMPTY_ITEM()]);

  const FALLBACK_BREEDS = [
    { id: 'lim', name: 'LIMOUSIN',  description: 'Sapi potong Prancis'        },
    { id: 'sim', name: 'SIMENTAL',  description: 'Sapi Swiss'                 },
    { id: 'bx',  name: 'BX',        description: 'Brahman Cross Australia'    },
    { id: 'bra', name: 'BRAHMAN',   description: 'Sapi impor Amerika'         },
    { id: 'ang', name: 'ANGUS',     description: 'Sapi premium Skotlandia'    },
    { id: 'wag', name: 'WAGYU',     description: 'Sapi premium Jepang'        },
    { id: 'ong', name: 'ONGOLE',    description: 'Sapi PO lokal'              },
    { id: 'cam', name: 'CAMPURAN',  description: 'Campuran / Tidak ditentukan'},
  ];

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/cattle/breeds').then(r => r.ok ? r.json() : [])
      .then(d => setBreeds(d.length ? d : FALLBACK_BREEDS))
      .catch(() => setBreeds(FALLBACK_BREEDS));
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || '');
      setExpectedDate(editData.expectedDate?.split('T')[0] || '');
      setDoNotes(editData.notes || '');
      setItems(editData.items?.map(i => ({
        id: i.id, jenisSapi: i.jenisSapi, breedId: i.breedId || null,
        gender: i.gender || 'CAMPUR',
        headRequired: i.headRequired || '',
        weightRequiredKg: i.weightRequiredKg || '',
        estimasiHargaPerKg: i.estimasiHargaPerKg || '',
        notes: i.notes || '',
      })) || [EMPTY_ITEM()]);
    }
  }, [editData]);

  const addItem    = () => setItems(p => [...p, EMPTY_ITEM()]);
  const removeItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id, field, val) => setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));

  const selectBreed = (rowId, breed) => setItems(p => p.map(i =>
    i.id === rowId ? { ...i, jenisSapi: breed.name, breedId: breed.id || null } : i
  ));

  const totalEstimasi = useMemo(() =>
    items.reduce((s, i) => {
      const wt  = parseFloat(i.weightRequiredKg) || 0;
      const h   = parseFloat(i.estimasiHargaPerKg) || 0;
      return s + wt * h;
    }, 0),
    [items]
  );

  const totalHead = useMemo(() =>
    items.reduce((s, i) => s + (parseInt(i.headRequired) || 0), 0), [items]);

  const handleReset = () => {
    setTitle(''); setExpectedDate(''); setDoNotes('');
    setItems([EMPTY_ITEM()]);
  };
  const handleClose = () => { handleReset(); onClose(); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        title, expectedDate: expectedDate || null, notes: doNotes,
        items: items.map(i => ({
          jenisSapi: i.jenisSapi, breedId: i.breedId || null,
          gender:    i.gender,
          headRequired:       parseInt(i.headRequired) || 0,
          weightRequiredKg:   parseFloat(i.weightRequiredKg) || 0,
          estimasiHargaPerKg: parseFloat(i.estimasiHargaPerKg) || 0,
          notes: i.notes,
        })),
      };
      const url    = editData ? `/api/cattle/delivery-order/${editData.id}` : '/api/cattle/delivery-order';
      const method = editData ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      handleReset(); onSuccess?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const isValid = items.every(i => i.jenisSapi && parseInt(i.headRequired) > 0);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="absolute inset-0 hidden md:block" onClick={handleClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] md:max-h-[92vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#8da070] rounded-2xl text-white shadow-lg shadow-[#8da070]/20">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
                {editData ? 'Edit Delivery Order' : 'Buat Delivery Order Sapi'}
              </h2>
              <p className="text-[10px] text-[#8da070] font-bold uppercase tracking-widest mt-1">
                Tahap 1: Rencana Kebutuhan · Eksportir ditentukan setelah Approval
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">

          <div className="flex items-start gap-3 p-4 bg-[#8da070]/5 border border-[#8da070]/20 rounded-2xl">
            <AlertCircle size={15} className="text-[#8da070] shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium text-gray-700 leading-relaxed">
              DO berfungsi sebagai dokumen rencana kebutuhan sapi. Setelah disetujui, user dapat membuat PO
              ke eksportir berbeda untuk setiap jenis sapi — dengan bobot dan harga aktual.
            </p>
          </div>

          {/* Title + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Judul / Keperluan DO
              </label>
              <input className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/20"
                placeholder="Contoh: Pengadaan Idul Adha 2026..."
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <Calendar size={11} /> Dibutuhkan Sebelum
              </label>
              <input type="date"
                className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/20"
                value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Daftar Kebutuhan Sapi ({items.length} jenis · {totalHead} ekor)
              </label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-[#8da070] text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-[#7a8c61] transition-all active:scale-95">
                <Plus size={13} strokeWidth={3} /> Tambah Jenis
              </button>
            </div>

            {items.map(row => {
              const est = (parseFloat(row.weightRequiredKg)||0) * (parseFloat(row.estimasiHargaPerKg)||0);
              return (
                <div key={row.id} className="group relative p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:border-[#8da070]/30 transition-all">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(row.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10">
                      <Trash2 size={13} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

                    {/* Jenis Sapi */}
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Jenis Sapi *</label>
                      <BreedPicker value={row.jenisSapi} breeds={breeds} onChange={b => selectBreed(row.id, b)} />
                    </div>

                    {/* Gender */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Gender</label>
                      <div className="flex gap-1">
                        {GENDERS.map(g => (
                          <button type="button" key={g.k}
                            onClick={() => updateItem(row.id, 'gender', g.k)}
                            className={`flex-1 py-2.5 rounded-xl text-[8px] font-black border transition-all ${
                              row.gender === g.k
                                ? 'bg-[#8da070] text-white border-[#8da070] shadow-md'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-[#8da070]/40'}`}>
                            {g.l.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ekor */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                        <Hash size={9} /> Ekor *
                      </label>
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2">
                        <input type="number" step="1" min="1"
                          className="w-full py-2.5 bg-transparent text-xs font-black text-center text-gray-700 outline-none"
                          value={row.headRequired}
                          onChange={e => updateItem(row.id, 'headRequired', e.target.value)} />
                        <span className="text-[8px] text-gray-400 shrink-0">ekor</span>
                      </div>
                    </div>

                    {/* Total Bobot Estimasi */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                        <Scale size={9} /> Bobot (Kg)
                      </label>
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2">
                        <input type="number" step="any" min="0"
                          className="w-full py-2.5 bg-transparent text-xs font-black text-center text-gray-700 outline-none"
                          placeholder="0"
                          value={row.weightRequiredKg}
                          onChange={e => updateItem(row.id, 'weightRequiredKg', e.target.value)} />
                        <span className="text-[8px] text-gray-400 shrink-0">kg</span>
                      </div>
                      {row.headRequired && row.weightRequiredKg && (
                        <p className="text-[8px] text-gray-400 ml-1">
                          ≈{((parseFloat(row.weightRequiredKg)||0) / (parseInt(row.headRequired)||1)).toFixed(1)} kg/ekor
                        </p>
                      )}
                    </div>

                    {/* Estimasi Harga/Kg */}
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[9px] font-black text-[#8da070] uppercase flex items-center gap-1">
                        <DollarSign size={9} /> Est. Harga/Kg
                      </label>
                      <div className="flex items-center bg-[#8da070]/5 border border-[#8da070]/20 rounded-xl px-3 focus-within:border-[#8da070] transition-all">
                        <span className="text-[9px] text-gray-400 mr-1 shrink-0">Rp</span>
                        <input type="number" min="0"
                          className="w-full py-2.5 bg-transparent text-xs font-black text-right text-gray-700 outline-none"
                          value={row.estimasiHargaPerKg}
                          onChange={e => updateItem(row.id, 'estimasiHargaPerKg', e.target.value)} />
                      </div>
                      {est > 0 && (
                        <div className="bg-slate-900 rounded-xl px-2 py-1.5 flex justify-between">
                          <p className="text-[8px] font-bold text-slate-500">Est. Total</p>
                          <p className="text-[9px] font-black text-white italic">Rp {fmtRp(est)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan DO</label>
            <textarea rows={2}
              className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none"
              placeholder="Spesifikasi khusus, kondisi, dll..."
              value={doNotes} onChange={e => setDoNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {totalEstimasi > 0 ? (
              <div className="bg-slate-900 px-6 py-3.5 rounded-2xl shadow-lg w-full sm:w-auto text-left">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Estimasi Anggaran</p>
                <p className="text-xl font-black text-white italic tracking-tighter">Rp {fmtRp(totalEstimasi)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{totalHead} ekor rencana</p>
              </div>
            ) : <div />}
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleClose}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading || !isValid}
                className="flex-[2] sm:flex-none bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl px-10 py-4 text-[11px] font-black shadow-xl uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> {editData ? 'Update DO' : 'Submit DO'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CreatePOFromDO Modal ──────────────────────────────────────────────────────
export const CreatePOFromDOModal = ({ isOpen, onClose, doData, onSuccess }) => {
  const { data: session }     = useSession();
  const [loading,    setLoading]     = useState(false);
  const [contacts,   setContacts]    = useState([]);
  const [warehouses, setWarehouses]  = useState([]);
  const [poForms,    setPoForms]     = useState({});  // { doItemId: { selected, vendorName, pricePerKg, weightKg } }
  const [vendorDropdown, setVendorDropdown] = useState({});
  const vendorRefs = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/contacts?type=SUPPLIER').then(r => r.ok ? r.json() : []),
      fetch('/api/warehouse').then(r => r.ok ? r.json() : []),
    ]).then(([c, w]) => { setContacts(c); setWarehouses(w); });
    setPoForms({});
  }, [isOpen]);

  useEffect(() => {
    const h = (e) => {
      Object.entries(vendorRefs.current).forEach(([id, el]) => {
        if (el && !el.contains(e.target)) setVendorDropdown(d => ({ ...d, [id]: false }));
      });
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const updateForm = (itemId, field, val) =>
    setPoForms(p => ({ ...p, [itemId]: { ...p[itemId], [field]: val } }));

  const toggleSelect = (itemId) =>
    setPoForms(p => ({ ...p, [itemId]: { ...p[itemId], selected: !p[itemId]?.selected } }));

  const selectedItems = Object.entries(poForms).filter(([, v]) => v.selected).map(([k]) => k);

  const canSubmit = selectedItems.length > 0 && selectedItems.every(id => {
    const f = poForms[id];
    return f.vendorName && parseFloat(f.pricePerKg) > 0 && parseFloat(f.weightKg) > 0;
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const items = selectedItems.map(doItemId => {
        const f     = poForms[doItemId];
        const doItem = doData.items.find(i => i.id === doItemId);
        return {
          jenisSapi:   doItem.jenisSapi,
          breedId:     doItem.breedId || null,
          gender:      doItem.gender || 'CAMPUR',
          headOrdered: parseInt(f.headOrdered || doItem.headRequired - (doItem.headOrdered||0)),
          weightKg:    parseFloat(f.weightKg),
          pricePerKg:  parseFloat(f.pricePerKg),
          doItemId,
        };
      });

      // Group items by vendor
      const byVendor = {};
      selectedItems.forEach(id => {
        const vendor = poForms[id].vendorName;
        if (!byVendor[vendor]) byVendor[vendor] = [];
        byVendor[vendor].push(items.find(i => i.doItemId === id));
      });

      // Buat satu PO per vendor
      for (const [vendorName, vendorItems] of Object.entries(byVendor)) {
        const f = poForms[vendorItems[0].doItemId];
        await fetch('/api/cattle/purchasing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorName,
            warehouseId: f.warehouseId || null,
            items: vendorItems,
          }),
        }).then(r => { if (!r.ok) return r.json().then(e => { throw new Error(e.message); }); });
      }

      onSuccess?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen || !doData) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 hidden md:block" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] md:max-h-[92vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#8da070] rounded-2xl text-white shadow-lg"><ShoppingCart size={22} /></div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight leading-none">Buat PO dari DO</h2>
              <p className="text-[10px] text-[#8da070] font-bold uppercase tracking-widest mt-1">
                {doData.doNo} · Pilih sapi, eksportir & harga aktual
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={22} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
          <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
            Centang item yang akan dibuatkan PO. Tentukan eksportir, bobot aktual, dan harga per kg dari hasil negosiasi.
          </p>

          {doData.items?.map(item => {
            const form = poForms[item.id] || {};
            const isChecked   = !!form.selected;
            const sisa = (item.headRequired || 0) - (item.headOrdered || 0);
            const isFulfilled = sisa <= 0;

            const vendorQ = form.vendorName || '';
            const filteredContacts = contacts.filter(c =>
              c.name.toLowerCase().includes(vendorQ.toLowerCase())).slice(0, 6);

            return (
              <div key={item.id}
                className={`border rounded-[20px] transition-all ${isChecked ? 'border-[#8da070]/40 bg-[#8da070]/5' : 'border-gray-100 bg-white'}`}>

                <div className={`flex items-start gap-3 p-4 cursor-pointer ${isFulfilled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isFulfilled && toggleSelect(item.id)}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? 'bg-[#8da070] border-[#8da070]' : 'border-gray-300 hover:border-[#8da070]'}`}>
                    {isChecked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] font-black text-gray-800 uppercase flex items-center gap-1">
                        🐄 {item.jenisSapi}
                      </p>
                      <span className={`text-[10px] font-black px-3 py-1 text-lg rounded border ${
                        item.gender === 'JANTAN' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        item.gender === 'BETINA' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                        'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {item.gender === 'JANTAN' ? '♂' : item.gender === 'BETINA' ? '♀' : '±'} {item.gender}
                      </span>
                      {isFulfilled && (
                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">✓ Terpenuhi</span>
                      )}
                    </div>
                    <FulfillmentBar headRequired={item.headRequired} headOrdered={item.headOrdered || 0} />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Butuh: {item.headRequired} ekor
                      {item.weightRequiredKg > 0 && ` · ~${fmtQty(item.weightRequiredKg)} kg`}
                      {sisa > 0 && <span className="text-[#8da070] font-bold"> · Sisa: {sisa} ekor</span>}
                    </p>
                  </div>
                </div>

                {/* Form PO per item */}
                {isChecked && !isFulfilled && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[#8da070]/20 pt-3">
                    {/* Supplier */}
                    <div className="space-y-1.5" ref={el => vendorRefs.current[item.id] = el}>
                      <label className="text-[9px] font-black text-gray-400 uppercase">Eksportir *</label>
                      <div className="relative">
                        <input
                          className={`w-full text-gray-600 border rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none transition-all ${
                            contacts.some(c => c.name.toUpperCase() === (form.vendorName||'').toUpperCase())
                              ? 'border-[#8da070]/50 bg-[#8da070]/5' : form.vendorName ? 'border-amber-300' : 'border-gray-100 bg-gray-50'}`}
                          placeholder="Cari & pilih eksportir..."
                          value={form.vendorName || ''}
                          autoComplete="off"
                          onChange={e => { updateForm(item.id, 'vendorName', e.target.value); setVendorDropdown(d => ({ ...d, [item.id]: true })); }}
                        />
                        {vendorDropdown[item.id] && filteredContacts.length > 0 && (
                          <div className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-[140px] overflow-y-auto">
                            {filteredContacts.map(c => (
                              <div key={c.id}
                                onClick={() => { updateForm(item.id, 'vendorName', c.name); setVendorDropdown(d => ({ ...d, [item.id]: false })); }}
                                className="px-4 py-2.5 border-b border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex justify-between items-center transition-colors group">
                                <p className="text-[10px] font-black uppercase">{c.name}</p>
                                <CheckCircle2 size={12} className="opacity-0 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Ekor actual */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                          <Hash size={9} /> Ekor Order
                        </label>
                        <input type="number" step="1" min="1" max={sisa}
                          className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-black text-center outline-none focus:ring-2 focus:ring-[#8da070]/20"
                          placeholder={sisa.toString()}
                          value={form.headOrdered || ''} onChange={e => updateForm(item.id, 'headOrdered', e.target.value)} />
                      </div>

                      {/* Bobot aktual */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                          <Scale size={9} /> Bobot (Kg) *
                        </label>
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-2">
                          <input type="number" step="any" min="0.1" required
                            className="w-full py-2.5 bg-transparent text-xs font-black text-right text-gray-700 outline-none"
                            value={form.weightKg || ''} onChange={e => updateForm(item.id, 'weightKg', e.target.value)} />
                          <span className="text-[8px] text-gray-400 ml-1 shrink-0">kg</span>
                        </div>
                      </div>

                      {/* Harga per kg */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-[#8da070] uppercase flex items-center gap-1">
                          <DollarSign size={9} /> Harga/Kg *
                        </label>
                        <div className="flex items-center bg-[#8da070]/5 border border-[#8da070]/20 rounded-xl px-2 focus-within:border-[#8da070] transition-all">
                          <span className="text-[8px] text-gray-400 shrink-0 mr-0.5">Rp</span>
                          <input type="number" min="1" required
                            className="w-full py-2.5 bg-transparent text-xs font-black text-right text-gray-700 outline-none"
                            value={form.pricePerKg || ''} onChange={e => updateForm(item.id, 'pricePerKg', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Subtotal preview */}
                    {form.weightKg && form.pricePerKg && (
                      <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Subtotal PO ini</p>
                        <p className="text-[11px] font-black text-white italic">
                          Rp {fmtRp((parseFloat(form.weightKg)||0) * (parseFloat(form.pricePerKg)||0))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading || !canSubmit}
            className="flex-[2] bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl py-4 text-[11px] font-black shadow-xl shadow-[#8da070]/20 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> Buat {selectedItems.length} PO</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── DO Detail Modal ───────────────────────────────────────────────────────────
export const DODetailModal = ({ isOpen, onClose, doData, onApprove, onReject, onCreatePO }) => {
  const { data: session } = useSession();
  const isAdmin  = ['SuperAdmin', 'Supervisor', 'Manager'].includes(session?.user?.role);
  const [actLoad, setActLoad] = useState('');

  if (!isOpen || !doData) return null;

  const totalEst    = doData.items?.reduce((s, i) => s + (i.weightRequiredKg||0) * (i.estimasiHargaPerKg||0), 0) || 0;
  const totalHead   = doData.items?.reduce((s, i) => s + (i.headRequired||0), 0) || 0;
  const fulfilledCt = doData.items?.filter(i => (i.headOrdered||0) >= i.headRequired).length || 0;

  const doAction = async (key, fn) => { setActLoad(key); try { await fn(); } finally { setActLoad(''); } };

  const canApprove  = isAdmin && doData.status === 'PENDING';
  const canCreatePO = isAdmin && ['APPROVED', 'PARTIAL'].includes(doData.status);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className={`p-6 flex justify-between items-start shrink-0 ${
          doData.status === 'APPROVED' || doData.status === 'PARTIAL' ? 'bg-[#8da070]/5' :
          doData.status === 'FULFILLED' ? 'bg-purple-50' :
          doData.status === 'REJECTED'  ? 'bg-red-50'    : 'bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/70"><FileText size={20} className="text-gray-600" /></div>
            <div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{doData.doNo}</h3>
              {doData.title && <p className="text-[10px] font-bold text-gray-500 mt-0.5">{doData.title}</p>}
              <div className="mt-1"><DOStatusBadge status={doData.status} /></div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Dibuat oleh',   v: doData.requestedBy },
              { l: 'Approved by',   v: doData.approvedBy || '-' },
              { l: 'Tanggal DO',    v: new Date(doData.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) },
              { l: 'Butuh sebelum', v: doData.expectedDate ? new Date(doData.expectedDate).toLocaleDateString('id-ID') : '-' },
            ].map((m, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{m.l}</p>
                <p className="text-[11px] font-bold text-gray-700 uppercase mt-0.5">{m.v}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#8da070]/10 p-3 rounded-2xl border border-[#8da070]/20">
              <p className="text-[8px] font-black text-[#8da070] uppercase">Total Ekor</p>
              <p className="text-lg font-black text-gray-800 italic">{totalHead}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
              <p className="text-[8px] font-black text-amber-600 uppercase">Jenis Sapi</p>
              <p className="text-lg font-black text-gray-800 italic">{doData.items?.length || 0}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <p className="text-[8px] font-black text-blue-600 uppercase">Est. Anggaran</p>
              <p className="text-sm font-black text-gray-800 italic">Rp {fmtRp(totalEst)}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Sapi ({fulfilledCt}/{doData.items?.length || 0} terpenuhi)</p>
            {doData.items?.map(item => (
              <div key={item.id} className="border border-gray-100 rounded-[20px] overflow-hidden">
                <div className="p-4 bg-gray-50 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-[12px] font-black text-gray-800 uppercase flex items-center gap-1">
                        🐄 {item.jenisSapi}
                      </p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${
                        item.gender === 'JANTAN' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        item.gender === 'BETINA' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                        'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {item.gender}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400">
                      {item.headRequired} ekor
                      {item.weightRequiredKg > 0 && ` · ~${fmtQty(item.weightRequiredKg)} kg`}
                      {item.estimasiHargaPerKg > 0 && ` · Est. Rp ${fmtRp(item.estimasiHargaPerKg)}/kg`}
                    </p>
                    <div className="mt-2">
                      <FulfillmentBar headRequired={item.headRequired} headOrdered={item.headOrdered || 0} />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-[#8da070] shrink-0">
                    {item.estimasiHargaPerKg > 0 ? `Rp ${fmtRp((item.estimasiHargaPerKg||0) * (item.weightRequiredKg||0))}` : '-'}
                  </p>
                </div>

                {/* PO list */}
                {item.purchasingOrders?.length > 0 && (
                  <div className="divide-y divide-gray-50 border-t border-gray-100">
                    {item.purchasingOrders.map(po => (
                      <div key={po.id} className="px-4 py-2.5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${po.isReceived ? 'bg-green-500' : po.status === 'APPROVED' ? 'bg-blue-500' : 'bg-amber-400'}`} />
                          <p className="text-[10px] font-black text-[#8da070] uppercase">{po.noPO}</p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-600">{po.headOrdered} ekor · {po.status}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(!item.purchasingOrders?.length) && (
                  <div className="px-4 py-2.5 bg-white border-t border-gray-50 flex items-center gap-2">
                    <Clock size={11} className="text-gray-300" />
                    <p className="text-[9px] font-bold text-gray-400 italic">Belum ada PO</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {doData.notes && (
            <div className="p-3 bg-gray-50 rounded-2xl">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Catatan</p>
              <p className="text-[11px] text-gray-600 italic">{doData.notes}</p>
            </div>
          )}
        </div>

        {/* Action footer */}
        {(canApprove || canCreatePO) && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
            {canApprove && (
              <>
                <button onClick={() => doAction('approve', onApprove)} disabled={!!actLoad}
                  className="flex-1 py-3.5 bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                  {actLoad === 'approve' ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />} Approve DO
                </button>
                <button onClick={() => doAction('reject', onReject)} disabled={!!actLoad}
                  className="flex-1 py-3.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {actLoad === 'reject' ? <Loader2 className="animate-spin" size={15} /> : <X size={15} />} Reject
                </button>
              </>
            )}
            {canCreatePO && (
              <button onClick={onCreatePO} disabled={!!actLoad}
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                <ShoppingCart size={15} /> Buat PO dari DO
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DO Table (list) ──────────────────────────────────────────────────────────
const CattleDeliveryOrderTable = ({ data = [], onView, onDelete, loading }) => {
  const { data: session } = useSession();
  const isAdmin = ['SuperAdmin', 'Supervisor', 'Manager'].includes(session?.user?.role);
  const [page, setPage] = useState(1);
  const PER = 6;
  const totalPages = Math.ceil(data.length / PER);
  const current    = data.slice((page - 1) * PER, page * PER);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="animate-spin text-[#8da070]" size={32} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat DO Sapi...</p>
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] bg-gray-50/50">
              {['No DO', 'Judul / Sapi', 'Ekor & Bobot', 'Pemenuhan', 'Est. Anggaran', 'Status', 'Tgl', 'Aksi'].map(h => (
                <th key={h} className="px-5 py-5 border-b border-gray-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.length > 0 ? current.map(do_ => {
              const totalEst    = do_.items?.reduce((s, i) => s + (i.weightRequiredKg||0) * (i.estimasiHargaPerKg||0), 0) || 0;
              const totalHead   = do_.items?.reduce((s, i) => s + (i.headRequired||0), 0) || 0;
              const totalWt     = do_.items?.reduce((s, i) => s + (i.weightRequiredKg||0), 0) || 0;
              const fulfilledCt = do_.items?.filter(i => (i.headOrdered||0) >= i.headRequired).length || 0;
              const totalItems  = do_.items?.length || 0;
              const breeds      = [...new Set(do_.items?.map(i => i.jenisSapi) || [])].slice(0, 3).join(', ');

              return (
                <tr key={do_.id} className="hover:bg-[#8da070]/5 transition-colors group">
                  <td className="px-5 py-5 border-b border-gray-50">
                    <span className="text-[11px] font-black text-[#8da070] bg-[#8da070]/10 border border-[#8da070]/20 px-2 py-0.5 rounded-lg">{do_.doNo}</span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <p className="text-[11px] font-black text-gray-800 uppercase leading-tight">{do_.title || breeds || '-'}</p>
                    {totalItems > 0 && <p className="text-[9px] text-gray-400 mt-0.5">{totalItems} jenis sapi</p>}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[11px] font-black text-gray-800">
                        {totalHead.toLocaleString('id-ID')}
                        <span className="text-[#8da070] text-[9px] font-black not-italic">ekor</span>
                      </span>
                      {totalWt > 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                          <Scale size={9} /> ~{fmtQty(totalWt)} kg
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <div className="min-w-[100px]">
                      <p className="text-[9px] font-black text-gray-600 mb-1">{fulfilledCt}/{totalItems} jenis</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8da070] rounded-full" style={{ width: `${totalItems ? (fulfilledCt/totalItems)*100 : 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <span className="text-[11px] font-black text-gray-800 italic">Rp {fmtRp(totalEst)}</span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50"><DOStatusBadge status={do_.status} /></td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <span className="text-[10px] font-bold text-gray-500">
                      {new Date(do_.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-50">
                    <div className="flex gap-2">
                      <button onClick={() => onView(do_)}
                        className="p-2.5 text-[#8da070] hover:bg-[#8da070] hover:text-white rounded-xl transition-all border border-[#8da070]/30 bg-white shadow-sm active:scale-90">
                        <Eye size={16} />
                      </button>
                      {isAdmin && ['DRAFT', 'PENDING'].includes(do_.status) && (
                        <button onClick={() => onDelete(do_.id)}
                          className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="py-24 text-center text-gray-300 font-black uppercase tracking-widest italic text-[10px]">Belum ada DO Sapi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-gray-50">
        {current.map(do_ => {
          const breeds      = [...new Set(do_.items?.map(i => i.jenisSapi) || [])].slice(0, 2).join(', ');
          const totalHead   = do_.items?.reduce((s, i) => s + (i.headRequired||0), 0) || 0;
          const fulfilledCt = do_.items?.filter(i => (i.headOrdered||0) >= i.headRequired).length || 0;
          const totalItems  = do_.items?.length || 0;
          return (
            <div key={do_.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20">{do_.doNo}</span>
                  <h4 className="font-black text-gray-800 text-sm uppercase">🐄 {do_.title || breeds}</h4>
                  <p className="text-[9px] text-gray-400">{totalHead} ekor · {fulfilledCt}/{totalItems} terpenuhi</p>
                </div>
                <DOStatusBadge status={do_.status} />
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#8da070] rounded-full" style={{ width: `${totalItems ? (fulfilledCt/totalItems)*100 : 0}%` }} />
              </div>
              <button onClick={() => onView(do_)}
                className="w-full py-3 bg-[#8da070]/10 text-[#8da070] border border-[#8da070]/20 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2">
                <Eye size={14} /> Detail & Buat PO
              </button>
            </div>
          );
        })}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default CattleDeliveryOrderTable;
