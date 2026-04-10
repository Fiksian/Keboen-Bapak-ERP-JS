'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, Plus, Trash2, Save, Loader2, ShoppingCart,
  Tag, Percent, Truck, FileText, ChevronDown, Search,
  CheckCircle2, AlertCircle, Box, Info
} from 'lucide-react';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CREDIT', 'QRIS'];
const TAX_OPTIONS     = [
  { label: 'Tanpa PPN',  value: 0   },
  { label: 'PPN 11%',   value: 11  },
  { label: 'PPN 12%',   value: 12  },
];
const EMPTY_ITEM = { name: '', quantity: 1, price: 0, unit: '', discount: 0, notes: '', stockAvailable: null };

// ─── Stock Picker row ─────────────────────────────────────────────────────────
const ItemRow = ({ item, index, stocks, onUpdate, onRemove, canRemove }) => {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState('');

  const filtered = useMemo(() =>
    !q ? stocks.slice(0, 8)
       : stocks.filter(s => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
    [q, stocks]
  );

  const handleSelect = (stock) => {
    onUpdate(index, 'name',     stock.name);
    onUpdate(index, 'price',    parseFloat(stock.price) || 0);
    onUpdate(index, 'unit',     stock.unit || 'Unit');
    onUpdate(index, 'stockAvailable', stock.stock);
    setOpen(false);
    setQ('');
  };

  const subtotal = useMemo(() =>
    (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0) - (parseFloat(item.discount) || 0),
    [item.quantity, item.price, item.discount]
  );

  const isOverStock = item.stockAvailable !== null && parseFloat(item.quantity) > item.stockAvailable;

  return (
    <div className={`relative rounded-[24px] border transition-all ${isOverStock ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50/50'} p-4`}>
      {/* Remove button */}
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)}
          className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-full border border-red-100 transition-all z-10">
          <Trash2 size={12} />
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Product picker */}
        <div className="md:col-span-4 relative">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Produk *</label>
          <div
            onClick={() => setOpen(o => !o)}
            className={`flex items-center gap-2 w-full bg-white border rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
              item.name ? 'border-[#8da070]/40' : 'border-gray-200 hover:border-[#8da070]/30'
            }`}
          >
            <Box size={13} className={item.name ? 'text-[#8da070]' : 'text-gray-300'} />
            <span className={`flex-1 text-xs font-bold uppercase truncate ${item.name ? 'text-gray-800' : 'text-gray-400'}`}>
              {item.name || 'Pilih produk...'}
            </span>
            <ChevronDown size={13} className="text-gray-300 shrink-0" />
          </div>
          {open && (
            <div className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] flex flex-col">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none"
                    placeholder="Cari produk..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="overflow-y-auto">
                {filtered.length > 0 ? filtered.map(s => (
                  <div key={s.id} onClick={() => handleSelect(s)}
                    className="px-4 py-3 border-b border-gray-50 hover:bg-[#8da070] hover:text-white cursor-pointer flex justify-between items-center group transition-colors">
                    <div>
                      <p className="text-[11px] font-black uppercase">{s.name}</p>
                      <p className="text-[8px] opacity-60">{s.category} · Stok: {s.stock} {s.unit}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded group-hover:bg-white/20 ${
                      s.stock <= 0 ? 'text-red-400' : 'text-[#8da070] group-hover:text-white'
                    }`}>
                      {s.stock <= 0 ? 'HABIS' : `${s.stock} ${s.unit}`}
                    </span>
                  </div>
                )) : (
                  <div className="p-4 text-center text-[10px] text-gray-400 italic">Tidak ditemukan</div>
                )}
              </div>
            </div>
          )}
          {/* Stock warning */}
          {isOverStock && (
            <p className="flex items-center gap-1 mt-1 text-[9px] font-bold text-red-500">
              <AlertCircle size={10} /> Stok hanya {item.stockAvailable} {item.unit}
            </p>
          )}
          {item.name && !isOverStock && item.stockAvailable !== null && (
            <p className="flex items-center gap-1 mt-1 text-[9px] font-bold text-green-500">
              <CheckCircle2 size={10} /> Stok tersedia: {item.stockAvailable} {item.unit}
            </p>
          )}
        </div>

        {/* Qty */}
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Qty</label>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <input type="number" min="0.01" step="any"
              className="flex-1 px-3 py-2.5 text-xs font-black text-gray-800 bg-transparent border-none focus:ring-0 text-center min-w-0"
              value={item.quantity}
              onChange={e => onUpdate(index, 'quantity', e.target.value)}
            />
            <span className="text-[9px] font-black text-gray-400 pr-2 uppercase shrink-0">{item.unit || '-'}</span>
          </div>
        </div>

        {/* Harga */}
        <div className="md:col-span-3">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Harga / Unit (Rp)</label>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden px-3">
            <span className="text-[10px] font-bold text-gray-400">Rp</span>
            <input type="number" min="0" step="any"
              className="flex-1 py-2.5 text-xs font-black text-gray-800 bg-transparent border-none focus:ring-0 text-right min-w-0"
              value={item.price}
              onChange={e => onUpdate(index, 'price', e.target.value)}
            />
          </div>
        </div>

        {/* Diskon item */}
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Diskon Item (Rp)</label>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl overflow-hidden px-3">
            <span className="text-[10px] font-bold text-gray-300">-Rp</span>
            <input type="number" min="0" step="any"
              className="flex-1 py-2.5 text-xs font-black text-gray-800 bg-transparent border-none focus:ring-0 text-right min-w-0"
              value={item.discount}
              onChange={e => onUpdate(index, 'discount', e.target.value)}
            />
          </div>
        </div>

        {/* Subtotal item */}
        <div className="md:col-span-1 flex flex-col justify-end">
          <label className="text-[9px] font-black text-[#8da070] uppercase tracking-widest mb-1 block">Subtotal</label>
          <div className="bg-[#8da070]/10 border border-[#8da070]/20 rounded-xl px-3 py-2.5 text-right">
            <p className="text-xs font-black text-[#8da070] italic">
              {subtotal < 0 ? '-' : ''}Rp {Math.abs(subtotal).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================
const AddSalesModal = ({ isOpen, onClose, onRefresh }) => {
  const { data: session } = useSession();
  const [loading,  setLoading]  = useState(false);
  const [contacts, setContacts] = useState([]);
  const [stocks,   setStocks]   = useState([]);

  const [form, setForm] = useState({
    customerId:      '',
    discountPct:     0,
    taxPct:          0,
    shippingCost:    0,
    paymentMethod:   'CASH',
    dueDate:         '',
    notes:           '',
    salesNotes:      '',
    deliveryAddress: '',
    items:           [{ ...EMPTY_ITEM }],
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch('/api/contacts?type=CUSTOMER').then(r => r.ok ? r.json() : []),
      fetch('/api/stock').then(r => r.ok ? r.json() : []),
    ]).then(([c, s]) => { setContacts(c); setStocks(s); })
      .catch(console.error);
  }, [isOpen]);

  const updateItem = useCallback((index, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  }, []);

  const addItem    = () => setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  // ── Kalkulasi live ─────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const subtotal = form.items.reduce((s, i) => {
      return s + (parseFloat(i.quantity) || 0) * (parseFloat(i.price) || 0) - (parseFloat(i.discount) || 0);
    }, 0);
    const discVal  = subtotal * ((parseFloat(form.discountPct) || 0) / 100);
    const afterDisc = subtotal - discVal;
    const taxVal   = afterDisc * ((parseFloat(form.taxPct) || 0) / 100);
    const total    = afterDisc + taxVal + (parseFloat(form.shippingCost) || 0);
    return { subtotal, discVal, taxVal, total };
  }, [form.items, form.discountPct, form.taxPct, form.shippingCost]);

  const hasOverStock = form.items.some(i =>
    i.stockAvailable !== null && parseFloat(i.quantity) > i.stockAvailable
  );

  const isValid = form.items.length > 0
    && form.items.every(i => i.name && parseFloat(i.quantity) > 0 && parseFloat(i.price) >= 0)
    && !hasOverStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/penjualan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          totalAmount: calc.total,
          items: form.items.map(i => ({
            name:     i.name,
            quantity: parseFloat(i.quantity),
            price:    parseFloat(i.price),
            unit:     i.unit,
            discount: parseFloat(i.discount) || 0,
            notes:    i.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan transaksi');
      onRefresh();
      onClose();
      // Reset form
      setForm({
        customerId: '', discountPct: 0, taxPct: 0, shippingCost: 0,
        paymentMethod: 'CASH', dueDate: '', notes: '', salesNotes: '',
        deliveryAddress: '', items: [{ ...EMPTY_ITEM }],
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
              <p className="text-[9px] font-bold text-[#8da070] uppercase tracking-[0.15em]">Keboen Bapak · ERP System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 md:p-6 space-y-6">

            {/* ── Section 1: Customer & Delivery ─────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" /> Info Pelanggan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Pelanggan *</label>
                  <select required
                    className="w-full text-slate-700 px-4 py-3.5 bg-gray-50 rounded-2xl border border-transparent focus:border-[#8da070]/30 focus:bg-white text-sm font-bold transition-all appearance-none"
                    value={form.customerId}
                    onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Metode Pembayaran</label>
                  <div className="flex gap-2 flex-wrap">
                    {PAYMENT_METHODS.map(m => (
                      <button type="button" key={m}
                        onClick={() => setForm(p => ({ ...p, paymentMethod: m }))}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                          form.paymentMethod === m
                            ? 'bg-[#8da070] text-white border-[#8da070] shadow-md shadow-[#8da070]/20'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#8da070]/40'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 block">
                    <Truck size={11} /> Alamat Pengiriman
                  </label>
                  <input type="text" placeholder="Isi jika berbeda dari alamat customer..."
                    className="w-full px-4 py-3.5 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-medium text-gray-700 outline-none transition-all"
                    value={form.deliveryAddress}
                    onChange={e => setForm(p => ({ ...p, deliveryAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Jatuh Tempo</label>
                  <input type="date"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 outline-none transition-all"
                    value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Item list ────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-gray-200" /> Daftar Produk
                  <span className="ml-1 px-2 py-0.5 bg-[#8da070]/10 text-[#8da070] rounded-lg text-[9px]">
                    {form.items.length} item
                  </span>
                </h3>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#8da070] text-white rounded-xl text-[10px] font-black uppercase shadow-md shadow-[#8da070]/20 hover:bg-[#7a8c61] transition-all active:scale-95">
                  <Plus size={13} strokeWidth={3} /> Tambah Item
                </button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <ItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    stocks={stocks}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    canRemove={form.items.length > 1}
                  />
                ))}
              </div>

              {hasOverStock && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <p className="text-[11px] font-bold text-red-600">Beberapa item melebihi stok yang tersedia. Harap sesuaikan qty.</p>
                </div>
              )}
            </div>

            {/* ── Section 3: Pricing summary ──────────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" /> Ringkasan Harga
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Diskon order */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                    <Percent size={11} className="text-orange-500" /> Diskon Order (%)
                  </label>
                  <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden px-4">
                    <input type="number" min="0" max="100" step="0.1"
                      className="flex-1 py-3.5 text-sm font-black text-gray-800 bg-transparent border-none focus:ring-0"
                      value={form.discountPct}
                      onChange={e => setForm(p => ({ ...p, discountPct: e.target.value }))}
                    />
                    <span className="text-[10px] font-black text-gray-400">%</span>
                  </div>
                </div>

                {/* PPN */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                    <Tag size={11} className="text-blue-500" /> Pajak (PPN)
                  </label>
                  <div className="flex gap-2">
                    {TAX_OPTIONS.map(t => (
                      <button type="button" key={t.value}
                        onClick={() => setForm(p => ({ ...p, taxPct: t.value }))}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                          parseFloat(form.taxPct) === t.value
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ongkir */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                    <Truck size={11} className="text-purple-500" /> Biaya Pengiriman (Rp)
                  </label>
                  <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden px-4">
                    <span className="text-[10px] font-bold text-gray-400 mr-1">Rp</span>
                    <input type="number" min="0"
                      className="flex-1 py-3.5 text-sm font-black text-gray-800 bg-transparent border-none focus:ring-0 text-right"
                      value={form.shippingCost}
                      onChange={e => setForm(p => ({ ...p, shippingCost: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Live total breakdown */}
              <div className="bg-gray-900 rounded-[28px] p-6 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: 'Subtotal Item',   value: calc.subtotal,  color: 'text-gray-300' },
                    { label: `Diskon (${form.discountPct}%)`, value: -calc.discVal, color: 'text-orange-400' },
                    { label: `PPN (${form.taxPct}%)`, value: calc.taxVal, color: 'text-blue-400' },
                    { label: 'Biaya Kirim',      value: parseFloat(form.shippingCost) || 0, color: 'text-purple-400' },
                  ].filter(r => r.value !== 0).map((r, i) => (
                    <React.Fragment key={i}>
                      <span className="font-bold text-gray-500 uppercase tracking-wider">{r.label}</span>
                      <span className={`text-right font-black italic ${r.color}`}>
                        {r.value < 0 ? '-' : ''}Rp {Math.abs(r.value).toLocaleString('id-ID')}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-end">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Grand Total</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter">
                    <span className="text-sm font-normal text-gray-500 mr-2 not-italic">Rp</span>
                    {calc.total.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 4: Catatan ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Catatan untuk Customer</label>
                <textarea rows={2} placeholder="Catatan yang akan tercetak di invoice..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-medium text-gray-700 outline-none resize-none transition-all"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 block">
                  <Info size={11} /> Catatan Internal
                </label>
                <textarea rows={2} placeholder="Catatan internal tim (tidak tercetak di invoice)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-[#8da070]/30 focus:bg-white rounded-2xl text-sm font-medium text-gray-700 outline-none resize-none transition-all"
                  value={form.salesNotes}
                  onChange={e => setForm(p => ({ ...p, salesNotes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">
              Batal
            </button>
            <button type="submit" disabled={loading || !isValid}
              className="flex-[3] flex items-center justify-center gap-2 px-10 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#8da070]/30 hover:bg-[#7a8c61] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {loading ? 'Menyimpan...' : `Simpan Sales Order · Rp ${calc.total.toLocaleString('id-ID')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesModal;