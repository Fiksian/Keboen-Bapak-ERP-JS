'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, Plus, Trash2, Save, Loader2, ShoppingCart, Tag, Percent,
  Truck, ChevronDown, Search, CheckCircle2, AlertCircle, Box,
  Info, Layers, Zap, Hand, ArrowDown, RefreshCw, Warehouse
} from 'lucide-react';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CREDIT', 'QRIS'];
const TAX_OPTIONS     = [
  { label: 'Tanpa PPN', value: 0  },
  { label: 'PPN 11%',   value: 11 },
  { label: 'PPN 12%',   value: 12 },
];
const EMPTY_ITEM = {
  name: '', quantity: 1, price: 0, unit: '', discount: 0, notes: '',
  warehouseId: '', batchAllocation: [], unitCost: 0, totalCost: 0,
};

const fmtRp  = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtQty = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

// ─── QtyBar ──────────────────────────────────────────────────────────────────
const QtyBar = ({ remaining, initial }) => {
  if (!initial) return null;
  const pct = Math.min(100, (remaining / initial) * 100);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full ${pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
           style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── BatchPicker untuk satu item penjualan ────────────────────────────────────
const SalesBatchPicker = ({ itemName, warehouseId, qtyNeeded, value = [], onChange, disabled }) => {
  const [batches,   setBatches]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [mode,      setMode]      = useState('auto');  // 'auto' | 'manual'
  const [search,    setSearch]    = useState('');
  const [alloc,     setAlloc]     = useState(value);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!itemName || !warehouseId) return;
    setLoading(true);
    const params = new URLSearchParams({ item: itemName, warehouseId, status: 'ACTIVE' });
    if (search) params.set('q', search);
    fetch(`/api/stock/batch?${params}`)
      .then(r => r.ok ? r.json() : { batches: [] })
      .then(d => {
        const sorted = (d.batches || [])
          .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
          .map((b, i) => ({ ...b, fifoPosition: i + 1, qtyAvailable: Math.max(0, b.qtyRemaining - (b.reservedQty || 0)) }));
        setBatches(sorted);
        if (mode === 'auto') runAuto(sorted, parseFloat(qtyNeeded) || 0);
      })
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, [itemName, warehouseId, search]);

  useEffect(() => {
    if (mode === 'auto' && batches.length) runAuto(batches, parseFloat(qtyNeeded) || 0);
  }, [mode, qtyNeeded]);

  useEffect(() => { setAlloc(value); }, [value]);

  useEffect(() => {
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const runAuto = (bList, needed) => {
    let rem = needed;
    const a = [];
    for (const b of bList) {
      if (rem <= 0) break;
      const take = Math.min(rem, b.qtyAvailable);
      if (take <= 0) continue;
      a.push({ batchId: b.id, batchNo: b.batchNo, qty: parseFloat(take.toFixed(6)), price: b.price || "0",
                supplier: b.supplierName || "-", noPO: b.noPO || "-", receivedAt: b.receivedAt });
      rem -= take;
    }
    setAlloc(a);
    emitChange(a, Math.max(0, rem));
  };

  const emitChange = (a, shortfall = 0) => {
    const total = a.reduce((s, x) => s + (parseFloat(x.price) || 0) * x.qty, 0);
    onChange?.(a, { totalCost: total, shortfall });
  };

  const addBatch = (b) => {
    if (alloc.find(a => a.batchId === b.id)) return;
    const suggest = Math.min(b.qtyAvailable, Math.max(0, parseFloat(qtyNeeded) - stats.totalAllocated));
    const na = [...alloc, { batchId: b.id, batchNo: b.batchNo, qty: parseFloat(suggest.toFixed(6)),
                             price: b.price || "0", supplier: b.supplierName || "-", noPO: b.noPO || "-",
                             receivedAt: b.receivedAt }];
    setAlloc(na);
    emitChange(na);
  };

  const removeBatch = (batchId) => {
    const na = alloc.filter(a => a.batchId !== batchId);
    setAlloc(na);
    emitChange(na);
  };

  const changeQty = (batchId, qty) => {
    const na = alloc.map(a => a.batchId === batchId ? { ...a, qty: parseFloat(qty.toFixed(6)) } : a);
    setAlloc(na);
    emitChange(na);
  };

  const stats = useMemo(() => {
    const totalAllocated = alloc.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
    const shortfall      = Math.max(0, (parseFloat(qtyNeeded) || 0) - totalAllocated);
    const totalCost      = alloc.reduce((s, a) => s + (parseFloat(a.price) || 0) * (parseFloat(a.qty) || 0), 0);
    return { totalAllocated, shortfall, totalCost };
  }, [alloc, qtyNeeded]);

  const totalAvail = batches.reduce((s, b) => s + b.qtyAvailable, 0);
  const isOK    = stats.shortfall <= 0 && stats.totalAllocated > 0;
  const isShort = stats.shortfall > 0;

  if (!itemName || !warehouseId || !(parseFloat(qtyNeeded) > 0)) return null;

  return (
    <div ref={containerRef} className="relative mt-2">
      {/* Trigger */}
      <button type="button" disabled={disabled} onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${
          disabled   ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-300' :
          isShort    ? 'bg-red-50 border-red-200 text-red-600 hover:border-red-400' :
          isOK       ? 'bg-green-50 border-green-200 text-green-700' :
                       'bg-[#8da070]/5 border-[#8da070]/20 text-[#8da070] hover:border-[#8da070]/40'
        }`}>
        <div className="flex items-center gap-2 min-w-0">
          {loading ? <Loader2 size={12} className="animate-spin shrink-0" /> :
           isShort  ? <AlertCircle size={12} className="shrink-0 text-red-500" /> :
           isOK     ? <CheckCircle2 size={12} className="shrink-0 text-green-600" /> :
                      <Layers size={12} className="shrink-0" />}
          <span className="truncate">
            {loading  ? 'Memuat batch...' :
             isShort  ? `⚠ Kurang ${fmtQty(stats.shortfall)}` :
             isOK     ? `✓ ${alloc.length} batch · ${fmtQty(stats.totalAllocated)}` :
                        `Pilih batch FIFO`}
          </span>
          {stats.totalCost > 0 && (
            <span className="shrink-0 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[8px]">
              HPP {fmtRp(stats.totalCost)}
            </span>
          )}
        </div>
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
             style={{ maxHeight: 400 }}>

          {/* Header: mode toggle + search */}
          <div className="p-3 border-b border-gray-50 space-y-2">
            <div className="flex gap-1.5">
              <button type="button" onClick={() => { setMode('auto'); runAuto(batches, parseFloat(qtyNeeded) || 0); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                  mode === 'auto' ? 'bg-[#8da070] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                <Zap size={10} /> Auto FIFO
              </button>
              <button type="button" onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                  mode === 'manual' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                <Hand size={10} /> Manual
              </button>
              <button type="button" onClick={() => { setSearch(''); }}
                className="p-2 bg-gray-50 text-gray-400 hover:text-[#8da070] rounded-xl transition-all active:scale-90">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Cari batch, No PO, supplier..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#8da070]/20"
                value={search} onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()} />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-gray-400">
              <span>{batches.length} batch aktif</span>
              <span className="text-green-600">Avail: {fmtQty(totalAvail)}</span>
            </div>
          </div>

          {/* Batch list */}
          <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 260 }}>
            {loading ? (
              <div className="py-8 flex flex-col items-center gap-2 text-gray-300">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-[10px] font-bold uppercase">Memuat batch...</p>
              </div>
            ) : batches.length > 0 ? batches.map(batch => {
              const sel = alloc.find(a => a.batchId === batch.id);
              return (
                <div key={batch.id} className={`rounded-2xl border p-3 transition-all ${
                  sel ? 'border-[#8da070]/40 bg-[#8da070]/5' : batch.qtyAvailable <= 0 ? 'border-gray-100 opacity-50' : 'border-gray-100 bg-white hover:border-[#8da070]/30'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {batch.fifoPosition === 1 && (
                          <span className="text-[8px] font-black text-white bg-[#8da070] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <ArrowDown size={8} /> NEXT
                          </span>
                        )}
                        <span className="text-[10px] font-black text-[#8da070]">{batch.batchNo}</span>
                        <span className="text-[9px] text-gray-400 truncate">{batch.supplierName || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 mt-1.5 text-[8px] text-gray-400 font-bold">
                        <span>PO: {batch.noPO || '-'}</span>
                        <span>Harga: {batch.price !== "0" ? fmtRp(batch.price) : '-'}</span>
                        <span>Avail: {fmtQty(batch.qtyAvailable)} {batch.unit}</span>
                        <span>{new Date(batch.receivedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <QtyBar remaining={batch.qtyRemaining} initial={batch.qtyInitial} />
                    </div>
                    {mode === 'manual' && (
                      sel ? (
                        <button type="button" onClick={() => removeBatch(batch.id)}
                          className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-100 shrink-0 transition-all active:scale-90">
                          <X size={11} />
                        </button>
                      ) : (
                        <button type="button" onClick={() => addBatch(batch)}
                          disabled={batch.qtyAvailable <= 0}
                          className="px-2.5 py-1.5 bg-[#8da070] text-white rounded-lg text-[9px] font-black uppercase hover:bg-[#7a8c61] transition-all active:scale-95 disabled:opacity-40 shrink-0">
                          Pilih
                        </button>
                      )
                    )}
                  </div>
                  {/* Qty input saat manual + selected */}
                  {mode === 'manual' && sel && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#8da070]/20">
                      <span className="text-[9px] font-black text-[#8da070] uppercase">Qty:</span>
                      <input type="number" min="0.001" step="0.001" max={batch.qtyAvailable}
                        className="flex-1 px-2 py-1 bg-white border border-[#8da070]/30 rounded-lg text-[11px] font-black text-right text-gray-700 outline-none focus:ring-2 focus:ring-[#8da070]/20"
                        value={sel.qty}
                        onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n) && n > 0) changeQty(batch.id, Math.min(n, batch.qtyAvailable)); }}
                      />
                      <span className="text-[9px] text-gray-400 shrink-0">{batch.unit}</span>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="py-8 flex flex-col items-center gap-2 text-gray-200">
                <Box size={24} />
                <p className="text-[10px] font-bold uppercase">{search ? 'Tidak ditemukan' : 'Tidak ada batch aktif'}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {alloc.length > 0 && (
            <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase ${isShort ? 'text-red-600' : 'text-green-600'}`}>
                  {isShort ? `⚠ Kurang ${fmtQty(stats.shortfall)}` : `✓ ${fmtQty(stats.totalAllocated)} terpenuhi`}
                </p>
                {stats.totalCost > 0 && (
                  <p className="text-[9px] font-bold text-amber-600">HPP: {fmtRp(stats.totalCost)}</p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2 bg-[#8da070] text-white rounded-xl text-[9px] font-black uppercase hover:bg-[#7a8c61] active:scale-95">
                Selesai
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Item Row ─────────────────────────────────────────────────────────────────
const ItemRow = ({ item, index, stocks, warehouses, onUpdate, onRemove, canRemove }) => {
  const [openPicker, setOpenPicker] = useState(false);
  const [q, setQ] = useState('');
  const filtered = useMemo(() =>
    !q ? stocks.slice(0, 8) : stocks.filter(s => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [q, stocks]);

  const handleSelect = (s) => {
    onUpdate(index, { name: s.name, price: parseFloat(s.price) || 0, unit: s.unit || 'Unit',
                      stockAvailable: s.stock, batchAllocation: [], unitCost: 0, totalCost: 0 });
    setOpenPicker(false); setQ('');
  };

  const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) - (parseFloat(item.discount) || 0);
  const margin   = subtotal - (parseFloat(item.totalCost) || 0);
  const isShort  = item.batchAllocation?.length > 0
    ? item.batchAllocation.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0) < parseFloat(item.quantity)
    : false;

  return (
    <div className={`rounded-[24px] border p-4 transition-all ${isShort ? 'border-red-200 bg-red-50/20' : 'border-gray-100 bg-gray-50/50'}`}>
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)}
          className="float-right -mt-1 -mr-1 p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-full border border-red-100 transition-all z-10 active:scale-90">
          <Trash2 size={11} />
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 clear-both">
        {/* Product picker */}
        <div className="md:col-span-4 relative">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Produk *</label>
          <div onClick={() => setOpenPicker(p => !p)}
            className={`flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-all ${item.name ? 'border-[#8da070]/40' : 'border-gray-200'}`}>
            <Box size={12} className={item.name ? 'text-[#8da070]' : 'text-gray-300'} />
            <span className={`flex-1 text-xs font-bold uppercase truncate ${item.name ? 'text-gray-800' : 'text-gray-400'}`}>
              {item.name || 'Pilih produk...'}
            </span>
            <ChevronDown size={12} className="text-gray-300 shrink-0" />
          </div>
          {openPicker && (
            <div className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] flex flex-col">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus className="w-full text-gray-600 pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none"
                    placeholder="Cari produk..." value={q} onChange={e => setQ(e.target.value)}
                    onClick={e => e.stopPropagation()} />
                </div>
              </div>
              <div className="overflow-y-auto">
                {filtered.map(s => (
                  <div key={s.id} onClick={() => handleSelect(s)}
                    className="px-4 py-3 border-b text-gray-600 border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex justify-between items-center group transition-colors">
                    <div>
                      <p className="text-[11px] text-gray-600 font-black uppercase">{s.name}</p>
                      <p className="text-[9px] text-gray-800 opacity-60">{s.category}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded group-hover:bg-white/20 ${s.stock <= 0 ? 'text-red-400' : 'text-[#8da070] group-hover:text-white'}`}>
                      {s.stock <= 0 ? 'HABIS' : `${fmtQty(s.stock)} ${s.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Qty */}
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Qty *</label>
          <input type="number" min="0.01" step="any"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-center text-gray-700 outline-none focus:border-[#8da070]/40"
            value={item.quantity}
            onChange={e => onUpdate(index, { quantity: e.target.value, batchAllocation: [] })}
          />
        </div>

        {/* Harga jual */}
        <div className="md:col-span-3">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Harga Jual (Rp) *</label>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3">
            <span className="text-[10px] font-bold text-gray-400 mr-1">Rp</span>
            <input type="number" min="0" step="any"
              className="flex-1 w-full py-2.5 text-xs font-black text-gray-800 bg-transparent border-none focus:ring-0 text-right"
              value={item.price}
              onChange={e => onUpdate(index, { price: e.target.value })}
            />
          </div>
        </div>

        {/* Gudang sumber */}
        <div className="md:col-span-3">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 block">
            <Warehouse size={9} /> Gudang *
          </label>
          <select value={item.warehouseId || ''}
            onChange={e => onUpdate(index, { warehouseId: e.target.value, batchAllocation: [] })}
            className={`w-full px-3 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none appearance-none ${
              item.warehouseId ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}>
            <option value="">-- Gudang --</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Batch picker */}
      {item.name && item.warehouseId && parseFloat(item.quantity) > 0 && (
        <SalesBatchPicker
          itemName={item.name}
          warehouseId={item.warehouseId}
          qtyNeeded={parseFloat(item.quantity)}
          value={item.batchAllocation || []}
          onChange={(alloc, meta) => onUpdate(index, {
            batchAllocation: alloc,
            totalCost:       meta.totalCost || 0,
            unitCost:        parseFloat(item.quantity) > 0 ? (meta.totalCost || 0) / parseFloat(item.quantity) : 0,
          })}
        />
      )}

      {/* Subtotal & margin */}
      {subtotal > 0 && (
        <div className="mt-2 flex items-center gap-4 text-[9px]">
          <span className="font-bold text-gray-400">Subtotal:</span>
          <span className="font-black text-gray-800 italic">{fmtRp(subtotal)}</span>
          {item.totalCost > 0 && (
            <>
              <span className="font-bold text-gray-400">HPP:</span>
              <span className="font-black text-amber-600">{fmtRp(item.totalCost)}</span>
              <span className="font-bold text-gray-400">Margin:</span>
              <span className={`font-black ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtRp(margin)}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Modal
// =============================================================================
const AddSalesModal = ({ isOpen, onClose, onRefresh }) => {
  const { data: session }  = useSession();
  const [loading,   setLoading]   = useState(false);
  const [contacts,  setContacts]  = useState([]);
  const [stocks,    setStocks]    = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [saleType,  setSaleType]  = useState('REGULAR'); // 'REGULAR' | 'DIRECT'

  const [form, setForm] = useState({
    customerId: '', discountPct: 0, taxPct: 0, shippingCost: 0,
    paymentMethod: 'CASH', dueDate: '', notes: '', salesNotes: '',
    deliveryAddress: '', items: [{ ...EMPTY_ITEM }],
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/contacts?type=CUSTOMER').then(r => r.ok ? r.json() : []),
      fetch('/api/stock').then(r => r.ok ? r.json() : []),
      fetch('/api/warehouse').then(r => r.ok ? r.json() : []),
    ]).then(([c, s, w]) => { setContacts(c); setStocks(s); setWarehouses(w); })
      .catch(console.error);
  }, [isOpen]);

  const updateItem = useCallback((index, patch) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }, []);

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const calc = useMemo(() => {
    const subtotal = form.items.reduce((s, i) =>
      s + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0) - (parseFloat(i.discount) || 0), 0);
    const discVal  = subtotal * ((parseFloat(form.discountPct) || 0) / 100);
    const afterD   = subtotal - discVal;
    const taxVal   = afterD * ((parseFloat(form.taxPct) || 0) / 100);
    const total    = afterD + taxVal + (parseFloat(form.shippingCost) || 0);
    const totalHPP = form.items.reduce((s, i) => s + (parseFloat(i.totalCost) || 0), 0);
    const margin   = total - totalHPP;
    return { subtotal, discVal, taxVal, total, totalHPP, margin };
  }, [form]);

  const hasBatchIssue = form.items.some(i => {
    if (!i.name || !i.warehouseId || !(parseFloat(i.quantity) > 0)) return false;
    const alloc = i.batchAllocation || [];
    const allocd = alloc.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
    return allocd < parseFloat(i.quantity);
  });

  const isValid = form.items.every(i => i.name && parseFloat(i.quantity) > 0 && i.warehouseId)
    && !hasBatchIssue;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/penjualan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form, saleType,
          items: form.items.map(i => ({
            name:       i.name, quantity: parseFloat(i.quantity), price: parseFloat(i.price),
            unit:       i.unit, discount: parseFloat(i.discount) || 0, notes: i.notes,
            warehouseId: i.warehouseId, batchAllocation: i.batchAllocation || [],
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRefresh();
      onClose();
      setForm({ customerId: '', discountPct: 0, taxPct: 0, shippingCost: 0, paymentMethod: 'CASH',
                dueDate: '', notes: '', salesNotes: '', deliveryAddress: '', items: [{ ...EMPTY_ITEM }] });
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-t-[32px] lg:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] lg:max-h-[92vh] animate-in slide-in-from-bottom lg:zoom-in duration-300">

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#8da070] p-2.5 rounded-xl text-white shadow-lg shadow-[#8da070]/20">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Input Sales Order</h2>
              <p className="text-[9px] font-bold text-[#8da070] uppercase tracking-widest">FIFO · Batch Tracking · HPP Auto-Calc</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 md:p-6 space-y-6">

            {/* ── Sale Type toggle ──────────────────────────────────────────── */}
            <div className="p-4 bg-gradient-to-r from-[#8da070]/5 to-blue-50/30 rounded-2xl border border-[#8da070]/20">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Tipe Penjualan</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSaleType('REGULAR')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${saleType === 'REGULAR' ? 'border-[#8da070] bg-[#8da070]/5 shadow-lg shadow-[#8da070]/10' : 'border-gray-200 bg-white hover:border-[#8da070]/40'}`}>
                  <p className="text-[11px] font-black uppercase text-gray-800">Regular</p>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">4-tahap approval · Klien korporat</p>
                  {saleType === 'REGULAR' && <span className="mt-1 inline-block text-[8px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded">AKTIF</span>}
                </button>
                <button type="button" onClick={() => setSaleType('DIRECT')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${saleType === 'DIRECT' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                  <p className="text-[11px] font-black uppercase text-gray-800">Direct / Peternak Kecil</p>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">Langsung selesai · Tanpa approval</p>
                  {saleType === 'DIRECT' && <span className="mt-1 inline-block text-[8px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">AKTIF</span>}
                </button>
              </div>
              {saleType === 'DIRECT' && (
                <div className="flex items-start gap-2 mt-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-blue-600 leading-relaxed">
                    Penjualan Direct langsung selesai & memotong stok saat disimpan. Harga jual ditentukan admin sesuai arahan tim komersial. Data tetap tercatat lengkap.
                  </p>
                </div>
              )}
            </div>

            {/* ── Customer & info ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Pelanggan</label>
                <select
                  className="w-full text-slate-700 px-4 py-3.5 bg-gray-50 rounded-2xl border border-transparent focus:border-[#8da070]/30 focus:bg-white text-sm font-bold transition-all appearance-none"
                  value={form.customerId}
                  onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}>
                  <option value="">-- Pilih Pelanggan (opsional) --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Metode Pembayaran</label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_METHODS.map(m => (
                    <button type="button" key={m}
                      onClick={() => setForm(p => ({ ...p, paymentMethod: m }))}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        form.paymentMethod === m ? 'bg-[#8da070] text-white border-[#8da070] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#8da070]/40'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Items ────────────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Daftar Produk
                  <span className="px-2 py-0.5 bg-[#8da070]/10 text-[#8da070] text-[9px] rounded-lg">{form.items.length} item</span>
                </h3>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#8da070] text-white rounded-xl text-[10px] font-black uppercase shadow-md shadow-[#8da070]/20 hover:bg-[#7a8c61] active:scale-95">
                  <Plus size={13} strokeWidth={3} /> Tambah
                </button>
              </div>
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <ItemRow key={idx} item={item} index={idx}
                    stocks={stocks} warehouses={warehouses}
                    onUpdate={updateItem} onRemove={removeItem}
                    canRemove={form.items.length > 1}
                  />
                ))}
              </div>
              {hasBatchIssue && (
                <div className="flex items-center gap-2 p-3 mt-3 bg-red-50 border border-red-200 rounded-2xl">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-[11px] font-bold text-red-600">Alokasi batch FIFO tidak mencukupi untuk satu atau lebih item.</p>
                </div>
              )}
            </div>

            {/* ── Harga summary ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                  <Percent size={10} /> Diskon Order (%)
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4">
                  <input type="number" min="0" max="100" step="0.1"
                    className="flex-1 py-3.5 text-sm font-black text-gray-800 bg-transparent border-none focus:ring-0"
                    value={form.discountPct}
                    onChange={e => setForm(p => ({ ...p, discountPct: e.target.value }))}
                  />
                  <span className="text-[10px] font-black text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                  <Tag size={10} /> PPN
                </label>
                <div className="flex gap-2">
                  {TAX_OPTIONS.map(t => (
                    <button type="button" key={t.value}
                      onClick={() => setForm(p => ({ ...p, taxPct: t.value }))}
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                        parseFloat(form.taxPct) === t.value ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                  <Truck size={10} /> Ongkir (Rp)
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4">
                  <span className="text-[10px] font-bold text-gray-400 mr-1">Rp</span>
                  <input type="number" min="0"
                    className="flex-1 py-3.5 text-sm font-black text-gray-800 bg-transparent border-none focus:ring-0 text-right"
                    value={form.shippingCost}
                    onChange={e => setForm(p => ({ ...p, shippingCost: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* ── Grand Total ───────────────────────────────────────────────── */}
            <div className="bg-gray-900 rounded-[28px] p-6 space-y-2">
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                {calc.discVal > 0 && (
                  <><span className="font-bold text-gray-500 uppercase">Diskon ({form.discountPct}%)</span>
                    <span className="text-right font-black text-orange-400 italic">-{fmtRp(calc.discVal)}</span></>
                )}
                {calc.taxVal > 0 && (
                  <><span className="font-bold text-gray-500 uppercase">PPN ({form.taxPct}%)</span>
                    <span className="text-right font-black text-blue-400 italic">{fmtRp(calc.taxVal)}</span></>
                )}
                {calc.totalHPP > 0 && (
                  <><span className="font-bold text-gray-500 uppercase">Est. HPP</span>
                    <span className="text-right font-black text-amber-400 italic">{fmtRp(calc.totalHPP)}</span></>
                )}
                {calc.totalHPP > 0 && (
                  <><span className="font-bold text-gray-500 uppercase">Est. Margin</span>
                    <span className={`text-right font-black italic ${calc.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtRp(calc.margin)}
                    </span></>
                )}
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Grand Total</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">
                  <span className="text-sm font-normal text-gray-500 mr-2 not-italic">Rp</span>
                  {calc.total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* ── Catatan ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Catatan Customer</label>
                <textarea rows={2} placeholder="Catatan di invoice..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-medium text-gray-700 outline-none resize-none"
                  value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Catatan Internal</label>
                <textarea rows={2} placeholder="Catatan internal (tidak tercetak)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-medium text-gray-700 outline-none resize-none"
                  value={form.salesNotes} onChange={e => setForm(p => ({ ...p, salesNotes: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 active:scale-95">
              Batal
            </button>
            <button type="submit" disabled={loading || !isValid}
              className="flex-[3] flex items-center justify-center gap-2 px-10 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#8da070]/30 hover:bg-[#7a8c61] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {loading ? 'Menyimpan...' : saleType === 'DIRECT'
                ? `Simpan & Selesaikan · ${fmtRp(calc.total)}`
                : `Kirim ke Approval · ${fmtRp(calc.total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesModal;