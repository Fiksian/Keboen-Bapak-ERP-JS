'use client';

// ─────────────────────────────────────────────────────────────────────────────
// BatchPicker.js
// Komponen dropdown canggih untuk memilih batch FIFO pada form produksi.
//
// Props:
//   itemName      : string  — nama bahan baku
//   warehouseId   : string  — ID gudang sumber
//   qtyNeeded     : number  — qty total yang dibutuhkan
//   value         : array   — allocations saat ini [{ batchId, batchNo, qty, price, supplier, noPO, receivedAt }]
//   onChange      : fn(allocations, meta) — callback saat alokasi berubah
//                   meta = { totalAllocated, shortfall, totalCost, unitPrice }
//   mode          : 'auto' | 'manual'  — default 'auto'
//   disabled      : boolean
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Layers, Search, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Loader2, Zap, Hand, RefreshCw, X,
  ArrowDown, Tag, Calendar, Truck, Hash, Package
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtQty = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 });
const fmtRp  = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// ─── Status chip ──────────────────────────────────────────────────────────────
const QtyBar = ({ current, total, reserved }) => {
  if (!total) return null;
  const pctRemain   = Math.min(100, (current / total) * 100);
  const pctReserved = Math.min(100, ((reserved || 0) / total) * 100);
  const available   = current - (reserved || 0);
  const pctAvail    = Math.min(100, (available / total) * 100);

  return (
    <div className="space-y-1">
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
        <div className="h-full bg-amber-200 rounded-full absolute left-0"
             style={{ width: `${pctRemain}%` }} />
        <div className="h-full bg-green-400 rounded-full absolute left-0"
             style={{ width: `${pctAvail}%` }} />
        {pctReserved > 0 && (
          <div className="h-full bg-blue-300 rounded-full absolute"
               style={{ left: `${pctAvail}%`, width: `${pctReserved}%` }} />
        )}
      </div>
      <div className="flex justify-between text-[8px] font-bold text-gray-400">
        <span className="text-green-600">Avail: {fmtQty(available)}</span>
        {reserved > 0 && <span className="text-blue-500">Reserved: {fmtQty(reserved)}</span>}
        <span>Total: {fmtQty(current)}</span>
      </div>
    </div>
  );
};

// ─── Single batch row di dropdown ────────────────────────────────────────────
const BatchOption = ({ batch, isSelected, allocatedQty, qtyNeeded, onAdd, onRemove, onQtyChange, selectionMode }) => {
  const [inputQty, setInputQty] = useState(allocatedQty || '');

  useEffect(() => {
    setInputQty(allocatedQty || '');
  }, [allocatedQty]);

  const isFirst = batch.fifoPosition === 1;

  return (
    <div className={`border rounded-2xl p-3.5 transition-all ${
      isSelected
        ? 'border-indigo-300 bg-indigo-50/40 shadow-sm'
        : batch.qtyAvailable <= 0
          ? 'border-gray-100 bg-gray-50/50 opacity-60'
          : 'border-gray-100 bg-white hover:border-indigo-200 cursor-pointer'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {isFirst && (
            <span className="shrink-0 flex items-center gap-1 text-[8px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded-md uppercase">
              <ArrowDown size={8} /> NEXT OUT
            </span>
          )}
          <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded truncate">
            {batch.batchNo}
          </span>
          {batch.qtyAvailable <= 0 && (
            <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">Habis</span>
          )}
        </div>

        {/* Action button */}
        {selectionMode === 'manual' && (
          <div className="shrink-0">
            {isSelected ? (
              <button type="button" onClick={onRemove}
                className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-100 transition-all active:scale-90">
                <X size={12} />
              </button>
            ) : (
              <button type="button" onClick={() => onAdd(batch)}
                disabled={batch.qtyAvailable <= 0}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                Pilih
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2.5">
        {[
          { icon: Truck,    label: 'Supplier', value: batch.supplierName },
          { icon: Hash,     label: 'No PO',    value: batch.noPO         },
          { icon: Calendar, label: 'Masuk',    value: fmtDate(batch.receivedAt) },
          { icon: Tag,      label: 'Harga',    value: batch.price !== "0" ? fmtRp(batch.price) : '-' },
        ].map((info, i) => (
          <div key={i} className="min-w-0">
            <p className="text-[7px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-0.5">
              <info.icon size={7} /> {info.label}
            </p>
            <p className="text-[10px] font-bold text-gray-700 truncate">{info.value || '-'}</p>
          </div>
        ))}
      </div>

      {/* Qty bar */}
      <QtyBar current={batch.qtyRemaining} total={batch.qtyInitial} reserved={batch.reservedQty} />

      {/* Qty input saat manual + sudah dipilih */}
      {selectionMode === 'manual' && isSelected && (
        <div className="mt-2.5 flex items-center gap-2 pt-2.5 border-t border-indigo-100">
          <label className="text-[9px] font-black text-indigo-600 uppercase tracking-wider shrink-0">Qty Ambil:</label>
          <input
            type="number" min="0.001" step="0.001"
            max={batch.qtyAvailable}
            className="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-[11px] font-black text-indigo-700 text-right outline-none focus:ring-2 focus:ring-indigo-200"
            value={inputQty}
            onChange={e => {
              const v = e.target.value;
              setInputQty(v);
              const n = parseFloat(v);
              if (!isNaN(n) && n > 0) {
                onQtyChange(batch.id, Math.min(n, batch.qtyAvailable));
              }
            }}
          />
          <span className="text-[9px] font-black text-gray-400 uppercase shrink-0">{batch.unit}</span>
          <span className="text-[8px] text-gray-400 shrink-0">
            / {fmtQty(batch.qtyAvailable)} avail
          </span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BatchPicker — main component
// ═══════════════════════════════════════════════════════════════════════════
const BatchPicker = ({
  itemName,
  warehouseId,
  qtyNeeded = 0,
  value       = [],
  onChange,
  mode        = 'auto',
  disabled    = false,
}) => {
  const [batches,        setBatches]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [open,           setOpen]           = useState(false);
  const [selectionMode,  setSelectionMode]  = useState(mode); // 'auto' | 'manual'
  const [searchQuery,    setSearchQuery]    = useState('');
  const [allocations,    setAllocations]    = useState(value);
  const containerRef = useRef(null);

  // ── Fetch batches ─────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    if (!itemName || !warehouseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        item:        itemName,
        warehouseId,
        status:      'ACTIVE',
        ...(searchQuery ? { q: searchQuery } : {}),
      });
      const res  = await fetch(`/api/stock/batch?${params}`);
      const json = await res.json();
      const sorted = (json.batches || [])
        .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
        .map((b, i) => ({ ...b, fifoPosition: i + 1 }));
      setBatches(sorted);
    } catch (err) { console.error('BatchPicker fetch error:', err); }
    finally { setLoading(false); }
  }, [itemName, warehouseId, searchQuery]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => { setAllocations(value); }, [value]);

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Auto-FIFO allocation ──────────────────────────────────────────────────
  const runAutoFIFO = useCallback((batchList, needed) => {
    let rem = parseFloat(needed) || 0;
    const alloc = [];
    for (const b of batchList) {
      if (rem <= 0) break;
      const take = Math.min(rem, b.qtyAvailable || b.qtyRemaining);
      if (take <= 0) continue;
      alloc.push({
        batchId:   b.id,
        batchNo:   b.batchNo,
        qty:       parseFloat(take.toFixed(6)),
        price:     b.price || "0",
        supplier:  b.supplierName || "-",
        noPO:      b.noPO         || "-",
        receivedAt: b.receivedAt,
      });
      rem -= take;
    }
    return { alloc, shortfall: Math.max(0, rem) };
  }, []);

  // ── Ketika mode auto atau qty berubah, re-hitung otomatis ─────────────────
  useEffect(() => {
    if (selectionMode !== 'auto' || !batches.length || !qtyNeeded) return;
    const { alloc, shortfall } = runAutoFIFO(batches, qtyNeeded);
    setAllocations(alloc);
    emitChange(alloc, shortfall);
  }, [selectionMode, batches, qtyNeeded]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalAllocated = allocations.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
    const shortfall      = Math.max(0, (parseFloat(qtyNeeded) || 0) - totalAllocated);
    const totalCost      = allocations.reduce((s, a) => s + (parseFloat(a.price) || 0) * (parseFloat(a.qty) || 0), 0);
    const unitPrice      = totalAllocated > 0 ? totalCost / totalAllocated : 0;
    const totalAvail     = batches.reduce((s, b) => s + (b.qtyAvailable ?? b.qtyRemaining), 0);
    return { totalAllocated, shortfall, totalCost, unitPrice, totalAvail };
  }, [allocations, qtyNeeded, batches]);

  const emitChange = (alloc, shortfall = stats.shortfall) => {
    const total    = alloc.reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
    const cost     = alloc.reduce((s, a) => s + (parseFloat(a.price) || 0) * (parseFloat(a.qty) || 0), 0);
    const uprice   = total > 0 ? cost / total : 0;
    onChange?.(alloc, { totalAllocated: total, shortfall, totalCost: cost, unitPrice: uprice });
  };

  // ── Manual: tambah batch ke alokasi ──────────────────────────────────────
  const handleAddBatch = (batch) => {
    const existing = allocations.find(a => a.batchId === batch.id);
    if (existing) return;
    const suggestQty = Math.min(
      batch.qtyAvailable ?? batch.qtyRemaining,
      Math.max(0, (parseFloat(qtyNeeded) || 0) - stats.totalAllocated)
    );
    const newAlloc = [
      ...allocations,
      {
        batchId:    batch.id,
        batchNo:    batch.batchNo,
        qty:        parseFloat(suggestQty.toFixed(6)),
        price:      batch.price || "0",
        supplier:   batch.supplierName || "-",
        noPO:       batch.noPO || "-",
        receivedAt: batch.receivedAt,
      },
    ];
    setAllocations(newAlloc);
    emitChange(newAlloc);
  };

  // ── Manual: hapus batch dari alokasi ─────────────────────────────────────
  const handleRemoveBatch = (batchId) => {
    const newAlloc = allocations.filter(a => a.batchId !== batchId);
    setAllocations(newAlloc);
    emitChange(newAlloc);
  };

  // ── Manual: ubah qty alokasi ─────────────────────────────────────────────
  const handleQtyChange = (batchId, qty) => {
    const newAlloc = allocations.map(a =>
      a.batchId === batchId ? { ...a, qty: parseFloat(qty.toFixed(6)) } : a
    );
    setAllocations(newAlloc);
    emitChange(newAlloc);
  };

  // ── Filtered batches dari search ──────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    if (!searchQuery) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(b =>
      b.batchNo?.toLowerCase().includes(q) ||
      b.noPO?.toLowerCase().includes(q) ||
      b.supplierName?.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  if (!itemName || !warehouseId) return null;

  const isOK      = stats.shortfall <= 0 && stats.totalAllocated > 0;
  const isShort   = stats.shortfall > 0;
  const hasAlloc  = allocations.length > 0;

  return (
    <div ref={containerRef} className="relative">

      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${
          disabled   ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-300' :
          isShort    ? 'bg-red-50 border-red-200 text-red-600 hover:border-red-400' :
          isOK       ? 'bg-green-50 border-green-200 text-green-700 hover:border-green-400' :
                       'bg-indigo-50 border-indigo-100 text-indigo-600 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {loading ? (
            <Loader2 size={12} className="animate-spin shrink-0" />
          ) : isShort ? (
            <AlertTriangle size={12} className="shrink-0 text-red-500" />
          ) : isOK ? (
            <CheckCircle2 size={12} className="shrink-0 text-green-600" />
          ) : (
            <Layers size={12} className="shrink-0" />
          )}
          <span className="truncate">
            {loading    ? 'Memuat batch...' :
             isShort    ? `⚠ Kurang ${fmtQty(stats.shortfall)} — ${allocations.length} batch dipilih` :
             isOK       ? `✓ ${allocations.length} batch · ${fmtQty(stats.totalAllocated)}` :
             hasAlloc   ? `${allocations.length} batch dipilih` :
                          `Pilih batch FIFO`}
          </span>
          {!loading && stats.totalCost > 0 && (
            <span className="shrink-0 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[8px]">
              {fmtRp(stats.totalCost)}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-indigo-100 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
             style={{ maxHeight: '420px' }}>

          {/* Mode toggle + search */}
          <div className="p-3 border-b border-gray-50 space-y-2">
            {/* Mode toggle */}
            <div className="flex gap-1.5">
              <button type="button"
                onClick={() => {
                  setSelectionMode('auto');
                  const { alloc, shortfall } = runAutoFIFO(batches, qtyNeeded);
                  setAllocations(alloc);
                  emitChange(alloc, shortfall);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                  selectionMode === 'auto'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}>
                <Zap size={11} /> Auto FIFO
              </button>
              <button type="button"
                onClick={() => setSelectionMode('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                  selectionMode === 'manual'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}>
                <Hand size={11} /> Manual
              </button>
              <button type="button" onClick={fetchBatches}
                className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all active:scale-90">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Cari batch, No PO, supplier..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Summary stats */}
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-400">
              <span>{filteredBatches.length} batch ditemukan</span>
              <span className="text-green-600">Total avail: {fmtQty(stats.totalAvail)}</span>
            </div>
          </div>

          {/* Batch list */}
          <div className="overflow-y-auto p-3 space-y-2.5" style={{ maxHeight: '280px' }}>
            {loading ? (
              <div className="py-8 flex flex-col items-center gap-2 text-gray-300">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-[10px] font-bold uppercase">Memuat batch...</p>
              </div>
            ) : filteredBatches.length > 0 ? (
              filteredBatches.map((batch) => {
                const alloc = allocations.find(a => a.batchId === batch.id);
                return (
                  <BatchOption
                    key={batch.id}
                    batch={batch}
                    isSelected={!!alloc}
                    allocatedQty={alloc?.qty}
                    qtyNeeded={qtyNeeded}
                    selectionMode={selectionMode}
                    onAdd={handleAddBatch}
                    onRemove={() => handleRemoveBatch(batch.id)}
                    onQtyChange={handleQtyChange}
                  />
                );
              })
            ) : (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-200">
                <Package size={28} />
                <p className="text-[10px] font-bold uppercase">
                  {searchQuery ? 'Tidak ditemukan' : 'Tidak ada batch aktif'}
                </p>
              </div>
            )}
          </div>

          {/* Footer summary */}
          {hasAlloc && (
            <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className={`text-[10px] font-black uppercase ${isShort ? 'text-red-600' : 'text-green-600'}`}>
                  {isShort
                    ? `⚠ Kurang ${fmtQty(stats.shortfall)}`
                    : `✓ Terpenuhi ${fmtQty(stats.totalAllocated)}`}
                </p>
                {stats.totalCost > 0 && (
                  <p className="text-[9px] font-bold text-amber-600">
                    Biaya: {fmtRp(stats.totalCost)} · HPP: {fmtRp(stats.unitPrice)}/unit
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md hover:bg-indigo-700 transition-all active:scale-95">
                Selesai
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchPicker;
