'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, Truck, Plus, Trash2, Loader2, CheckCircle2,
  ShieldCheck, Clock, PackageCheck, AlertCircle,
  FileText, Building2, Hash, Calendar, Eye,
  Search, Warehouse, Box, ChevronRight, Users,
  TrendingUp, AlertTriangle, ShoppingCart, ArrowRight
} from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  DRAFT:     { label: 'Draft',            cls: 'bg-gray-50 text-gray-500 border-gray-200',    pulse: false },
  PENDING:   { label: 'Menunggu Approval', cls: 'bg-orange-50 text-orange-600 border-orange-200', pulse: true  },
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

// ─── Fulfillment bar per item ──────────────────────────────────────────────────
const FulfillmentBar = ({ qtyRequired, qtyOrdered }) => {
  const pct      = Math.min(100, Math.round((qtyOrdered / qtyRequired) * 100)) || 0;
  const isFull   = pct >= 100;
  const isPartial = pct > 0 && pct < 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-[8px] font-black uppercase ${isFull ? 'text-green-600' : isPartial ? 'text-blue-600' : 'text-gray-400'}`}>
          {isFull ? '✓ Terpenuhi' : isPartial ? `${pct}% Diorder` : 'Belum ada PO'}
        </span>
        <span className="text-[8px] font-bold text-gray-500">
          {qtyOrdered}/{qtyRequired}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-green-500' : isPartial ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Stock item picker (autocomplete dari /api/stock) ─────────────────────────
const ItemPicker = ({ value, onChange, stockMaster, placeholder = 'Ketik nama barang...' }) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const ref                 = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() =>
    !query ? stockMaster.slice(0, 8)
    : stockMaster.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [query, stockMaster]
  );
  const isValid = stockMaster.some(s => s.name === value);

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center gap-2 w-full bg-white border rounded-xl px-3 py-2.5 cursor-pointer ${isValid ? 'border-green-300' : value ? 'border-orange-300' : 'border-gray-100 hover:border-blue-200'}`}
        onClick={() => { setOpen(o => !o); setQuery(''); }}
      >
        <Box size={12} className={isValid ? 'text-green-500' : 'text-gray-300'} />
        <span className={`flex-1 text-xs font-bold uppercase truncate ${isValid ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        {isValid && <CheckCircle2 size={12} className="text-green-500 shrink-0" />}
      </div>
      {open && (
        <div className="absolute z-[400] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus className="w-full text-gray-600 pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none"
                placeholder="Cari barang..." value={query} onChange={e => setQuery(e.target.value)}
                onClick={e => e.stopPropagation()} />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filtered.length > 0 ? filtered.map(s => (
              <div key={s.id} onClick={() => { onChange(s); setOpen(false); setQuery(''); }}
                className="px-4 py-3 border-b border-gray-50 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-3 group transition-colors">
                <Box size={12} className="text-blue-400 group-hover:text-white shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-600 font-black uppercase">{s.name}</p>
                  <p className="text-[8px] text-gray-600 opacity-60 uppercase">{s.category} · {s.stock} {s.unit}</p>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-[10px] text-gray-400 italic">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AddDOModal: Buat DO baru dengan daftar kebutuhan ─────────────────────────
// TIDAK ada input supplier di sini. Hanya: nama barang, qty, unit, estimasi harga.
export const AddDOModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { data: session } = useSession();
  const [loading,      setLoading]    = useState(false);
  const [stockMaster,  setStockMaster]= useState([]);
  const [title,        setTitle]      = useState('');
  const [expectedDate, setExpectedDate]= useState('');
  const [doNotes,      setDoNotes]    = useState('');
  const [items, setItems] = useState([
    { id: Date.now(), itemName: '', unit: 'Kg', qtyRequired: 0, estimasiHarga: 0, notes: '', category: '', type: 'STOCKS' },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/stock').then(r => r.ok ? r.json() : []).then(setStockMaster).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || '');
      setExpectedDate(editData.expectedDate?.split('T')[0] || '');
      setDoNotes(editData.notes || '');
      setItems(editData.items?.map(i => ({
        id: i.id, itemName: i.itemName, unit: i.unit,
        qtyRequired: i.qtyRequired, estimasiHarga: i.estimasiHarga,
        notes: i.notes || '', category: i.category || '', type: i.type || 'STOCKS',
      })) || [{ id: Date.now(), itemName: '', unit: 'Kg', qtyRequired: 0, estimasiHarga: 0, notes: '', category: '', type: 'STOCKS' }]);
    }
  }, [editData]);

  const addItem    = () => setItems(p => [...p, { id: Date.now(), itemName: '', unit: 'Kg', qtyRequired: 0, estimasiHarga: 0, notes: '', category: '', type: 'STOCKS' }]);
  const removeItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id, field, val) => setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  const selectStock = (rowId, stock) => setItems(p => p.map(i => i.id === rowId ? {
    ...i, itemName: stock.name, unit: stock.unit, category: stock.category || '', type: stock.type || 'STOCKS',
    estimasiHarga: stock.price ? parseFloat(stock.price) : i.estimasiHarga,
  } : i));

  const totalEstimasi = useMemo(() =>
    items.reduce((s, i) => s + (parseFloat(i.qtyRequired) || 0) * (parseFloat(i.estimasiHarga) || 0), 0),
    [items]
  );

  const handleReset = () => {
    setTitle(''); setExpectedDate(''); setDoNotes('');
    setItems([{ id: Date.now(), itemName: '', unit: 'Kg', qtyRequired: 0, estimasiHarga: 0, notes: '', category: '', type: 'STOCKS' }]);
  };
  const handleClose = () => { handleReset(); onClose(); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        title, expectedDate: expectedDate || null, notes: doNotes,
        items: items.map(i => ({
          itemName: i.itemName, unit: i.unit, qtyRequired: parseFloat(i.qtyRequired) || 0,
          estimasiHarga: parseFloat(i.estimasiHarga) || 0, notes: i.notes,
          category: i.category, type: i.type,
        })),
      };
      const url    = editData ? `/api/delivery-order/${editData.id}` : '/api/delivery-order';
      const method = editData ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      handleReset(); onSuccess?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const isValid = items.every(i => i.itemName && parseFloat(i.qtyRequired) > 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="absolute inset-0 hidden md:block" onClick={handleClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100"><FileText size={22} /></div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
                {editData ? 'Edit Delivery Order' : 'Buat Delivery Order'}
              </h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                Tahap 1: Rencana Kebutuhan · Supplier ditentukan setelah Approval
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={22} className="text-gray-400" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

          {/* Banner informasi */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
              DO berfungsi sebagai dokumen rencana kebutuhan barang. Setelah DO disetujui Admin,
              user dapat membuat PO untuk setiap item — bisa dari supplier berbeda dan qty berbeda.
            </p>
          </div>

          {/* Title + Date + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul / Deskripsi DO</label>
              <input className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Contoh: Kebutuhan Pakan Q1 2026..."
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Calendar size={11} /> Dibutuhkan Sebelum</label>
              <input type="date" className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200"
                value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
          </div>

          {/* Daftar item kebutuhan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Kebutuhan Barang ({items.length})</label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={13} strokeWidth={3} /> Tambah Item
              </button>
            </div>

            {items.map(row => (
              <div key={row.id} className="group relative p-5 bg-white border border-gray-100 rounded-[20px] shadow-sm hover:border-blue-200 transition-all">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(row.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10">
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Item picker */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Nama Barang</label>
                    <ItemPicker value={row.itemName} stockMaster={stockMaster} onChange={s => selectStock(row.id, s)} />
                  </div>
                  {/* Category (read only) */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Kategori</label>
                    <input readOnly className="w-full bg-gray-100 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 cursor-not-allowed uppercase"
                      value={row.category || '-'} />
                  </div>
                  {/* Qty + Unit */}
                  <div className="md:col-span-3 grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Qty Butuh</label>
                      <input type="number" step="any" required min="0.01"
                        className="w-full text-gray-600 bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={row.qtyRequired} onChange={e => updateItem(row.id, 'qtyRequired', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Unit</label>
                      <input readOnly className="w-full bg-gray-100 border-none rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 cursor-not-allowed"
                        value={row.unit} />
                    </div>
                  </div>
                  {/* Estimasi harga */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[9px] font-black text-blue-600 uppercase">Est. Harga/Unit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                      <input type="number" className="w-full text-gray-600 bg-blue-50/40 border-none rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={row.estimasiHarga} onChange={e => updateItem(row.id, 'estimasiHarga', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Catatan (Opsional)</label>
            <textarea rows={2} className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              placeholder="Urgensi, spesifikasi khusus, dll..."
              value={doNotes} onChange={e => setDoNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="bg-gray-900 px-6 py-4 rounded-2xl shadow-lg text-left w-full sm:w-auto">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Est. Anggaran</p>
              <p className="text-xl font-black text-white italic tracking-tighter">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={handleClose}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={loading || !isValid}
                className="flex-[2] sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-4 text-[11px] font-black shadow-xl shadow-blue-100 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><FileText size={16} /> Simpan DO</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CreatePOModal: Buat PO dari item DO yang sudah APPROVED ──────────────────
// User memilih item, isi supplier + qty + harga secara manual.
// Bisa buat PO untuk beberapa item sekaligus dalam satu submit.
export const CreatePOModal = ({ isOpen, onClose, doData, onSuccess }) => {
  const { data: session } = useSession();
  const [loading,   setLoading]   = useState(false);
  const [contacts,  setContacts]  = useState([]);
  const [poForms,   setPOForms]   = useState({}); // { [doItemId]: { supplier, qty, price, notes, selected } }
  const [vendorDropdown, setVendorDropdown] = useState({}); // { [doItemId]: boolean }
  const vendorRefs = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/contacts?type=SUPPLIER').then(r => r.ok ? r.json() : []).then(setContacts).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !doData?.items) return;
    const init = {};
    doData.items.forEach(item => {
      const sisa = item.qtyRequired - (item.qtyOrdered || 0);
      init[item.id] = {
        selected:  false,
        supplier:  '',
        qty:       sisa > 0 ? sisa : item.qtyRequired,
        price:     parseFloat(item.estimasiHarga) || 0,
        notes:     '',
      };
    });
    setPOForms(init);
  }, [isOpen, doData]);

  // Outside click vendor dropdown
  useEffect(() => {
    const h = (e) => {
      Object.entries(vendorRefs.current).forEach(([itemId, ref]) => {
        if (ref && !ref.contains(e.target)) {
          setVendorDropdown(d => ({ ...d, [itemId]: false }));
        }
      });
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleSelect   = (itemId) => setPOForms(p => ({ ...p, [itemId]: { ...p[itemId], selected: !p[itemId]?.selected } }));
  const updateForm     = (itemId, field, val) => setPOForms(p => ({ ...p, [itemId]: { ...p[itemId], [field]: val } }));
  const selectedItems  = doData?.items?.filter(i => poForms[i.id]?.selected) || [];
  const canSubmit      = selectedItems.length > 0 && selectedItems.every(i => {
    const f = poForms[i.id];
    return f?.supplier?.trim() && parseFloat(f?.qty) > 0 && parseFloat(f?.price) > 0;
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        items: selectedItems.map(i => ({
          doItemId: i.id,
          supplier: poForms[i.id].supplier.trim().toUpperCase(),
          qty:      parseFloat(poForms[i.id].qty),
          price:    parseFloat(poForms[i.id].price),
          notes:    poForms[i.id].notes || '',
        })),
      };
      const res = await fetch(`/api/delivery-order/${doData.id}/create-po`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const data = await res.json();
      alert(data.message);
      onSuccess?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen || !doData) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 hidden md:block" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-2xl text-white shadow-lg shadow-green-100"><ShoppingCart size={22} /></div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight leading-none">Buat PO dari DO</h2>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">
                {doData.doNo} · Pilih item, tentukan supplier & harga
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={22} className="text-gray-400" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
            Centang item yang akan dibuatkan PO. Setiap item bisa diorder ke supplier berbeda,
            dan qty bisa berbeda dari kebutuhan DO (partial ordering diizinkan).
          </p>

          {doData.items?.map(item => {
            const form      = poForms[item.id] || {};
            const isChecked = !!form.selected;
            const sisa      = item.qtyRequired - (item.qtyOrdered || 0);
            const isFulfilled = sisa <= 0;

            // Filter supplier autocomplete
            const vendorQ   = form.supplier || '';
            const filteredContacts = contacts.filter(c =>
              c.name.toLowerCase().includes(vendorQ.toLowerCase())
            ).slice(0, 6);

            return (
              <div key={item.id} className={`border rounded-[20px] transition-all ${isChecked ? 'border-green-300 bg-green-50/20' : 'border-gray-100 bg-white'}`}>
                {/* Item header */}
                <div
                  className={`flex items-start gap-3 p-4 cursor-pointer ${isFulfilled ? 'opacity-50' : ''}`}
                  onClick={() => !isFulfilled && toggleSelect(item.id)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? 'bg-green-600 border-green-600' : 'border-gray-300 hover:border-green-400'}`}>
                    {isChecked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] font-black text-gray-800 uppercase">{item.itemName}</p>
                      <span className="text-[9px] text-gray-400 font-bold">{item.category}</span>
                      {isFulfilled && (
                        <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          ✓ Terpenuhi
                        </span>
                      )}
                    </div>
                    <FulfillmentBar qtyRequired={item.qtyRequired} qtyOrdered={item.qtyOrdered || 0} />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Butuh: {item.qtyRequired} {item.unit} · Sudah diorder: {item.qtyOrdered || 0} {item.unit}
                      {sisa > 0 && <span className="text-blue-600 font-bold"> · Sisa: {sisa} {item.unit}</span>}
                    </p>
                  </div>
                </div>

                {/* Form PO per item */}
                {isChecked && !isFulfilled && (
                  <div className="px-4 pb-4 space-y-3 border-t border-green-100 pt-3">
                    {/* Supplier autocomplete */}
                    <div className="space-y-1.5" ref={el => vendorRefs.current[item.id] = el}>
                      <label className="text-[9px] font-black text-gray-400 uppercase">Supplier *</label>
                      <div className="relative">
                        <input
                          className={`w-full text-gray-600 border rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none transition-all ${
                            contacts.some(c => c.name.toUpperCase() === (form.supplier || '').toUpperCase())
                              ? 'border-green-300 bg-green-50/30' : form.supplier ? 'border-orange-300' : 'border-gray-100 bg-gray-50'
                          }`}
                          placeholder="Cari & pilih supplier..."
                          value={form.supplier || ''}
                          autoComplete="off"
                          onChange={e => { updateForm(item.id, 'supplier', e.target.value); setVendorDropdown(d => ({ ...d, [item.id]: true })); }}
                        />
                        {vendorDropdown[item.id] && filteredContacts.length > 0 && (
                          <div className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-[150px] overflow-y-auto">
                            {filteredContacts.map(c => (
                              <div key={c.id}
                                onClick={() => { updateForm(item.id, 'supplier', c.name); setVendorDropdown(d => ({ ...d, [item.id]: false })); }}
                                className="px-4 py-2.5 border-b border-gray-50 hover:bg-green-500 hover:text-white cursor-pointer flex justify-between items-center transition-colors group">
                                <div>
                                  <p className="text-[10px] text-gray-600 font-black uppercase">{c.name}</p>
                                  <p className="text-[8px] text-gray-600 opacity-60 uppercase">{c.companyName || 'Verified'}</p>
                                </div>
                                <CheckCircle2 size={12} className="opacity-0 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Qty */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Qty Order ({item.unit})</label>
                        <input type="number" step="any" min="0.01"
                          className="w-full text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-green-100"
                          value={form.qty || ''} onChange={e => updateForm(item.id, 'qty', e.target.value)} />
                      </div>
                      {/* Harga */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-green-600 uppercase">Harga / {item.unit} (Rp) *</label>
                        <input type="number" min="1"
                          className="w-full text-gray-600 bg-green-50/40 border border-green-200 rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-green-100"
                          value={form.price || ''} onChange={e => updateForm(item.id, 'price', e.target.value)} />
                      </div>
                    </div>

                    {/* Subtotal preview */}
                    {form.qty && form.price && (
                      <div className="flex justify-between items-center p-2.5 bg-gray-900 rounded-xl">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Subtotal PO ini</p>
                        <p className="text-[11px] font-black text-white italic">
                          Rp {((parseFloat(form.qty)||0) * (parseFloat(form.price)||0)).toLocaleString('id-ID')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button onClick={handleSubmit} disabled={loading || !canSubmit}
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white rounded-2xl py-4 text-[11px] font-black shadow-xl shadow-green-100 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><ShoppingCart size={16} /> Buat {selectedItems.length} PO</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DODetailModal ─────────────────────────────────────────────────────────────
export const DODetailModal = ({ isOpen, onClose, doData, onApprove, onReject, onCreatePO, onRefresh }) => {
  const { data: session } = useSession();
  const isAdmin  = ['SuperAdmin', 'Supervisor'].includes(session?.user?.role);
  const [actLoad, setActLoad] = useState('');

  if (!isOpen || !doData) return null;

  const totalEst       = doData.items?.reduce((s, i) => s + (i.qtyRequired || 0) * (i.estimasiHarga || 0), 0) || 0;
  const fulfilledCount = doData.items?.filter(i => (i.qtyOrdered || 0) >= i.qtyRequired).length || 0;

  const doAction = async (key, fn) => { setActLoad(key); try { await fn(); } finally { setActLoad(''); } };

  const canApprove   = isAdmin && doData.status === 'PENDING';
  const canCreatePO  = isAdmin && ['APPROVED', 'PARTIAL'].includes(doData.status);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className={`p-6 flex justify-between items-start shrink-0 ${
          doData.status === 'APPROVED' || doData.status === 'PARTIAL' ? 'bg-green-50' :
          doData.status === 'FULFILLED' ? 'bg-purple-50' :
          doData.status === 'REJECTED' ? 'bg-red-50' : 'bg-orange-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/70"><FileText size={20} className="text-gray-600" /></div>
            <div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{doData.doNo}</h3>
              {doData.title && <p className="text-[10px] font-bold text-gray-500 mt-0.5">{doData.title}</p>}
              <div className="mt-1"><DOStatusBadge status={doData.status} /></div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Dibuat oleh',  value: doData.requestedBy },
              { label: 'Approved by',  value: doData.approvedBy || '-' },
              { label: 'Tanggal DO',   value: new Date(doData.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) },
              { label: 'Butuh sebelum', value: doData.expectedDate ? new Date(doData.expectedDate).toLocaleDateString('id-ID') : '-' },
            ].map((m, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className="text-[11px] font-bold text-gray-700 uppercase mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {doData.notes && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Catatan</p>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">{doData.notes}</p>
            </div>
          )}

          {/* Summary fulfillment */}
          <div className="p-4 bg-gray-900 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Pemenuhan Item</p>
              <p className="text-lg font-black text-white italic">{fulfilledCount} / {doData.items?.length} item</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase">Est. Total</p>
              <p className="text-sm font-black text-white italic">Rp {totalEst.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Item list dengan fulfillment */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              Detail Item ({doData.items?.length} item)
            </p>
            {doData.items?.map(item => (
              <div key={item.id} className="border border-gray-100 rounded-[18px] overflow-hidden">
                <div className="p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-black text-gray-800 uppercase">{item.itemName}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{item.category} · {item.unit}</p>
                    </div>
                    <p className="text-[10px] font-black text-blue-600 shrink-0">
                      {item.estimasiHarga > 0 ? `Rp ${(item.estimasiHarga * item.qtyRequired).toLocaleString('id-ID')}` : '-'}
                    </p>
                  </div>
                  <div className="mt-2">
                    <FulfillmentBar qtyRequired={item.qtyRequired} qtyOrdered={item.qtyOrdered || 0} />
                  </div>
                </div>

                {/* PO list untuk item ini */}
                {item.purchasingOrders?.length > 0 && (
                  <div className="divide-y divide-gray-50 border-t border-gray-100">
                    {item.purchasingOrders.map(po => (
                      <div key={po.id} className="px-4 py-2.5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${po.isReceived ? 'bg-green-500' : po.status === 'APPROVED' ? 'bg-blue-500' : 'bg-orange-400'}`} />
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase">{po.noPO}</p>
                            <p className="text-[8px] text-gray-400 uppercase">{po.supplier} · {po.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-700">{parseFloat(po.qty).toLocaleString('id-ID')} {po.unit}</p>
                          <p className="text-[8px] text-gray-400">
                            Rp {((parseFloat(po.qty)||0)*(parseFloat(po.price)||0)).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(!item.purchasingOrders || item.purchasingOrders.length === 0) && (
                  <div className="px-4 py-2.5 bg-white border-t border-gray-50 flex items-center gap-2">
                    <Clock size={11} className="text-gray-300" />
                    <p className="text-[9px] font-bold text-gray-400 italic">Belum ada PO</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action footer */}
        {(canApprove || canCreatePO || (isAdmin && doData.status === 'PENDING')) && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
            {canApprove && (
              <>
                <button onClick={() => doAction('approve', onApprove)} disabled={!!actLoad}
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-100">
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
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-100">
                <ShoppingCart size={15} /> Buat PO dari DO
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DO Table ──────────────────────────────────────────────────────────────────
const DeliveryOrderTable = ({ data = [], onView, onDelete, loading }) => {
  const { data: session } = useSession();
  const isAdmin = ['SuperAdmin', 'Supervisor'].includes(session?.user?.role);
  const [page, setPage] = useState(1);
  const PER = 6;
  const totalPages = Math.ceil(data.length / PER);
  const current    = data.slice((page - 1) * PER, page * PER);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat...</p>
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-50/50">
              {['No DO', 'Judul / Item', 'Pemenuhan', 'Est. Nilai', 'Status', 'Tgl', 'Aksi'].map(h => (
                <th key={h} className="px-6 py-5 border-b border-gray-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.length > 0 ? current.map(do_ => {
              const totalEst       = do_.items?.reduce((s, i) => s + (i.qtyRequired||0)*(i.estimasiHarga||0), 0) || 0;
              const fulfilledCount = do_.items?.filter(i => (i.qtyOrdered||0) >= i.qtyRequired).length || 0;
              const totalItems     = do_.items?.length || 0;
              return (
                <tr key={do_.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">{do_.doNo}</span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <p className="text-[11px] font-black text-gray-800 uppercase leading-tight">{do_.title || do_.items?.[0]?.itemName || '-'}</p>
                    {totalItems > 1 && <p className="text-[9px] text-gray-400 mt-0.5">{totalItems} item</p>}
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <div className="min-w-[100px]">
                      <p className="text-[9px] font-black text-gray-600 mb-1">{fulfilledCount}/{totalItems} item</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalItems ? (fulfilledCount/totalItems)*100 : 0}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[11px] font-black text-gray-800 italic">Rp {totalEst.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50"><DOStatusBadge status={do_.status} /></td>
                  <td className="px-6 py-5 border-b border-gray-50">
                    <span className="text-[10px] font-bold text-gray-500">
                      {new Date(do_.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
                    </span>
                  </td>
                  <td className="px-6 py-5 border-b border-gray-50 text-right">
                    <div className="flex justify-start gap-2">
                      <button onClick={() => onView(do_)}
                        className="p-2.5 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all border border-blue-100 bg-white shadow-sm active:scale-90">
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
              <tr><td colSpan={7} className="py-24 text-center text-gray-300 font-black uppercase tracking-widest italic text-[10px]">Belum ada DO</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-gray-50">
        {current.map(do_ => {
          const fulfilledCount = do_.items?.filter(i => (i.qtyOrdered||0) >= i.qtyRequired).length || 0;
          const totalItems     = do_.items?.length || 0;
          return (
            <div key={do_.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{do_.doNo}</span>
                  <h4 className="font-black text-gray-800 text-sm uppercase">{do_.title || do_.items?.[0]?.itemName}</h4>
                  <p className="text-[9px] text-gray-400">{fulfilledCount}/{totalItems} item diorder</p>
                </div>
                <DOStatusBadge status={do_.status} />
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalItems ? (fulfilledCount/totalItems)*100 : 0}%` }} />
              </div>
              <button onClick={() => onView(do_)}
                className="w-full py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2">
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

export default DeliveryOrderTable;
