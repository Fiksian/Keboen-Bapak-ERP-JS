// /app/(Main)/Pakan/page.js — v2
// Feeding & Ration Management
// Bahan pakan langsung dari Stock per warehouse — tidak ada FeedIngredient model
// Tab 1: Formulasi Ransum
// Tab 2: Jadwal Pemberian Pakan
// Tab 3: Log Konsumsi
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils, Layers, CalendarDays, ClipboardList,
  Scale, Plus, X, CheckCircle2, AlertTriangle,
  RefreshCw, Loader2, ChevronDown, Trash2,
  TrendingDown, TrendingUp, Package, Clock,
  Warehouse, Beef, DollarSign, BarChart3,
  Check, Activity,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// ─── Helpers ──────────────────────────────────────────────────
const fmtKg   = (v) => v != null ? `${parseFloat(v).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg` : '-';
const fmtRp   = (v) => v != null ? `Rp ${parseFloat(v).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '-';
const fmtPct  = (v) => v != null ? `${parseFloat(v).toFixed(1)}%` : '-';
const fmtDT   = (dt) => dt
  ? new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '-';

const SCH_STATUS = {
  SCHEDULED  : { label: 'Terjadwal', bg: 'bg-slate-50',  text: 'text-slate-600', border: 'border-slate-200'  },
  IN_PROGRESS: { label: 'Berlangsung',bg:'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200'   },
  COMPLETED  : { label: 'Selesai',    bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200'  },
  SKIPPED    : { label: 'Dilewati',   bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200'  },
};
const Pill = ({ status }) => {
  const c = SCH_STATUS[status] || SCH_STATUS.SCHEDULED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

const STOCK_STATUS_COLOR = {
  READY  : 'text-green-600',
  LIMITED: 'text-amber-600',
  EMPTY  : 'text-red-500',
  UNKNOWN: 'text-slate-300',
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Buat Formula Ransum
// Bahan baku diambil dari GET /api/stock?warehouseId=...
// ═══════════════════════════════════════════════════════════════
const RationFormulaModal = ({ isOpen, onClose, onSuccess, warehouses }) => {
  const [name,          setName]          = useState('');
  const [description,   setDescription]   = useState('');
  const [targetKgPerHead,setTargetKgPerHead] = useState('');
  const [stockWarehouseId, setStockWarehouseId] = useState('');
  const [stockItems,    setStockItems]    = useState([]); // dari /api/stock
  const [loadingStock,  setLoadingStock]  = useState(false);
  const [ingredients,   setIngredients]   = useState([]); // bahan yang dipilih
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState(null);

  // Fetch stok dari warehouse terpilih
  useEffect(() => {
    if (!stockWarehouseId) { setStockItems([]); return; }
    setLoadingStock(true);
    // GET /api/stock mengembalikan list Stock, filter by warehouseId
    // Stock memiliki: id, name, stock, unit, price, status, warehouseId, category
    fetch(`/api/stock?warehouseId=${stockWarehouseId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        // Filter hanya yang ada stok (bukan EMPTY) dan type STOCKS/PAKAN
        const feedStocks = Array.isArray(data) ? data.filter((s) => s.stock > 0) : [];
        setStockItems(feedStocks);
      })
      .catch(console.error)
      .finally(() => setLoadingStock(false));
  }, [stockWarehouseId]);

  const reset = () => {
    setName(''); setDescription(''); setTargetKgPerHead('');
    setStockWarehouseId(''); setStockItems([]); setIngredients([]); setMsg(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const addIngredient = () =>
    setIngredients((p) => [...p, { itemName: '', warehouseId: stockWarehouseId, qtyKgPerBatch: '', priceSnapshot: 0, unit: 'KG', stockQty: 0 }]);

  const updateIng = (idx, field, value) => {
    setIngredients((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'itemName') {
        const stock = stockItems.find((s) => s.name === value);
        if (stock) {
          next[idx].priceSnapshot = parseFloat(stock.price) || 0;
          next[idx].unit          = stock.unit || 'KG';
          next[idx].stockQty      = stock.stock || 0;
          next[idx].warehouseId   = stock.warehouseId || stockWarehouseId;
        }
      }
      return next;
    });
  };

  const removeIng = (idx) => setIngredients((p) => p.filter((_, i) => i !== idx));

  // Live cost calc
  const totalIngKg     = ingredients.reduce((s, i) => s + (parseFloat(i.qtyKgPerBatch) || 0), 0);
  const totalCostBatch = ingredients.reduce((s, i) => s + (parseFloat(i.qtyKgPerBatch) || 0) * (i.priceSnapshot || 0), 0);
  const costPerKg      = totalIngKg > 0 ? totalCostBatch / totalIngKg : 0;

  const handleSubmit = async () => {
    if (!name.trim())           { setMsg({ type: 'err', text: 'Nama formula wajib.' }); return; }
    if (!ingredients.length)    { setMsg({ type: 'err', text: 'Tambah minimal 1 bahan.' }); return; }
    if (ingredients.some((i) => !i.itemName || !parseFloat(i.qtyKgPerBatch))) {
      setMsg({ type: 'err', text: 'Lengkapi semua bahan (pilih nama & isi qty > 0).' }); return;
    }
    // Cek stok cukup
    const overStock = ingredients.filter((i) => parseFloat(i.qtyKgPerBatch) > i.stockQty && i.stockQty > 0);
    if (overStock.length > 0) {
      setMsg({ type: 'err', text: `Stok kurang untuk: ${overStock.map((i) => i.itemName).join(', ')}. Kurangi qty atau pilih bahan lain.` });
      return;
    }

    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/feeding/ration', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          name, description, targetKgPerHead: targetKgPerHead || null,
          ingredients: ingredients.map((i) => ({
            itemName        : i.itemName,
            warehouseId     : i.warehouseId || stockWarehouseId || null,
            qtyKgPerBatch   : parseFloat(i.qtyKgPerBatch),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: data.message });
        onSuccess?.();
        setTimeout(handleClose, 1200);
      } else {
        setMsg({ type: 'err', text: data.message });
      }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20"><Layers size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Buat Formula Ransum</h3>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">Bahan dari stok warehouse</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5 custom-scrollbar">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
            </div>
          )}

          {/* Info dasar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Formula *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="mis: Ransum Penggemukan A"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target kg/ekor/sesi</label>
              <input type="number" min="0" step="0.1" value={targetKgPerHead}
                onChange={(e) => setTargetKgPerHead(e.target.value)} placeholder="mis: 8.5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Deskripsi</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan opsional"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>

          {/* Pilih warehouse sumber stok */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Warehouse Sumber Bahan Pakan *
            </label>
            <select value={stockWarehouseId} onChange={(e) => { setStockWarehouseId(e.target.value); setIngredients([]); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
              <option value="">-- Pilih Warehouse --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</option>
              ))}
            </select>
            {stockWarehouseId && (
              <p className="text-[9px] text-slate-400 mt-1">
                {loadingStock ? '⏳ Memuat stok...' : `${stockItems.length} item tersedia`}
              </p>
            )}
          </div>

          {/* Komposisi bahan dari stok */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Komposisi Bahan</label>
              <button onClick={addIngredient} disabled={!stockWarehouseId}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#8da070] text-white rounded-lg text-[9px] font-black uppercase tracking-wide hover:bg-[#7a8c61] disabled:opacity-40 transition-all">
                <Plus size={11} /> Tambah Bahan
              </button>
            </div>

            {!stockWarehouseId ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <Warehouse size={24} className="mx-auto text-slate-200 mb-2" />
                <p className="text-[10px] text-slate-300 font-black uppercase">Pilih warehouse sumber terlebih dahulu</p>
              </div>
            ) : ingredients.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center">
                <Package size={20} className="mx-auto text-slate-200 mb-1.5" />
                <p className="text-[10px] text-slate-300 font-black uppercase">Klik "Tambah Bahan" untuk memilih dari stok</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => {
                  const isOverStock = parseFloat(ing.qtyKgPerBatch) > ing.stockQty && ing.stockQty > 0;
                  return (
                    <div key={idx} className={`rounded-2xl p-3 border ${isOverStock ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-start gap-2">
                        {/* Dropdown item dari Stock */}
                        <div className="flex-1 space-y-1.5">
                          <select value={ing.itemName}
                            onChange={(e) => updateIng(idx, 'itemName', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                            <option value="">-- Pilih Item dari Stok --</option>
                            {stockItems.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name} — {fmtKg(s.stock)} tersedia — {fmtRp(parseFloat(s.price) || 0)}/kg
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <input type="number" min="0" step="0.1" value={ing.qtyKgPerBatch}
                              onChange={(e) => updateIng(idx, 'qtyKgPerBatch', e.target.value)}
                              placeholder="Qty kg"
                              className={`w-28 bg-white border rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300 ${isOverStock ? 'border-red-300' : 'border-slate-200'}`} />
                            <span className="text-[9px] text-slate-400 font-bold">kg</span>

                            {/* Preview cost & stok status */}
                            {ing.itemName && (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {parseFloat(ing.qtyKgPerBatch) > 0 && (
                                  <span className="text-[9px] text-[#8da070] font-black whitespace-nowrap">
                                    = {fmtRp(parseFloat(ing.qtyKgPerBatch) * ing.priceSnapshot)}
                                  </span>
                                )}
                                {ing.stockQty > 0 && (
                                  <span className={`text-[8px] font-bold whitespace-nowrap ${isOverStock ? 'text-red-500' : 'text-slate-400'}`}>
                                    {isOverStock ? `⚠ Max ${fmtKg(ing.stockQty)}` : `Stok: ${fmtKg(ing.stockQty)}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <button onClick={() => removeIng(idx)}
                          className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-400 rounded-xl transition-all shrink-0 mt-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live cost preview */}
          {ingredients.length > 0 && totalIngKg > 0 && (
            <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Cost Preview</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: 'Total Bahan',    v: fmtKg(totalIngKg),    color: 'text-white'       },
                  { l: 'Total/Batch',    v: fmtRp(totalCostBatch), color: 'text-[#8da070]'  },
                  { l: 'Biaya/kg',       v: fmtRp(costPerKg),      color: 'text-amber-400'  },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-[8px] text-slate-500 uppercase">{s.l}</p>
                    <p className={`text-sm font-black ${s.color}`}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Komposisi bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                {ingredients.filter((i) => parseFloat(i.qtyKgPerBatch) > 0).map((ing, idx) => {
                  const pct  = totalIngKg > 0 ? (parseFloat(ing.qtyKgPerBatch) / totalIngKg) * 100 : 0;
                  const cols = ['#8da070','#5f7a4a','#a3b88c','#c5d4ae','#3d5229','#d4e8c2'];
                  return (
                    <div key={idx} style={{ width: `${pct}%`, background: cols[idx % cols.length] }}
                      className="h-full" title={`${ing.itemName}: ${pct.toFixed(1)}%`} />
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {ingredients.filter((i) => i.itemName && parseFloat(i.qtyKgPerBatch) > 0).map((ing, idx) => {
                  const pct  = totalIngKg > 0 ? (parseFloat(ing.qtyKgPerBatch) / totalIngKg * 100).toFixed(1) : 0;
                  const cols = ['bg-[#8da070]','bg-[#5f7a4a]','bg-[#a3b88c]','bg-[#c5d4ae]','bg-[#3d5229]'];
                  return (
                    <span key={idx} className="text-[8px] text-slate-400 font-bold flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cols[idx % cols.length]}`} />
                      {ing.itemName} ({pct}%)
                    </span>
                  );
                })}
              </div>

              {targetKgPerHead && costPerKg > 0 && (
                <p className="text-[9px] text-slate-400">
                  Estimasi biaya/ekor/sesi:{' '}
                  <span className="text-[#8da070] font-black">{fmtRp(parseFloat(targetKgPerHead) * costPerKg)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 shrink-0">
          <button onClick={handleSubmit}
            disabled={saving || !name.trim() || !ingredients.length || !stockWarehouseId}
            className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              saving || !name.trim() || !ingredients.length || !stockWarehouseId
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'
            }`}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><Layers size={14} /> Simpan Formula</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Buat Jadwal Pakan
// ═══════════════════════════════════════════════════════════════
const ScheduleModal = ({ isOpen, onClose, onSuccess, formulas, warehouses }) => {
  const [form, setForm] = useState({
    warehouseId: '', rationFormulaId: '', time: '07:00',
    label: 'Pagi', daysOfWeek: 'MON,TUE,WED,THU,FRI,SAT,SUN',
    targetKgPerHead: '', headCount: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const DAY_LABEL = { MON:'Sen', TUE:'Sel', WED:'Rab', THU:'Kam', FRI:'Jum', SAT:'Sab', SUN:'Min' };

  const toggleDay = (d) => {
    const curr = form.daysOfWeek ? form.daysOfWeek.split(',') : [];
    const next = curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d];
    setForm((f) => ({ ...f, daysOfWeek: next.join(',') }));
  };

  const selectedFormula = formulas.find((f) => f.id === form.rationFormulaId);
  const kgPerHead  = parseFloat(form.targetKgPerHead) || selectedFormula?.targetKgPerHead || 0;
  const headCount  = parseInt(form.headCount) || 0;
  const totalKgEst = kgPerHead && headCount ? kgPerHead * headCount : null;

  const handleSubmit = async () => {
    if (!form.warehouseId || !form.rationFormulaId || !form.time)
      { setMsg({ type: 'err', text: 'Kandang, formula, dan waktu wajib.' }); return; }

    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/feeding/schedule', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: data.message });
        onSuccess?.();
        setTimeout(() => { setMsg(null); onClose(); }, 1200);
      } else { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><CalendarDays size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Buat Jadwal Pakan</h3>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">Harian per Kandang</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kandang *</label>
              <select value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih Kandang --</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Formula *</label>
              <select value={form.rationFormulaId} onChange={(e) => setForm((f) => ({ ...f, rationFormulaId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih Formula --</option>
                {formulas.map((f) => <option key={f.id} value={f.id}>{f.name} — {fmtRp(f.totalCostPerKg)}/kg</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Waktu *</label>
              <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sesi</label>
              <div className="flex gap-1.5">
                {['Pagi','Siang','Sore'].map((l) => (
                  <button key={l} onClick={() => setForm((f) => ({ ...f, label: l }))}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${form.label === l ? 'bg-[#8da070] text-white border-[#8da070]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hari Aktif</label>
              <div className="flex gap-1.5">
                {DAYS.map((d) => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${form.daysOfWeek?.includes(d) ? 'bg-[#8da070] text-white border-[#8da070]' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {DAY_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">kg/ekor</label>
              <input type="number" min="0" step="0.1" value={form.targetKgPerHead}
                onChange={(e) => setForm((f) => ({ ...f, targetKgPerHead: e.target.value }))}
                placeholder={selectedFormula?.targetKgPerHead || 'mis: 8.5'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jumlah Ekor</label>
              <input type="number" min="1" value={form.headCount}
                onChange={(e) => setForm((f) => ({ ...f, headCount: e.target.value }))}
                placeholder="mis: 50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>

          {totalKgEst && (
            <div className="bg-[#8da070]/10 rounded-2xl p-3 flex items-center justify-between border border-[#8da070]/20">
              <span className="text-[9px] font-black text-[#8da070] uppercase">Total / Sesi</span>
              <div className="text-right">
                <p className="font-black text-slate-800 text-sm">{fmtKg(totalKgEst)}</p>
                {selectedFormula && <p className="text-[9px] text-[#8da070] font-bold">{fmtRp(totalKgEst * selectedFormula.totalCostPerKg)}</p>}
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving || !form.warehouseId || !form.rationFormulaId}
            className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              saving || !form.warehouseId || !form.rationFormulaId
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'
            }`}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><CalendarDays size={14} /> Simpan Jadwal</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Catat Konsumsi Pakan
// stockWarehouseId = warehouse sumber bahan (untuk FIFO)
// ═══════════════════════════════════════════════════════════════
const ConsumptionModal = ({ isOpen, onClose, onSuccess, formulas, warehouses, schedules }) => {
  const [form, setForm] = useState({
    warehouseId: '', rationFormulaId: '', scheduleId: '',
    stockWarehouseId: '', // warehouse sumber stok bahan pakan
    amountGiven: '', amountWasted: '0', headCount: '',
    date: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const selectedFormula = formulas.find((f) => f.id === form.rationFormulaId);
  const given    = parseFloat(form.amountGiven)  || 0;
  const wasted   = parseFloat(form.amountWasted) || 0;
  const consumed = Math.max(0, given - wasted);
  const wasteRate = given > 0 ? (wasted / given) * 100 : 0;
  const estimatedCost = selectedFormula ? given * selectedFormula.totalCostPerKg : null;

  const onSelectSchedule = (schedId) => {
    const sch = schedules.find((s) => s.id === schedId);
    if (sch) {
      setForm((f) => ({
        ...f,
        scheduleId     : schedId,
        warehouseId    : sch.warehouseId    || f.warehouseId,
        rationFormulaId: sch.rationFormulaId || f.rationFormulaId,
        headCount      : sch.headCount?.toString() || f.headCount,
        amountGiven    : sch.totalKgTarget?.toString() || f.amountGiven,
      }));
    } else {
      setForm((f) => ({ ...f, scheduleId: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!form.rationFormulaId || !form.amountGiven)
      { setMsg({ type: 'err', text: 'Formula dan jumlah pakan wajib.' }); return; }
    if (given <= 0) { setMsg({ type: 'err', text: 'Jumlah pakan harus > 0.' }); return; }
    if (wasted > given) { setMsg({ type: 'err', text: 'Sisa pakan tidak boleh melebihi yang diberikan.' }); return; }

    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/feeding/consumption', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          ...form,
          amountGiven : parseFloat(form.amountGiven),
          amountWasted: parseFloat(form.amountWasted || 0),
          headCount   : form.headCount ? parseInt(form.headCount) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: data.warning || data.message });
        onSuccess?.();
        setTimeout(() => { setMsg(null); onClose(); }, 1600);
      } else { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><ClipboardList size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Catat Konsumsi Pakan</h3>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">Stok dipotong otomatis via FIFO</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
            </div>
          )}

          {/* Quick fill dari jadwal */}
          {schedules.filter((s) => s.status === 'SCHEDULED').length > 0 && (
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dari Jadwal (auto-isi)</label>
              <select value={form.scheduleId} onChange={(e) => onSelectSchedule(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Tanpa jadwal / manual --</option>
                {schedules.filter((s) => s.status === 'SCHEDULED').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.time} {s.label} — {s.warehouse?.name} — {s.formula?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kandang</label>
              <select value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih --</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Formula *</label>
              <select value={form.rationFormulaId} onChange={(e) => setForm((f) => ({ ...f, rationFormulaId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih --</option>
                {formulas.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Warehouse sumber stok bahan */}
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Warehouse Sumber Bahan Pakan
                <span className="text-slate-300 normal-case ml-1">(untuk FIFO deduction)</span>
              </label>
              <select value={form.stockWarehouseId} onChange={(e) => setForm((f) => ({ ...f, stockWarehouseId: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih (opsional) --</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          {/* Qty inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Diberikan (kg) *</label>
              <input type="number" min="0" step="0.1" value={form.amountGiven}
                onChange={(e) => setForm((f) => ({ ...f, amountGiven: e.target.value }))} placeholder="mis: 420"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sisa (kg)</label>
              <input type="number" min="0" step="0.1" value={form.amountWasted}
                onChange={(e) => setForm((f) => ({ ...f, amountWasted: e.target.value }))} placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jumlah Ekor</label>
              <input type="number" min="1" value={form.headCount}
                onChange={(e) => setForm((f) => ({ ...f, headCount: e.target.value }))} placeholder="mis: 50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>

          {/* Realtime summary */}
          {given > 0 && (
            <div className="bg-slate-50 rounded-2xl p-3 grid grid-cols-4 gap-2 border border-slate-100">
              {[
                { l: 'Dikonsumsi', v: fmtKg(consumed), color: 'text-[#8da070]' },
                { l: 'Waste Rate', v: fmtPct(wasteRate), color: wasteRate > 20 ? 'text-red-600' : 'text-slate-700' },
                { l: 'kg/Ekor', v: form.headCount && consumed > 0 ? fmtKg(consumed / parseInt(form.headCount)) : '-', color: 'text-slate-700' },
                { l: 'Est. Biaya', v: estimatedCost ? fmtRp(estimatedCost) : '-', color: 'text-amber-600' },
              ].map((s, i) => (
                <div key={i}><p className="text-[7px] font-black text-slate-400 uppercase">{s.l}</p><p className={`text-[11px] font-black ${s.color}`}>{s.v}</p></div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tanggal</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Catatan</label>
              <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="opsional" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving || !form.rationFormulaId || !form.amountGiven}
            className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              saving || !form.rationFormulaId || !form.amountGiven
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'
            }`}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Mencatat...</> : <><ClipboardList size={14} /> Catat & Potong Stok</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 1: Formulasi
// ═══════════════════════════════════════════════════════════════
const TabFormulas = ({ formulas, loading, onRefresh, canWrite, warehouses }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formulas.length} Formula</p>
        {canWrite && (
          <button onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] active:scale-95 transition-all shadow-lg shadow-[#8da070]/20 italic">
            <Plus size={14} /> Buat Formula
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : formulas.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-slate-100 text-center">
          <Layers size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada formula ransum</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formulas.map((f) => {
            const totalKg = f.ingredients?.reduce((s, i) => s + i.qtyKgPerBatch, 0) ?? 0;
            return (
              <div key={f.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:border-[#8da070]/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#8da070]/10 text-[#8da070] rounded-xl"><Layers size={18} /></div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-[13px] tracking-tight leading-none">{f.name}</h4>
                      {f.description && <p className="text-[9px] text-slate-400 mt-0.5">{f.description}</p>}
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border ${f.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {f.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { l: 'Biaya/kg',    v: fmtRp(f.totalCostPerKg),   color: 'text-amber-600', bg: 'bg-amber-50'      },
                    { l: 'Target/ekor', v: f.targetKgPerHead ? fmtKg(f.targetKgPerHead) : '-', color: 'text-[#8da070]', bg: 'bg-[#8da070]/10' },
                    { l: 'Total Bahan', v: fmtKg(totalKg),            color: 'text-slate-600', bg: 'bg-slate-50'      },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-2`}>
                      <p className="text-[7px] font-black text-slate-400 uppercase">{s.l}</p>
                      <p className={`text-[11px] font-black ${s.color}`}>{s.v}</p>
                    </div>
                  ))}
                </div>

                {/* Komposisi bar */}
                {f.ingredients?.length > 0 && totalKg > 0 && (
                  <>
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-1.5">
                      {f.ingredients.map((ing, idx) => {
                        const pct  = (ing.qtyKgPerBatch / totalKg) * 100;
                        const cols = ['#8da070','#5f7a4a','#a3b88c','#c5d4ae','#3d5229'];
                        return (
                          <div key={idx} style={{ width: `${pct}%`, background: cols[idx % cols.length] }}
                            className="h-full" title={`${ing.itemName}: ${pct.toFixed(1)}%`} />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.ingredients.map((ing, idx) => {
                        const cols = ['bg-[#8da070]','bg-[#5f7a4a]','bg-[#a3b88c]','bg-[#c5d4ae]','bg-[#3d5229]'];
                        return (
                          <span key={idx} className="text-[8px] text-slate-500 font-bold flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${cols[idx % cols.length]}`} />
                            {ing.itemName} {fmtKg(ing.qtyKgPerBatch)}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                  <span className="text-[8px] text-slate-300 font-bold">
                    {f._count?.schedules || 0} jadwal · {f._count?.consumptions || 0} log konsumsi
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RationFormulaModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onRefresh} warehouses={warehouses} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 2: Jadwal
// ═══════════════════════════════════════════════════════════════
const TabSchedules = ({ schedules, loading, onRefresh, canWrite, formulas, warehouses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completing, setCompleting] = useState(null);

  const grouped = schedules.reduce((acc, s) => {
    if (!acc[s.time]) acc[s.time] = [];
    acc[s.time].push(s);
    return acc;
  }, {});

  const markComplete = async (id) => {
    setCompleting(id);
    try {
      await fetch(`/api/feeding/schedule/${id}/complete`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : '{}',
      });
      onRefresh();
    } catch {}
    finally { setCompleting(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{schedules.length} Jadwal Aktif</p>
        {canWrite && (
          <button onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] active:scale-95 transition-all shadow-lg shadow-[#8da070]/20 italic">
            <Plus size={14} /> Buat Jadwal
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-slate-100 text-center">
          <CalendarDays size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada jadwal</p>
        </div>
      ) : (
        Object.keys(grouped).sort().map((time) => (
          <div key={time}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl">
                <Clock size={12} className="text-[#8da070]" />
                <span className="font-black text-sm italic">{time}</span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grouped[time].map((sch) => (
                <div key={sch.id}
                  className={`bg-white rounded-[20px] p-4 border transition-all ${sch.status === 'COMPLETED' ? 'border-green-200 opacity-70' : 'border-slate-100 shadow-sm hover:border-[#8da070]/30'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {sch.label && <span className="text-[8px] font-black bg-[#8da070]/10 text-[#8da070] px-2 py-0.5 rounded-lg uppercase italic">{sch.label}</span>}
                        <Pill status={sch.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Warehouse size={11} className="text-[#8da070]" />
                        <span className="font-black text-slate-800 text-[12px] uppercase tracking-tight">{sch.warehouse?.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Layers size={9} /> {sch.formula?.name}
                      </p>
                    </div>
                    {sch.status !== 'COMPLETED' && canWrite ? (
                      <button onClick={() => markComplete(sch.id)} disabled={completing === sch.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                        {completing === sch.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Selesai
                      </button>
                    ) : sch.status === 'COMPLETED' ? (
                      <div className="p-2 bg-green-50 text-green-500 rounded-xl"><CheckCircle2 size={16} /></div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {sch.headCount && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1"><Beef size={9} />{sch.headCount} ekor</span>}
                    {sch.targetKgPerHead && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-1"><Scale size={9} />{sch.targetKgPerHead} kg/ekor</span>}
                    {sch.totalKgTarget && <span className="text-[9px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-1 rounded-lg">≈ {fmtKg(sch.totalKgTarget)}</span>}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    {['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d) => {
                      const lbl = {MON:'S',TUE:'S',WED:'R',THU:'K',FRI:'J',SAT:'S',SUN:'M'}[d];
                      const on  = sch.daysOfWeek?.includes(d);
                      return (
                        <span key={d} className={`w-5 h-5 flex items-center justify-center rounded-full text-[8px] font-black ${on ? 'bg-[#8da070] text-white' : 'bg-slate-100 text-slate-300'}`}>{lbl}</span>
                      );
                    })}
                  </div>
                  {sch.completedAt && <p className="text-[8px] text-green-500 mt-1.5">✓ {fmtDT(sch.completedAt)} oleh {sch.completedBy}</p>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <ScheduleModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={onRefresh} formulas={formulas} warehouses={warehouses} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 3: Log Konsumsi
// ═══════════════════════════════════════════════════════════════
const TabConsumption = ({ formulas, warehouses, schedules, onRefresh }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const [logs,   setLogs]       = useState([]);
  const [summary,setSummary]    = useState(null);
  const [loading,setLoading]    = useState(true);
  const [filterWh,setFilterWh]  = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feeding/consumption${filterWh ? `?warehouseId=${filterWh}` : ''}`);
      if (res.ok) { const d = await res.json(); setLogs(d.logs ?? []); setSummary(d.summary ?? null); }
    } catch {}
    finally { setLoading(false); }
  }, [filterWh]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <select value={filterWh} onChange={(e) => setFilterWh(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-600 focus:outline-none">
            <option value="">Semua Kandang</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={fetchLogs} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#8da070] transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <button onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] active:scale-95 transition-all shadow-lg shadow-[#8da070]/20 italic">
          <Plus size={14} /> Catat Konsumsi
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l:'Diberikan',  v:fmtKg(summary.totalGiven),    icon:<Utensils size={16}/>,   color:'text-[#8da070]', bg:'bg-[#8da070]/10' },
            { l:'Dikonsumsi', v:fmtKg(summary.totalConsumed), icon:<TrendingUp size={16}/>,  color:'text-blue-600',  bg:'bg-blue-50'      },
            { l:'Terbuang',   v:fmtKg(summary.totalWasted),   icon:<TrendingDown size={16}/>,color:summary.wasteRate>20?'text-red-600':'text-amber-600', bg:summary.wasteRate>20?'bg-red-50':'bg-amber-50' },
            { l:'Waste Rate', v:fmtPct(summary.wasteRate),    icon:<BarChart3 size={16}/>,   color:'text-slate-600', bg:'bg-slate-50'     },
          ].map((s,i) => (
            <div key={i} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={`${s.bg} ${s.color} p-2.5 rounded-xl shrink-0`}>{s.icon}</div>
              <div><p className="text-[8px] font-black text-slate-400 uppercase">{s.l}</p><p className={`text-base font-black ${s.color}`}>{s.v}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-slate-100 text-center">
          <ClipboardList size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada log konsumsi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const wasteRate = log.amountGiven > 0 ? (log.amountWasted / log.amountGiven) * 100 : 0;
            return (
              <div key={log.id} className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm hover:border-[#8da070]/20 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-[#8da070]/10 text-[#8da070] rounded-xl shrink-0"><Utensils size={16} /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-black text-slate-800 text-[12px] uppercase tracking-tight truncate">
                          {log.formula?.name || '-'}
                        </span>
                        {log.warehouse && (
                          <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Warehouse size={7} /> {log.warehouse.name}
                          </span>
                        )}
                        {log.isStockDeducted && (
                          <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg">FIFO ✓</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400">{fmtDT(log.date)} · {log.createdBy}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900 text-sm">{fmtKg(log.amountGiven)}</p>
                    <p className="text-[8px] text-[#8da070] font-bold">↓ {fmtKg(log.amountConsumed)}</p>
                    {wasteRate > 0 && <p className={`text-[8px] font-bold ${wasteRate > 20 ? 'text-red-500' : 'text-amber-500'}`}>Waste {fmtPct(wasteRate)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2 pl-11">
                  {log.headCount && <span className="text-[8px] text-slate-400 font-bold">{log.headCount} ekor</span>}
                  {log.kgPerHead  && <span className="text-[8px] text-[#8da070] font-bold">· {fmtKg(log.kgPerHead)}/ekor</span>}
                  {log.estimatedCost && <span className="text-[8px] text-amber-600 font-bold">· {fmtRp(log.estimatedCost)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConsumptionModal
        isOpen={isOpen} onClose={() => setIsOpen(false)}
        onSuccess={() => { onRefresh(); fetchLogs(); }}
        formulas={formulas} warehouses={warehouses} schedules={schedules}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const FeedingPage = () => {
  const { data: session }  = useSession();
  const [tab,        setTab]        = useState('formula');
  const [formulas,   setFormulas]   = useState([]);
  const [schedules,  setSchedules]  = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const canWrite = ['SuperAdmin','Admin','Supervisor'].includes(session?.user?.role);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, sRes, wRes] = await Promise.all([
        fetch('/api/feeding/ration'),
        fetch('/api/feeding/schedule'),
        fetch('/api/warehouse'),        // semua warehouse (bukan hanya kandang)
      ]);
      if (fRes.ok) setFormulas(await fRes.json());
      if (sRes.ok) setSchedules(await sRes.json());
      if (wRes.ok) setWarehouses(await wRes.json());
    } catch (err) { console.error('FEEDING_FETCH:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const completedToday = schedules.filter((s) => {
    if (s.status !== 'COMPLETED' || !s.completedAt) return false;
    return new Date(s.completedAt).toDateString() === new Date().toDateString();
  }).length;

  const pending = schedules.filter((s) => s.status === 'SCHEDULED').length;

  const TABS = [
    { key: 'formula',  label: 'Formulasi',   icon: <Layers size={15} />       },
    { key: 'schedule', label: 'Jadwal Pakan', icon: <CalendarDays size={15} /> },
    { key: 'log',      label: 'Log Konsumsi', icon: <ClipboardList size={15} />},
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Manajemen Pakan
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            Ration Formula · Feeding Schedule · FIFO Stock Deduction
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="self-start p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#8da070] transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Formula',      v: formulas.length,  icon: <Layers size={18} />,       color: 'text-[#8da070]', bg: 'bg-[#8da070]/10' },
          { l: 'Jadwal',       v: schedules.length, icon: <CalendarDays size={18} />,  color: 'text-blue-600',  bg: 'bg-blue-50'      },
          { l: 'Selesai Hari Ini', v: completedToday, icon: <CheckCircle2 size={18}/>, color: 'text-green-600', bg: 'bg-green-50'     },
          { l: 'Menunggu',     v: pending,           icon: <Clock size={18} />,        color: pending > 0 ? 'text-amber-600' : 'text-slate-400', bg: pending > 0 ? 'bg-amber-50' : 'bg-slate-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className={`${s.bg} ${s.color} p-3 rounded-xl shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{s.l}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5 leading-none">
                {loading ? <span className="inline-block h-5 w-8 bg-slate-100 animate-pulse rounded" /> : s.v}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 p-1 gap-1 bg-slate-50/50">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="p-5 md:p-6">
          {tab === 'formula'  && <TabFormulas  formulas={formulas}  loading={loading} onRefresh={fetchAll} canWrite={canWrite} warehouses={warehouses} />}
          {tab === 'schedule' && <TabSchedules schedules={schedules} loading={loading} onRefresh={fetchAll} canWrite={canWrite} formulas={formulas} warehouses={warehouses} />}
          {tab === 'log'      && <TabConsumption formulas={formulas} warehouses={warehouses} schedules={schedules} onRefresh={fetchAll} />}
        </div>
      </div>
    </div>
  );
};

export default FeedingPage;
