'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Package, Plus, Trash2, Database, Loader2,
  AlertTriangle, CheckCircle2, Info, Warehouse, ChevronDown
} from 'lucide-react';
import BatchPicker from './BatchPicker';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtRp  = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtQty = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

const EMPTY_ING = {
  itemName: '', qtyNeeded: '', unit: 'KG', warehouseId: '',
  batchAllocation: [], unitPrice: 0, totalPrice: 0, stockAvailable: 0,
};

// ─── Baris satu komponen bahan baku ──────────────────────────────────────────
const IngredientRow = ({ ing, index, stocks, warehouses, onUpdate, onRemove, canRemove }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState('');

  const filtered = useMemo(() =>
    !searchVal ? stocks.slice(0, 10)
    : stocks.filter(s => s.name.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 10),
    [searchVal, stocks]
  );

  const handleSelectStock = (item) => {
    onUpdate(index, {
      itemName:       item.name,
      unit:           item.unit || 'KG',
      stockAvailable: item.stock,
      batchAllocation: [], // reset alokasi saat ganti item
      unitPrice:      0,
      totalPrice:     0,
    });
    setSearchOpen(false);
    setSearchVal('');
  };

  const handleBatchChange = (alloc, meta) => {
    onUpdate(index, {
      batchAllocation: alloc,
      unitPrice:       meta.unitPrice   || 0,
      totalPrice:      meta.totalCost   || 0,
    });
  };

  const allocTotal = (ing.batchAllocation || []).reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
  const qty        = parseFloat(ing.qtyNeeded) || 0;
  const isShort    = qty > 0 && allocTotal < qty && ing.itemName && ing.warehouseId;

  return (
    <div className={`rounded-[20px] border p-4 transition-all ${isShort ? 'border-red-200 bg-red-50/20' : 'border-slate-100 bg-slate-50/30'}`}>
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)}
          className="float-right -mt-1 -mr-1 p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-full border border-red-100 transition-all active:scale-90">
          <Trash2 size={11} />
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 clear-both">
        {/* ── Nama bahan ─────────────────────────────────────────────────── */}
        <div className="md:col-span-4 relative">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Bahan Baku *</label>
          <div className="relative">
            <input
              placeholder="Cari bahan..."
              value={ing.itemName || searchVal}
              className="w-full pl-3 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 uppercase outline-none focus:border-indigo-400 transition-all"
              onChange={e => { setSearchVal(e.target.value); onUpdate(index, { itemName: e.target.value }); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
            />
          </div>
          {searchOpen && (
            <div className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
              {filtered.map(s => (
                <button key={s.id} type="button" onClick={() => handleSelectStock(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors">
                  <p className="text-[11px] font-black text-slate-700 uppercase">{s.name}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">Stok: {fmtQty(s.stock)} {s.unit} · {s.category}</p>
                </button>
              ))}
              {filtered.length === 0 && <p className="p-4 text-center text-[10px] text-slate-300 italic">Tidak ditemukan</p>}
            </div>
          )}
        </div>

        {/* ── Qty ────────────────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Qty *</label>
          <input type="number" min="0.01" step="any"
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-center text-slate-700 outline-none focus:border-indigo-400"
            value={ing.qtyNeeded || ''}
            onChange={e => onUpdate(index, { qtyNeeded: e.target.value, batchAllocation: [] })}
          />
        </div>

        {/* ── Unit ───────────────────────────────────────────────────────── */}
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Unit</label>
          <select value={ing.unit || 'KG'}
            onChange={e => onUpdate(index, { unit: e.target.value })}
            className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase outline-none appearance-none text-center">
            {['KG','GR','TON','LITER','ML','UNIT','SAK'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {/* ── Gudang sumber ──────────────────────────────────────────────── */}
        <div className="md:col-span-4">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 block">
            <Warehouse size={9} /> Gudang Sumber *
          </label>
          <select value={ing.warehouseId || ''}
            onChange={e => onUpdate(index, { warehouseId: e.target.value, batchAllocation: [] })}
            className={`w-full px-3 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none appearance-none ${
              ing.warehouseId ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-slate-50 border border-slate-200 text-slate-400'
            }`}>
            <option value="">-- Pilih Gudang --</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── BatchPicker (hanya tampil jika bahan + gudang sudah dipilih) ── */}
      {ing.itemName && ing.warehouseId && parseFloat(ing.qtyNeeded) > 0 && (
        <div className="mt-3">
          <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
            Alokasi Batch FIFO
          </label>
          <BatchPicker
            itemName={ing.itemName}
            warehouseId={ing.warehouseId}
            qtyNeeded={parseFloat(ing.qtyNeeded) || 0}
            value={ing.batchAllocation || []}
            onChange={handleBatchChange}
          />
        </div>
      )}

      {/* ── HPP baris ─────────────────────────────────────────────────────── */}
      {ing.totalPrice > 0 && (
        <div className="mt-2 flex items-center gap-3 text-[9px]">
          <span className="font-bold text-slate-400">HPP bahan:</span>
          <span className="font-black text-indigo-600">{fmtRp(ing.totalPrice)}</span>
          <span className="text-slate-300">·</span>
          <span className="text-amber-600">{fmtRp(ing.unitPrice)}/unit</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Modal
// =============================================================================
const ProductionModal = ({ isOpen, onClose, onSubmit }) => {
  const [ingredients, setIngredients] = useState([{ ...EMPTY_ING }]);
  const [stocks,      setStocks]      = useState([]);
  const [warehouses,  setWarehouses]  = useState([]);
  const [targetQty,   setTargetQty]   = useState(1);
  const [targetUnit,  setTargetUnit]  = useState('UNIT');
  const [productName, setProd]        = useState('');
  const [prodDate,    setProdDate]    = useState('');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/stock').then(r => r.ok ? r.json() : []),
      fetch('/api/warehouse').then(r => r.ok ? r.json() : []),
    ]).then(([s, w]) => { setStocks(s); setWarehouses(w); })
      .catch(console.error);
  }, [isOpen]);

  const updateIng = useCallback((index, patch) => {
    setIngredients(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const addIng    = () => setIngredients(p => [...p, { ...EMPTY_ING }]);
  const removeIng = (i) => setIngredients(p => p.filter((_, idx) => idx !== i));

  // ── Live kalkulasi HPP dan rendemen ───────────────────────────────────────
  const calc = useMemo(() => {
    const totalCost   = ingredients.reduce((s, i) => s + (parseFloat(i.totalPrice) || 0), 0);
    const totalInput  = ingredients.reduce((s, i) => s + (parseFloat(i.qtyNeeded)  || 0), 0);
    const tQty        = parseFloat(targetQty) || 0;
    const hpp         = tQty > 0 ? totalCost / tQty : 0;
    const rendemen    = totalInput > 0 ? (tQty / totalInput) * 100 : 0;
    const lossWarn    = totalInput > 0 && rendemen < 95;

    // Validasi: semua bahan harus punya alokasi yang cukup
    const missingAlloc = ingredients.filter(i => {
      if (!i.itemName || !i.warehouseId) return false;
      const qty  = parseFloat(i.qtyNeeded) || 0;
      if (qty <= 0) return false;
      const allc = (i.batchAllocation || []).reduce((s, a) => s + (parseFloat(a.qty) || 0), 0);
      return allc < qty;
    });

    return { totalCost, hpp, rendemen, lossWarn, missingAlloc };
  }, [ingredients, targetQty]);

  const isValid = productName.trim()
    && parseFloat(targetQty) > 0
    && prodDate
    && ingredients.every(i => i.itemName && parseFloat(i.qtyNeeded) > 0 && i.warehouseId)
    && calc.missingAlloc.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await onSubmit({
        productName,
        targetQty:   parseFloat(targetQty),
        targetUnit,
        date:        prodDate,
        ingredients: ingredients.map(i => ({
          ...i,
          qtyNeeded: parseFloat(i.qtyNeeded),
          itemName:  i.itemName.toUpperCase(),
          unit:      i.unit.toUpperCase(),
          batchAllocation: i.batchAllocation || [],
        })),
      });
      // Reset
      setIngredients([{ ...EMPTY_ING }]);
      setProd(''); setTargetQty(1); setTargetUnit('UNIT'); setProdDate('');
    } catch (err) { console.error(err); alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] sm:max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in duration-300">

        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">New Production Batch</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">FIFO Auto/Manual · 4-Stage Approval · HPP Auto-Calc</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 active:scale-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form id="prod-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7 custom-scrollbar">

          {/* ── Info produk ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block italic">Nama Barang Jadi *</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input type="text" required
                  className="w-full text-slate-700 pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white text-sm font-bold uppercase transition-all"
                  placeholder="Contoh: PAKAN BROILER STARTER..."
                  value={productName}
                  onChange={e => setProd(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block italic">Output Qty *</label>
              <input type="number" step="0.01" required min="0.01"
                className="w-full text-slate-700 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold"
                value={targetQty} onChange={e => setTargetQty(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block italic">Unit Output</label>
              <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)}
                className="w-full text-indigo-600 px-4 py-3.5 bg-indigo-50/30 border border-indigo-100 rounded-2xl outline-none text-sm font-black uppercase appearance-none">
                {['UNIT','KG','TON','SAK','LITER'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block italic">Tanggal Produksi *</label>
              <input type="date" required
                className="w-full text-slate-700 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
                value={prodDate} onChange={e => setProdDate(e.target.value)} />
            </div>
          </div>

          {/* ── Bill of Materials ────────────────────────────────────────── */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 italic">
                <Database size={14} className="text-indigo-600" /> Bill of Materials
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] rounded-lg">{ingredients.length} item</span>
              </h3>
              <button type="button" onClick={addIng}
                className="text-[9px] font-black bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 transition-all uppercase italic flex items-center gap-1.5 shadow-lg shadow-indigo-100 active:scale-90">
                <Plus size={12} strokeWidth={3} /> Add
              </button>
            </div>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <IngredientRow key={idx} ing={ing} index={idx}
                  stocks={stocks} warehouses={warehouses}
                  onUpdate={updateIng} onRemove={removeIng}
                  canRemove={ingredients.length > 1}
                />
              ))}
            </div>
          </div>

          {/* ── HPP Summary ──────────────────────────────────────────────── */}
          <div className="rounded-[24px] bg-slate-900 p-6 space-y-3">
            <div className="grid grid-cols-2 gap-y-2 text-[11px]">
              {[
                { label: 'Total Biaya Bahan', value: fmtRp(calc.totalCost),  color: 'text-white'   },
                { label: `Output Target`,     value: `${fmtQty(targetQty)} ${targetUnit}`, color: 'text-indigo-400' },
                { label: 'HPP / Unit (Est.)', value: fmtRp(calc.hpp),         color: 'text-amber-400' },
                ...(calc.rendemen > 0 ? [{ label: 'Rendemen', value: `${calc.rendemen.toFixed(1)}%`, color: calc.lossWarn ? 'text-red-400' : 'text-green-400' }] : []),
              ].map((r, i) => (
                <React.Fragment key={i}>
                  <span className="font-bold text-slate-500 uppercase tracking-wider">{r.label}</span>
                  <span className={`text-right font-black italic ${r.color}`}>{r.value}</span>
                </React.Fragment>
              ))}
            </div>

            {calc.lossWarn && (
              <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/40 rounded-xl">
                <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-red-300">Loss melebihi 5% ({calc.rendemen.toFixed(1)}%). Periksa formulasi.</p>
              </div>
            )}
            {calc.missingAlloc.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/40 rounded-xl">
                <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-red-300">
                  Alokasi batch kurang untuk: {calc.missingAlloc.map(i => i.itemName).join(', ')}.
                </p>
              </div>
            )}
          </div>

          {/* ── Info flow approval ────────────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
              Setelah submit, batch masuk <strong>PENDING QC</strong>. Stok dicadangkan (soft-reserve) saat QC approve.
              Pemotongan permanen terjadi saat Manager final approve dan memilih gudang.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 sm:p-7 border-t border-slate-50 flex flex-col sm:flex-row gap-3 bg-slate-50/30 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 px-6 py-4 border border-slate-100 bg-white text-slate-400 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all italic">
            Discard
          </button>
          <button type="submit" form="prod-form" disabled={loading || !isValid}
            className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 italic disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <><Loader2 className="animate-spin" size={16} /> Processing...</>
              : `Submit · HPP Est. ${fmtRp(calc.hpp)}/unit`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionModal;
