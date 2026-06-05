// /app/(Main)/PenjualanSapi/page.js
// Sales & Distribution — Penjualan Sapi Gemuk
// Tab 1: Sales Orders
// Tab 2: Invoice & Faktur (with print)
// Tab 3: Pengiriman / Delivery
// Tab 4: Riwayat Harga Jual (price trend)
// ============================================================

'use client';

import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo,
} from 'react';
import {
  TrendingUp, TrendingDown, FileSpreadsheet, Truck, DollarSign,
  UserCheck, Plus, X, Loader2, RefreshCw, CheckCircle2,
  AlertTriangle, Beef, Scale, Search, ChevronDown, Printer,
  Tag, Package, MapPin, ArrowRight, BarChart3, Layers,
  Clock, Warehouse, Phone, Hash, Check, Eye, ChevronRight,
  Activity, Calendar,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// ─── Helpers ──────────────────────────────────────────────────
const fmtRp = (v) =>
  `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
const fmtKg = (v) =>
  `${(parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
const fmtDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDateTime = (dt) =>
  dt ? new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

// ─── Status configs ───────────────────────────────────────────
const ORDER_STATUS = {
  PENDING_SALES     : { label: 'Menunggu Sales',   bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-400', step: 0, pulse: true  },
  PENDING_ADMIN     : { label: 'Menunggu Admin',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  step: 1, pulse: true  },
  PENDING_SUPERVISOR: { label: 'Menunggu SPV',     bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400', step: 2, pulse: true  },
  PENDING_MANAGER   : { label: 'Menunggu Manager', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',   step: 3, pulse: true  },
  COMPLETED         : { label: 'Selesai',           bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  step: 4, pulse: false },
  CANCELLED         : { label: 'Dibatalkan',        bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400',    step:-1, pulse: false },
};
const DELIVERY_STATUS = {
  PENDING    : { label: 'Belum Berangkat', bg: 'bg-slate-50',  text: 'text-slate-600', border: 'border-slate-200' },
  ON_DELIVERY: { label: 'Dalam Perjalanan',bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200'  },
  DELIVERED  : { label: 'Sudah Diterima',  bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200' },
  CANCELLED  : { label: 'Dibatalkan',      bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-200'   },
};

const StatusBadge = ({ status, small }) => {
  const c = ORDER_STATUS[status] || ORDER_STATUS.PENDING_SALES;
  return (
    <span className={`inline-flex items-center gap-1.5 ${small ? 'px-2 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[9px]'} rounded-xl font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
};

const DelivBadge = ({ status }) => {
  const c = DELIVERY_STATUS[status] || DELIVERY_STATUS.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

// ─── Approval Stepper ─────────────────────────────────────────
const STAGES = ['Sales', 'Admin', 'Supervisor', 'Manager'];
const ApprovalStepper = ({ order }) => {
  const cfg     = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING_SALES;
  const current = cfg.step;
  if (order.status === 'CANCELLED') return (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-xl">
      <X size={11} className="text-red-500 shrink-0" />
      <p className="text-[9px] font-black text-red-600 uppercase">Dibatalkan {order.rejectedBy ? `oleh ${order.rejectedBy}` : ''}</p>
    </div>
  );
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {STAGES.map((lbl, i) => {
        const done   = order.status === 'COMPLETED' || i < current;
        const active = i === current && !['COMPLETED','CANCELLED'].includes(order.status);
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black border ${
                done   ? 'bg-green-500 border-green-500 text-white'
                : active ? 'bg-[#8da070] border-[#8da070] text-white animate-pulse'
                : 'bg-white border-slate-200 text-slate-300'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <p className={`text-[6px] font-black uppercase ${done || active ? 'text-green-600' : 'text-slate-300'}`}>{lbl}</p>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`flex-1 h-px mx-0.5 mt-[-8px] ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Buat Sales Order Sapi
// ═══════════════════════════════════════════════════════════════
const AddSaleModal = ({ isOpen, onClose, onSuccess, warehouses }) => {
  const [customerId,      setCustomerId]      = useState('');
  const [warehouseId,     setWarehouseId]     = useState('');
  const [paymentMethod,   setPaymentMethod]   = useState('TRANSFER');
  const [dueDate,         setDueDate]         = useState('');
  const [notes,           setNotes]           = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [discountPct,     setDiscountPct]     = useState('');
  const [taxPct,          setTaxPct]          = useState('0');
  const [shippingCost,    setShippingCost]    = useState('');
  const [items,           setItems]           = useState([]);

  const [customers,       setCustomers]       = useState([]);
  const [availableCattle, setAvailableCattle] = useState([]);
  const [loadingCattle,   setLoadingCattle]   = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [msg,             setMsg]             = useState(null);

  // Fetch customers
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/contacts?type=CUSTOMER')
      .then((r) => r.ok ? r.json() : [])
      .then(setCustomers)
      .catch(console.error);
  }, [isOpen]);

  // Fetch cattle IN_KANDANG dari warehouse terpilih
  useEffect(() => {
    if (!warehouseId) { setAvailableCattle([]); return; }
    setLoadingCattle(true);
    fetch(`/api/cattle/import-rfid?warehouseId=${warehouseId}&status=IN_KANDANG`)
      .then((r) => r.ok ? r.json() : [])
      .then(setAvailableCattle)
      .catch(console.error)
      .finally(() => setLoadingCattle(false));
  }, [warehouseId]);

  const reset = () => {
    setCustomerId(''); setWarehouseId(''); setItems([]);
    setNotes(''); setDeliveryAddress(''); setMsg(null);
    setDiscountPct(''); setTaxPct('0'); setShippingCost('');
  };
  const handleClose = () => { reset(); onClose(); };

  const addCattle = (cattle) => {
    if (items.find((i) => i.rfidNo === cattle.rfidNo || i.rfidNo === cattle.id)) return;
    const hpp = cattle.hppPerEkor || 0;
    const weight = cattle.weightPanen || cattle.weightTerima || cattle.weight || 0;
    setItems((prev) => [...prev, {
      rfidNo       : cattle.rfidNo || cattle.id,
      cattleId     : cattle.id,
      finalWeightKg: weight,
      pricePerKg   : '',
      hppPerEkor   : hpp,
      breed        : cattle.breed || '',
      notes        : '',
    }]);
  };

  const removeCattle = (rfidNo) => setItems((p) => p.filter((i) => i.rfidNo !== rfidNo));

  const updateItem = (rfidNo, field, value) => {
    setItems((prev) => prev.map((i) => i.rfidNo === rfidNo ? { ...i, [field]: value } : i));
  };

  // Live calculations
  const enriched = useMemo(() => items.map((i) => {
    const w = parseFloat(i.finalWeightKg) || 0;
    const p = parseFloat(i.pricePerKg)    || 0;
    const sub = parseFloat((w * p).toFixed(0));
    const margin = parseFloat((sub - (i.hppPerEkor || 0)).toFixed(0));
    return { ...i, subTotal: sub, margin };
  }), [items]);

  const subtotal     = enriched.reduce((s, i) => s + i.subTotal, 0);
  const discAmt      = subtotal * (parseFloat(discountPct) || 0) / 100;
  const taxAmt       = (subtotal - discAmt) * (parseFloat(taxPct) || 0) / 100;
  const shipping     = parseFloat(shippingCost) || 0;
  const totalAmount  = subtotal - discAmt + taxAmt + shipping;
  const totalWeight  = enriched.reduce((s, i) => s + (parseFloat(i.finalWeightKg) || 0), 0);
  const totalMargin  = enriched.reduce((s, i) => s + i.margin, 0);

  const handleSubmit = async () => {
    if (!items.length) { setMsg({ type: 'err', text: 'Tambahkan minimal 1 sapi.' }); return; }
    if (items.some((i) => !parseFloat(i.pricePerKg)))
      { setMsg({ type: 'err', text: 'Isi harga/kg untuk semua sapi.' }); return; }
    if (items.some((i) => !parseFloat(i.finalWeightKg)))
      { setMsg({ type: 'err', text: 'Isi bobot timbang keluar untuk semua sapi.' }); return; }

    setSaving(true); setMsg(null);
    try {
      const res  = await fetch('/api/sales/cattle', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          customerId   : customerId || null,
          warehouseId  : warehouseId || null,
          paymentMethod,
          dueDate      : dueDate || null,
          notes, deliveryAddress,
          discountPct  : parseFloat(discountPct) || 0,
          taxPct       : parseFloat(taxPct) || 0,
          shippingCost : parseFloat(shippingCost) || 0,
          items        : enriched.map((i) => ({
            rfidNo       : i.rfidNo,
            cattleId     : i.cattleId,
            finalWeightKg: parseFloat(i.finalWeightKg),
            pricePerKg   : parseFloat(i.pricePerKg),
            hppPerEkor   : i.hppPerEkor || 0,
            breed        : i.breed,
            notes        : i.notes,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: data.message });
        onSuccess?.();
        setTimeout(handleClose, 1500);
      } else {
        setMsg({ type: 'err', text: data.message });
      }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

        {/* Header */}
        <div className="p-5 md:p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20"><Beef size={18} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Buat Invoice Sapi</h3>
                <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">Sales Order Sapi Gemuk</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 custom-scrollbar">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
            </div>
          )}

          {/* Info dasar */}
          <div className="bg-white rounded-[20px] p-4 border border-slate-100 space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Info Transaksi</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                  <option value="">-- Pembeli Umum --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Kandang Asal *</label>
                <select value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setItems([]); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                  <option value="">-- Pilih Kandang --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Metode Bayar</label>
                <div className="flex gap-1.5">
                  {['CASH','TRANSFER','CREDIT'].map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${paymentMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Jatuh Tempo</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Ongkos Kirim (Rp)</label>
                <input type="number" min="0" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
              </div>
              <div className="col-span-2">
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Alamat Pengiriman</label>
                <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Alamat tujuan pengiriman sapi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          {/* Pilih Sapi */}
          <div className="bg-white rounded-[20px] p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih Sapi dari Kandang</p>
              {loadingCattle && <Loader2 size={12} className="animate-spin text-[#8da070]" />}
            </div>

            {!warehouseId ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                <Warehouse size={20} className="mx-auto text-slate-200 mb-1.5" />
                <p className="text-[10px] text-slate-300 font-black uppercase">Pilih kandang asal terlebih dahulu</p>
              </div>
            ) : availableCattle.length === 0 && !loadingCattle ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                <Beef size={20} className="mx-auto text-slate-200 mb-1.5" />
                <p className="text-[10px] text-slate-300 font-black uppercase">Tidak ada sapi IN_KANDANG di kandang ini</p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                {availableCattle.filter((c) => !items.find((i) => i.rfidNo === (c.rfidNo || c.id))).map((c) => (
                  <div key={c.id}
                    onClick={() => addCattle(c)}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#8da070]/40 hover:bg-[#8da070]/5 cursor-pointer transition-all group">
                    <div>
                      <p className="text-[11px] font-black text-slate-800 font-mono uppercase">{c.rfidNo || c.id}</p>
                      <p className="text-[8px] text-slate-400">Bobot: {fmtKg(c.weightPanen || c.weightTerima || c.weight)} · HPP: {fmtRp(c.hppPerEkor)}</p>
                    </div>
                    <div className="p-1 bg-[#8da070]/10 text-[#8da070] rounded-lg group-hover:bg-[#8da070] group-hover:text-white transition-all">
                      <Plus size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items yang dipilih */}
          {items.length > 0 && (
            <div className="bg-white rounded-[20px] p-4 border border-slate-100 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{items.length} Ekor Dipilih</p>
              <div className="space-y-2">
                {enriched.map((i) => (
                  <div key={i.rfidNo} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-slate-800 text-[11px] font-mono uppercase">{i.rfidNo}</span>
                      <button onClick={() => removeCattle(i.rfidNo)} className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-400 rounded-lg transition-all">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Bobot Timbang (kg) *</label>
                        <input type="number" min="0" step="0.1" value={i.finalWeightKg}
                          onChange={(e) => updateItem(i.rfidNo, 'finalWeightKg', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Harga / kg *</label>
                        <input type="number" min="0" step="100" value={i.pricePerKg}
                          onChange={(e) => updateItem(i.rfidNo, 'pricePerKg', e.target.value)}
                          placeholder="mis: 58000"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
                      </div>
                    </div>
                    {i.subTotal > 0 && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                        <span className="text-[8px] text-slate-400 font-bold">Subtotal</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] font-bold ${i.margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            Margin: {fmtRp(i.margin)}
                          </span>
                          <span className="text-[11px] font-black text-slate-800">{fmtRp(i.subTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total summary */}
          {items.length > 0 && (
            <div className="bg-slate-900 rounded-[20px] p-4 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ringkasan Invoice</p>
              <div className="space-y-1.5">
                {[
                  { l: 'Subtotal',       v: fmtRp(subtotal)    },
                  ...(discAmt > 0     ? [{ l: `Diskon ${discountPct}%`, v: `-${fmtRp(discAmt)}` }] : []),
                  ...(taxAmt > 0      ? [{ l: `PPN ${taxPct}%`,         v: fmtRp(taxAmt)         }] : []),
                  ...(shipping > 0    ? [{ l: 'Ongkos Kirim',           v: fmtRp(shipping)       }] : []),
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{r.l}</span>
                    <span className="text-[11px] font-bold text-slate-300">{r.v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <span className="text-[11px] font-black text-white uppercase">Total</span>
                  <span className="text-lg font-black text-[#8da070]">{fmtRp(totalAmount)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                {[
                  { l: 'Ekor',    v: items.length            },
                  { l: 'Berat',   v: fmtKg(totalWeight)      },
                  { l: 'Margin',  v: fmtRp(totalMargin), color: totalMargin >= 0 ? 'text-green-400' : 'text-red-400' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-[7px] text-slate-500 uppercase">{s.l}</p>
                    <p className={`text-[11px] font-black ${s.color || 'text-slate-300'}`}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
          <button onClick={handleSubmit}
            disabled={saving || !items.length}
            className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              saving || !items.length
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'
            }`}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Membuat Invoice...</> : <><Beef size={14} /> Buat Invoice Sapi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODAL: Detail & Approve Sales Order
// ═══════════════════════════════════════════════════════════════
const OrderDetailModal = ({ order, isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  const [approving,  setApproving]  = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [msg,        setMsg]        = useState(null);

  const role = session?.user?.role;

  const NEXT_STAGE = {
    PENDING_SALES     : { stage: 'sales',      label: 'Approve Sales',       roles: ['Sales','Admin','Supervisor','Manager','SuperAdmin'] },
    PENDING_ADMIN     : { stage: 'admin',      label: 'Approve Admin',       roles: ['Admin','SuperAdmin'] },
    PENDING_SUPERVISOR: { stage: 'supervisor', label: 'Approve Supervisor',  roles: ['Supervisor','SuperAdmin'] },
    PENDING_MANAGER   : { stage: 'manager',    label: 'Final Approve',       roles: ['Manager','SuperAdmin'] },
  };

  const canApprove = () => {
    const next = NEXT_STAGE[order?.status];
    return next && next.roles.includes(role);
  };
  const canReject = () => !['COMPLETED','CANCELLED'].includes(order?.status) &&
    ['Admin','Sales','Supervisor','Manager','SuperAdmin'].includes(role);

  const doApprove = async () => {
    const next = NEXT_STAGE[order.status];
    if (!next) return;
    setApproving(true); setMsg(null);
    try {
      const res = await fetch(`/api/sales/cattle/${order.id}/approve`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ stage: next.stage }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: data.message }); onRefresh?.(); }
      else        { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setApproving(false); }
  };

  const doReject = async () => {
    if (!rejectNote.trim()) { setMsg({ type: 'err', text: 'Masukkan alasan penolakan.' }); return; }
    setApproving(true); setMsg(null);
    try {
      const res = await fetch(`/api/sales/cattle/${order.id}/approve`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ stage: 'reject', notes: rejectNote }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: data.message }); onRefresh?.(); setShowReject(false); }
      else        { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal.' }); }
    finally { setApproving(false); }
  };

  if (!isOpen || !order) return null;

  const totalHpp    = order.items?.reduce((s, i) => s + (i.hppPerEkor || 0), 0) ?? 0;
  const totalMargin = (order.totalAmount || 0) - totalHpp;

  return (
    <div className="fixed inset-0 z-[250] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

        {/* Header */}
        <div className="p-5 md:p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase italic tracking-tight">{order.invoiceNo}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={order.status} />
                {order.isCattleReleased && (
                  <span className="text-[8px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg">Sapi Dilepas ✓</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl shrink-0"><X size={20} className="text-slate-400" /></button>
          </div>
          <ApprovalStepper order={order} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {msg.text}
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detail Transaksi</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Customer',     v: order.customer?.name || 'Umum' },
                { l: 'Kandang',      v: order.warehouse?.name || '-' },
                { l: 'Tanggal',      v: fmtDate(order.createdAt) },
                { l: 'Jatuh Tempo',  v: fmtDate(order.dueDate) },
                { l: 'Pembayaran',   v: order.paymentMethod || '-' },
                { l: 'Dibuat oleh', v: order.createdBy || '-' },
              ].map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[7px] font-black text-slate-400 uppercase">{r.l}</p>
                  <p className="text-[11px] font-black text-slate-700 truncate">{r.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-[18px] p-4 border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{order._count?.items || order.items?.length || 0} Ekor Sapi</p>
            <div className="space-y-2">
              {(order.items || []).map((it) => (
                <div key={it.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[11px] font-black text-slate-800 font-mono">{it.rfidNo}</p>
                    <p className="text-[8px] text-slate-400">
                      {fmtKg(it.finalWeightKg)} × {fmtRp(it.pricePerKg)}/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-[11px]">{fmtRp(it.subTotal)}</p>
                    {it.hppPerEkor > 0 && (
                      <p className={`text-[8px] font-bold ${it.marginPerEkor >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {fmtRp(it.marginPerEkor)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-slate-900 rounded-[18px] p-4 space-y-1.5">
            {[
              { l:'Total Ekor',  v:`${order.totalEkor} ekor`                    },
              { l:'Total Berat', v:fmtKg(order.totalWeightKg)                   },
              { l:'Subtotal',    v:fmtRp(order.subtotal)                        },
              ...(order.discount   > 0 ? [{ l:'Diskon',    v:`-${fmtRp(order.discount)}`  }] : []),
              ...(order.taxAmount  > 0 ? [{ l:'Pajak',     v:fmtRp(order.taxAmount)        }] : []),
              ...(order.shippingCost>0 ? [{ l:'Ongkir',    v:fmtRp(order.shippingCost)     }] : []),
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400">{r.l}</span>
                <span className="text-[10px] text-slate-300">{r.v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-[11px] font-black text-white uppercase">Total</span>
              <span className="text-lg font-black text-[#8da070]">{fmtRp(order.totalAmount)}</span>
            </div>
            {totalHpp > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Est. Margin</span>
                <span className={`text-[10px] font-black ${totalMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtRp(totalMargin)}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {(canApprove() || canReject()) && (
            <div className="space-y-2">
              {canApprove() && !showReject && (
                <button onClick={doApprove} disabled={approving}
                  className="w-full py-3.5 bg-[#8da070] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#7a8c61] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {approving ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                  : <><UserCheck size={14} /> {NEXT_STAGE[order.status]?.label}</>}
                </button>
              )}

              {canReject() && !showReject && order.status !== 'CANCELLED' && (
                <button onClick={() => setShowReject(true)}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all">
                  Tolak / Batalkan
                </button>
              )}

              {showReject && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-red-700 uppercase">Alasan Penolakan</p>
                  <input type="text" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Wajib diisi..."
                    className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-200 placeholder:text-slate-300" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReject(false)} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase">Batal</button>
                    <button onClick={doReject} disabled={approving}
                      className="flex-1 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-50">
                      {approving ? 'Memproses...' : 'Konfirmasi Tolak'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 1: Sales Orders
// ═══════════════════════════════════════════════════════════════
const TabOrders = ({ orders, loading, onRefresh, canCreate, warehouses }) => {
  const [isAddOpen,   setIsAddOpen]   = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('ALL');

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q  = search.toLowerCase();
      const ok = !q || o.invoiceNo.toLowerCase().includes(q) || (o.customer?.name || '').toLowerCase().includes(q);
      const st = statusFilter === 'ALL' || o.status === statusFilter;
      return ok && st;
    });
  }, [orders, search, statusFilter]);

  const STATUS_FILTERS = [
    { key: 'ALL',                 label: 'Semua'   },
    { key: 'PENDING_SALES',       label: 'Sales'   },
    { key: 'PENDING_ADMIN',       label: 'Admin'   },
    { key: 'PENDING_SUPERVISOR',  label: 'SPV'     },
    { key: 'PENDING_MANAGER',     label: 'Manager' },
    { key: 'COMPLETED',           label: 'Selesai' },
    { key: 'CANCELLED',           label: 'Batal'   },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari invoice / customer..."
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300 w-48" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                  statusFilter === f.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {canCreate && (
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] active:scale-95 transition-all shadow-lg shadow-[#8da070]/20 italic">
            <Plus size={14} /> Buat Invoice Sapi
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 border-2 border-dashed border-slate-100 text-center">
          <Beef size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada transaksi penjualan sapi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id}
              onClick={() => setSelected(order)}
              className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm hover:border-[#8da070]/30 hover:shadow-md cursor-pointer transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-xl shrink-0 transition-all group-hover:scale-105 ${
                    order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-[#8da070]/10 text-[#8da070]'
                  }`}>
                    <Beef size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800 text-[13px] uppercase tracking-tight">{order.invoiceNo}</span>
                      <StatusBadge status={order.status} small />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {order.customer?.name || 'Pembeli Umum'} · {order.totalEkor} ekor · {fmtKg(order.totalWeightKg)}
                    </p>
                    <ApprovalStepper order={order} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-slate-900 text-base">{fmtRp(order.totalAmount)}</p>
                  <p className="text-[9px] text-slate-400">{fmtDate(order.createdAt)}</p>
                  {order.delivery && <DelivBadge status={order.delivery.status} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddSaleModal
        isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}
        onSuccess={onRefresh} warehouses={warehouses}
      />
      <OrderDetailModal
        order={selected} isOpen={!!selected}
        onClose={() => setSelected(null)} onRefresh={() => { onRefresh(); setSelected(null); }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 2: Invoice & Faktur (print-ready)
// ═══════════════════════════════════════════════════════════════
const TabInvoice = ({ orders, loading }) => {
  const printRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const printInvoice = (order) => {
    setSelected(order);
    setTimeout(() => window.print(), 300);
  };

  const printableOrders = orders.filter((o) =>
    ['PENDING_MANAGER', 'COMPLETED'].includes(o.status)
  );

  return (
    <>
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {printableOrders.length} invoice siap cetak
        </p>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
        ) : printableOrders.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 border-2 border-dashed border-slate-100 text-center">
            <FileSpreadsheet size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="font-black text-slate-300 uppercase italic">Belum ada invoice siap cetak</p>
            <p className="text-[10px] text-slate-200 mt-1">Invoice tampil setelah status PENDING_MANAGER</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {printableOrders.map((order) => (
              <div key={order.id}
                className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm hover:border-[#8da070]/30 transition-all">
                {/* Invoice preview card */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase italic tracking-tight">{order.invoiceNo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{order.customer?.name || 'Pembeli Umum'}</p>
                    <StatusBadge status={order.status} small />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-700">{fmtDate(order.createdAt)}</p>
                    {order.dueDate && <p className="text-[9px] text-amber-600 font-bold">Due: {fmtDate(order.dueDate)}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { l: 'Ekor',    v: `${order.totalEkor} ekor`    },
                    { l: 'Berat',   v: fmtKg(order.totalWeightKg)   },
                    { l: 'Total',   v: fmtRp(order.totalAmount)     },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[7px] font-black text-slate-400 uppercase">{s.l}</p>
                      <p className="text-[10px] font-black text-slate-700">{s.v}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => printInvoice(order)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8da070] transition-all active:scale-[0.98]">
                  <Printer size={13} /> Cetak Invoice
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print area — hidden on screen, shown on print */}
      {selected && (
        <div ref={printRef} className="hidden print:block p-8">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-black uppercase">KEBOEN BAPAK</h1>
            <p className="text-sm text-gray-600">Livestock & Cattle Management</p>
            <h2 className="text-lg font-bold mt-4 uppercase">Invoice Penjualan Sapi</h2>
            <p className="text-base font-bold">{selected.invoiceNo}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
            <div>
              <p className="font-bold">Kepada:</p>
              <p>{selected.customer?.name || 'Pembeli Umum'}</p>
              {selected.deliveryAddress && <p className="text-gray-600">{selected.deliveryAddress}</p>}
            </div>
            <div className="text-right">
              <p><span className="font-bold">Tanggal:</span> {fmtDate(selected.createdAt)}</p>
              {selected.dueDate && <p><span className="font-bold">Jatuh Tempo:</span> {fmtDate(selected.dueDate)}</p>}
              <p><span className="font-bold">Pembayaran:</span> {selected.paymentMethod}</p>
            </div>
          </div>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="py-2 text-left">RFID</th>
                <th className="py-2 text-right">Bobot (kg)</th>
                <th className="py-2 text-right">Harga/kg</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(selected.items || []).map((it, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 font-mono">{it.rfidNo}</td>
                  <td className="py-1.5 text-right">{fmtKg(it.finalWeightKg)}</td>
                  <td className="py-1.5 text-right">{fmtRp(it.pricePerKg)}</td>
                  <td className="py-1.5 text-right font-bold">{fmtRp(it.subTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-900 font-black">
                <td colSpan={3} className="py-2 text-right text-base">TOTAL</td>
                <td className="py-2 text-right text-base">{fmtRp(selected.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-12 grid grid-cols-2 gap-8 text-sm text-center">
            <div><div className="h-16 border-b border-gray-400 mb-2" /><p>Pembeli</p></div>
            <div><div className="h-16 border-b border-gray-400 mb-2" /><p>Manager / Penjual</p></div>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 3: Pengiriman
// ═══════════════════════════════════════════════════════════════
const DeliveryModal = ({ order, isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  const [form, setForm]   = useState({
    driverName: '', vehicleNo: '', helperName: '',
    originAddress: '', destAddress: '', departedAt: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const isAdmin = ['SuperAdmin','Admin','Supervisor','Manager'].includes(session?.user?.role);

  const handleCreate = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/sales/cattle/${order.id}/delivery`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: data.message }); onRefresh?.(); }
      else        { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal.' }); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async (newStatus) => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/sales/cattle/${order.id}/delivery`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ status: newStatus, receivedBy: session?.user?.name }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: data.message }); onRefresh?.(); }
      else        { setMsg({ type: 'err', text: data.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen || !order) return null;
  const delivery = order.delivery;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><Truck size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Pengiriman</h3>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">{order.invoiceNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {msg && (
            <div className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {msg.type === 'ok' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {msg.text}
            </div>
          )}

          {/* Existing delivery info */}
          {delivery ? (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-[18px] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Surat Jalan</p>
                  <DelivBadge status={delivery.status} />
                </div>
                <p className="font-black text-slate-800 text-sm">{delivery.suratJalanNo}</p>
                {[
                  { l: 'Sopir',        v: delivery.driverName },
                  { l: 'Kendaraan',    v: delivery.vehicleNo  },
                  { l: 'Berangkat',    v: fmtDateTime(delivery.departedAt) },
                  { l: 'Diterima',     v: fmtDateTime(delivery.arrivedAt)  },
                  { l: 'Penerima',     v: delivery.receivedBy },
                ].filter((r) => r.v && r.v !== '-').map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">{r.l}</span>
                    <span className="text-[10px] font-bold text-slate-700">{r.v}</span>
                  </div>
                ))}
              </div>

              {isAdmin && delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED' && (
                <div className="flex gap-2">
                  {delivery.status === 'PENDING' && (
                    <button onClick={() => handleUpdateStatus('ON_DELIVERY')} disabled={saving}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-all disabled:opacity-50">
                      <Truck size={12} /> Berangkat
                    </button>
                  )}
                  {delivery.status === 'ON_DELIVERY' && (
                    <button onClick={() => handleUpdateStatus('DELIVERED')} disabled={saving}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1.5 hover:bg-green-700 transition-all disabled:opacity-50">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Sudah Diterima
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : isAdmin ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:'Nama Sopir',  k:'driverName',   ph:'Nama sopir' },
                  { l:'No. Kendaraan',k:'vehicleNo',   ph:'B 1234 ABC' },
                  { l:'Nama Kenek',  k:'helperName',   ph:'Opsional'   },
                  { l:'Tgl Berangkat',k:'departedAt',  ph:'',    type:'datetime-local' },
                  { l:'Asal Kandang',k:'originAddress',ph:'Alamat asal', col2:true },
                  { l:'Tujuan',      k:'destAddress',  ph:order.deliveryAddress||'Alamat tujuan', col2:true },
                ].map((f) => (
                  <div key={f.k} className={f.col2 ? 'col-span-2' : ''}>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">{f.l}</label>
                    <input type={f.type || 'text'} value={form[f.k]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
                  </div>
                ))}
              </div>
              <button onClick={handleCreate} disabled={saving}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#8da070] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />} Buat Surat Jalan
              </button>
            </>
          ) : (
            <p className="text-center text-slate-400 text-sm py-4">Belum ada data pengiriman.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const TabDelivery = ({ orders, loading, onRefresh }) => {
  const [selected, setSelected] = useState(null);
  const deliveryOrders = orders.filter((o) =>
    ['PENDING_MANAGER','COMPLETED'].includes(o.status)
  );

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deliveryOrders.length} Order Siap Kirim</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : deliveryOrders.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 border-2 border-dashed border-slate-100 text-center">
          <Truck size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada pengiriman aktif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveryOrders.map((order) => {
            const del = order.delivery;
            return (
              <div key={order.id}
                className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm hover:border-[#8da070]/30 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-black text-slate-800 text-[13px] uppercase italic">{order.invoiceNo}</p>
                    <p className="text-[10px] text-slate-400">{order.customer?.name || 'Pembeli Umum'} · {order.totalEkor} ekor</p>
                  </div>
                  {del ? <DelivBadge status={del.status} /> : (
                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200">Belum Ada SJ</span>
                  )}
                </div>

                {del && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { l:'SJ',       v: del.suratJalanNo },
                      { l:'Kendaraan',v: del.vehicleNo || '-' },
                      { l:'Sopir',    v: del.driverName || '-' },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-2">
                        <p className="text-[7px] font-black text-slate-400 uppercase">{s.l}</p>
                        <p className="text-[10px] font-black text-slate-700 truncate">{s.v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status timeline */}
                {del && (
                  <div className="flex items-center gap-2 mb-3">
                    {['PENDING','ON_DELIVERY','DELIVERED'].map((s, i) => {
                      const order_status = ['PENDING','ON_DELIVERY','DELIVERED'].indexOf(del.status);
                      const done   = i <= order_status;
                      const labels = ['Menunggu','Dalam Perjalanan','Diterima'];
                      return (
                        <React.Fragment key={s}>
                          <div className={`flex-1 h-1 rounded-full ${done ? 'bg-[#8da070]' : 'bg-slate-200'}`} />
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] border ${done ? 'bg-[#8da070] border-[#8da070] text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                              {done ? '✓' : i + 1}
                            </div>
                            <p className="text-[6px] text-slate-400 whitespace-nowrap">{labels[i]}</p>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                <button onClick={() => setSelected(order)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-[#8da070] hover:text-white text-slate-600 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Truck size={12} /> {del ? 'Update Status' : 'Buat Surat Jalan'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <DeliveryModal
        order={selected} isOpen={!!selected}
        onClose={() => setSelected(null)} onRefresh={() => { onRefresh(); setSelected(null); }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 4: Riwayat Harga Jual
// ═══════════════════════════════════════════════════════════════
const TabPriceHistory = () => {
  const [history,  setHistory]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [months,   setMonths]   = useState(6);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/cattle/price-history?months=${months}`);
      if (res.ok) { const d = await res.json(); setHistory(d.history ?? []); setSummary(d.summary ?? null); }
    } catch {}
    finally { setLoading(false); }
  }, [months]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const maxPrice = history.length > 0 ? Math.max(...history.map((h) => h.avgPricePerKg)) : 1;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {[3, 6, 12].map((m) => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${months === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
              {m} Bulan
            </button>
          ))}
        </div>
        <button onClick={fetchHistory} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#8da070] transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l:'Harga Terakhir', v: summary.latestAvgPrice ? fmtRp(summary.latestAvgPrice)+'/kg' : '-', icon:<DollarSign size={16}/>, color:'text-[#8da070]', bg:'bg-[#8da070]/10' },
            { l:'Tren Harga',     v: summary.trendLabel || '-', icon: summary.trend >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>, color: summary.trend >= 0 ? 'text-green-600':'text-red-600', bg: summary.trend >= 0 ? 'bg-green-50':'bg-red-50' },
            { l:'Total Transaksi',v: summary.totalOrders, icon:<BarChart3 size={16}/>, color:'text-blue-600', bg:'bg-blue-50' },
            { l:'Periode',        v: summary.periodLabel, icon:<Calendar size={16}/>, color:'text-slate-600', bg:'bg-slate-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={`${s.bg} ${s.color} p-2.5 rounded-xl shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase">{s.l}</p>
                <p className={`text-sm font-black ${s.color}`}>{s.v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-[#8da070]" /></div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-[28px] p-12 border-2 border-dashed border-slate-100 text-center">
          <TrendingUp size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-300 uppercase italic">Belum ada data harga historis</p>
          <p className="text-[10px] text-slate-200 mt-1">Data akan muncul setelah ada transaksi COMPLETED</p>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Rata-rata Harga Jual per kg</p>

          {/* Bar chart visual */}
          <div className="flex items-end gap-2 h-40 mb-3">
            {history.map((h, idx) => {
              const pct      = maxPrice > 0 ? (h.avgPricePerKg / maxPrice) * 100 : 0;
              const isLatest = idx === history.length - 1;
              const prev     = idx > 0 ? history[idx - 1].avgPricePerKg : h.avgPricePerKg;
              const trend    = h.avgPricePerKg >= prev ? 'up' : 'down';
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full" style={{ height: '100%' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700"
                      style={{
                        height   : `${pct}%`,
                        background: isLatest ? '#8da070' : trend === 'up' ? '#a3b88c' : '#c5d4ae',
                      }}
                    />
                  </div>
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none z-10">
                    {fmtRp(h.avgPricePerKg)}/kg
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2">
            {history.map((h) => (
              <div key={h.month} className="flex-1 text-center">
                <p className="text-[8px] text-slate-400 font-bold">{h.label}</p>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Bulan','Avg/kg','Min/kg','Max/kg','Ekor','Berat','Transaksi'].map((h) => (
                      <th key={h} className="py-2 px-2 text-left font-black text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => {
                    const prev  = idx > 0 ? history[idx - 1].avgPricePerKg : null;
                    const trend = prev ? (h.avgPricePerKg >= prev ? 'up' : 'down') : null;
                    return (
                      <tr key={h.month} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-1.5 px-2 font-black text-slate-700">{h.label}</td>
                        <td className="py-1.5 px-2 font-black text-[#8da070] flex items-center gap-1">
                          {fmtRp(h.avgPricePerKg)}
                          {trend === 'up'   && <TrendingUp   size={9} className="text-green-500" />}
                          {trend === 'down' && <TrendingDown size={9} className="text-red-400"   />}
                        </td>
                        <td className="py-1.5 px-2 text-slate-500">{fmtRp(h.minPricePerKg)}</td>
                        <td className="py-1.5 px-2 text-slate-500">{fmtRp(h.maxPricePerKg)}</td>
                        <td className="py-1.5 px-2 text-slate-500">{h.totalEkor}</td>
                        <td className="py-1.5 px-2 text-slate-500">{fmtKg(h.totalWeightKg)}</td>
                        <td className="py-1.5 px-2 text-slate-500">{h.transactionCount}x</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const CattleSalesPage = () => {
  const { data: session } = useSession();
  const [tab,        setTab]        = useState('orders');
  const [orders,     setOrders]     = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [summary,    setSummary]    = useState(null);

  const canCreate = ['SuperAdmin','Admin','Sales','Supervisor','Manager'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, wRes] = await Promise.all([
        fetch('/api/sales/cattle'),
        fetch('/api/warehouse?isKandang=true'),
      ]);
      if (oRes.ok) { const d = await oRes.json(); setOrders(d.orders ?? []); setSummary(d.summary ?? null); }
      if (wRes.ok) setWarehouses(await wRes.json());
    } catch (err) { console.error('CATTLE_SALES_FETCH:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const completedOrders  = orders.filter((o) => o.status === 'COMPLETED');
  const pendingOrders    = orders.filter((o) => !['COMPLETED','CANCELLED'].includes(o.status));
  const totalRevenue     = completedOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalEkorSold    = completedOrders.reduce((s, o) => s + o.totalEkor, 0);

  const TABS = [
    { key: 'orders',   label: 'Sales Orders',  icon: <Beef size={15} />           },
    { key: 'invoice',  label: 'Invoice',        icon: <FileSpreadsheet size={15} />},
    { key: 'delivery', label: 'Pengiriman',     icon: <Truck size={15} />          },
    { key: 'price',    label: 'Harga',          icon: <TrendingUp size={15} />     },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Penjualan Sapi Gemuk
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            Sales Order · Invoice · Delivery · Price Analytics
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="self-start p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#8da070] transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:'Total Order',      v: orders.length,       icon:<Beef size={18}/>,         color:'text-[#8da070]', bg:'bg-[#8da070]/10' },
          { l:'Menunggu Approval',v: pendingOrders.length,icon:<Clock size={18}/>,         color: pendingOrders.length > 0 ? 'text-amber-600':'text-slate-400', bg: pendingOrders.length > 0 ? 'bg-amber-50':'bg-slate-50' },
          { l:'Revenue Selesai',  v: fmtRp(totalRevenue), icon:<DollarSign size={18}/>,   color:'text-green-600', bg:'bg-green-50'     },
          { l:'Ekor Terjual',     v: totalEkorSold,       icon:<Scale size={18}/>,         color:'text-blue-600',  bg:'bg-blue-50'      },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className={`${s.bg} ${s.color} p-3 rounded-xl shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{s.l}</p>
              <p className="text-xl font-black text-gray-900 mt-0.5 leading-none">
                {loading ? <span className="inline-block h-5 w-12 bg-slate-100 animate-pulse rounded" /> : s.v}
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
          {tab === 'orders'   && <TabOrders   orders={orders} loading={loading} onRefresh={fetchData} canCreate={canCreate} warehouses={warehouses} />}
          {tab === 'invoice'  && <TabInvoice  orders={orders} loading={loading} />}
          {tab === 'delivery' && <TabDelivery orders={orders} loading={loading} onRefresh={fetchData} />}
          {tab === 'price'    && <TabPriceHistory />}
        </div>
      </div>
    </div>
  );
};

export default CattleSalesPage;
