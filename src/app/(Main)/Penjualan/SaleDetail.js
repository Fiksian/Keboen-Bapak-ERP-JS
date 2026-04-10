'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, User, Calendar, Package, CheckCircle, AlertCircle,
  Tag, FileText, ArrowLeft, Truck, Percent, DollarSign,
  Clock, MapPin, CreditCard, Info, Shield
} from 'lucide-react';
import PrintSalesNote from '@/app/(Main)/Components/NotaPenjualan/page.js';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = {
    PENDING:   { cls: 'bg-amber-50 text-amber-600 border-amber-200',   dot: 'bg-amber-400',   label: 'Pending',   pulse: true  },
    COMPLETED: { cls: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500',   label: 'Selesai',   pulse: false },
    CANCELLED: { cls: 'bg-red-50  text-red-600   border-red-200',     dot: 'bg-red-400',     label: 'Dibatalkan',pulse: false },
  }[status] || { cls: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-400', label: status, pulse: false };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cfg.cls} ${size === 'lg' ? 'px-4 py-2 text-xs' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ─── Divider row ─────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, bold = false, accent = false }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`text-[12px] font-${bold ? 'black' : 'bold'} ${accent ? 'text-[#8da070] italic' : 'text-gray-800'}`}>{value}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const SaleDetail = ({ isOpen, sale, onClose, onStatusUpdate }) => {
  const { data: session } = useSession();
  const [showInvoice,  setShowInvoice]  = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { action, label }
  const [loading,      setLoading]      = useState(false);
  const [payMethod,    setPayMethod]    = useState('CASH');

  const canManage = ['Admin', 'Sales', 'Supervisor'].includes(session?.user?.role);
  const isAdmin   = session?.user?.role === 'Admin';

  if (!isOpen || !sale) return null;

  // ── Cetak nota (fullscreen PDF view) ────────────────────────────────────────
  if (showInvoice) {
    return (
      <div className="fixed inset-0 z-[250] bg-white flex flex-col animate-in fade-in duration-300">
        <div className="h-14 px-6 bg-[#1a1c18] flex items-center justify-between shrink-0 shadow-md">
          <button onClick={() => setShowInvoice(false)}
            className="flex items-center gap-3 text-white/80 hover:text-white transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase text-[10px] tracking-[0.2em]">Tutup Pratinjau</span>
          </button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{sale.id}</span>
        </div>
        <div className="flex-1 w-full bg-slate-100">
          <PrintSalesNote data={{
            invoiceId:       sale.id,
            createdAt:       sale.createdAt,
            dueDate:         sale.dueDate,
            customer:        { name: sale.customer, address: sale.customerAddress, phone: sale.customerPhone },
            deliveryAddress: sale.deliveryAddress,
            items:           sale.items,
            subtotal:        sale.subtotal,
            discount:        sale.discount,
            discountPct:     sale.discountPct,
            taxPct:          sale.taxPct,
            taxAmount:       sale.taxAmount,
            shippingCost:    sale.shippingCost,
            totalAmount:     sale.total,
            paymentMethod:   sale.paymentMethod,
            status:          sale.status,
            notes:           sale.notes,
          }} />
        </div>
      </div>
    );
  }

  // ── Confirm action modal ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmModal) return;
    setLoading(true);
    try {
      await onStatusUpdate(sale.id, confirmModal.action, payMethod);
    } finally {
      setLoading(false);
      setConfirmModal(null);
    }
  };

  const fmtCurrency = (val) => `Rp ${(parseFloat(val) || 0).toLocaleString('id-ID')}`;
  const fmtDate     = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  return (
    <>
      {/* ── Main detail modal ───────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in duration-300">

          {/* Header */}
          <div className={`p-5 md:p-6 border-b border-gray-100 flex justify-between items-center shrink-0 ${
            sale.status === 'COMPLETED' ? 'bg-green-50/50' :
            sale.status === 'CANCELLED' ? 'bg-red-50/30'   : 'bg-amber-50/30'
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Detail Transaksi</h2>
                <StatusBadge status={sale.status} />
              </div>
              <p className="text-[10px] font-bold text-[#8da070] tracking-[0.15em] uppercase">{sale.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {sale.status === 'COMPLETED' && (
                <button onClick={() => setShowInvoice(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#8da070]/10 text-[#8da070] border border-[#8da070]/20 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#8da070] hover:text-white transition-all shadow-sm">
                  <FileText size={16} /> <span className="hidden sm:inline">Cetak Nota</span>
                </button>
              )}
              <button onClick={onClose}
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 active:scale-90 transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* Info Grid */}
            <div className="p-5 md:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: User,        color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Pelanggan',    value: sale.customer },
                { icon: Calendar,    color: 'text-orange-500', bg: 'bg-orange-50', label: 'Tanggal SO',   value: fmtDate(sale.createdAt) },
                { icon: CreditCard,  color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pembayaran',   value: sale.paymentMethod || 'CASH' },
                ...(sale.paidAt ? [{ icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Lunas Tgl', value: fmtDate(sale.paidAt) }] : []),
                ...(sale.dueDate ? [{ icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Jatuh Tempo', value: fmtDate(sale.dueDate) }] : []),
                ...(sale.createdBy ? [{ icon: Shield, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Dibuat Oleh', value: sale.createdBy }] : []),
              ].map((info, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-3 shadow-sm">
                  <div className={`p-2 ${info.bg} rounded-xl shrink-0`}>
                    <info.icon size={16} className={info.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{info.label}</p>
                    <p className="text-[12px] font-black text-gray-800 uppercase tracking-tight mt-0.5 truncate">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            {sale.deliveryAddress && (
              <div className="px-5 md:px-6 mb-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Alamat Pengiriman</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{sale.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Items table */}
            <div className="px-5 md:px-6 mb-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Package size={14} className="text-[#8da070]" /> Rincian Produk ({sale.items?.length})
              </h3>

              {/* Desktop */}
              <div className="hidden sm:block border border-gray-100 rounded-[24px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      {['Produk', 'Qty', 'Satuan', 'Harga', 'Diskon', 'Subtotal'].map(h => (
                        <th key={h} className={`px-5 py-3.5 text-[9px] font-black text-gray-400 uppercase tracking-widest italic ${['Harga','Diskon','Subtotal'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sale.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-4 text-sm font-bold text-gray-700 max-w-[180px] truncate">{item.productName}</td>
                        <td className="px-5 py-4 text-sm font-black text-gray-900 text-center">{item.quantity}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[9px] font-black text-gray-500 uppercase rounded-lg">
                            <Tag size={9} /> {item.unit || 'Unit'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-gray-800 text-right">{fmtCurrency(item.price)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-orange-500 text-right">
                          {parseFloat(item.discount) > 0 ? `-${fmtCurrency(item.discount)}` : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-[#8da070] text-right italic">
                          {fmtCurrency(item.subtotal || (item.quantity * item.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden space-y-2">
                {sale.items?.map((item, idx) => (
                  <div key={idx} className="bg-gray-50/50 border border-gray-100 p-4 rounded-[20px]">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-black text-gray-800 uppercase">{item.productName}</p>
                      <p className="text-sm font-black text-[#8da070] italic">{fmtCurrency(item.subtotal || item.quantity * item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                      <span>{item.quantity} {item.unit}</span>
                      <span>×</span>
                      <span>{fmtCurrency(item.price)}</span>
                      {parseFloat(item.discount) > 0 && <span className="text-orange-400">-{fmtCurrency(item.discount)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="px-5 md:px-6 mb-4">
              <div className="bg-gray-900 rounded-[28px] p-6 space-y-2">
                <InfoRow label="Subtotal"
                  value={fmtCurrency(sale.subtotal || sale.total)} />
                {parseFloat(sale.discountPct) > 0 && (
                  <InfoRow label={`Diskon Order (${sale.discountPct}%)`}
                    value={`-${fmtCurrency(sale.discount)}`} />
                )}
                {parseFloat(sale.taxPct) > 0 && (
                  <InfoRow label={`PPN (${sale.taxPct}%)`}
                    value={fmtCurrency(sale.taxAmount)} />
                )}
                {parseFloat(sale.shippingCost) > 0 && (
                  <InfoRow label="Biaya Kirim" value={fmtCurrency(sale.shippingCost)} />
                )}
                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-2xl font-black text-white italic tracking-tighter">
                    <span className="text-xs font-normal text-gray-500 mr-1 not-italic">Rp</span>
                    {(sale.total || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="px-5 md:px-6 mb-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Catatan Customer</p>
                  <p className="text-sm font-medium text-gray-600 italic leading-relaxed">{sale.notes}</p>
                </div>
              </div>
            )}
            {sale.salesNotes && isAdmin && (
              <div className="px-5 md:px-6 mb-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Info size={10} /> Catatan Internal (Admin only)
                  </p>
                  <p className="text-sm font-medium text-gray-600 italic leading-relaxed">{sale.salesNotes}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {canManage && (
              <div className="px-5 md:px-6 pb-6">
                {sale.status === 'PENDING' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => setConfirmModal({ action: 'COMPLETED', label: 'Selesaikan' })}
                      className="flex items-center justify-center gap-3 py-4 bg-[#8da070] hover:bg-[#7a8c61] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-[#8da070]/20 active:scale-95">
                      <CheckCircle size={18} /> Selesaikan & Catat Income
                    </button>
                    <button onClick={() => setConfirmModal({ action: 'CANCELLED', label: 'Batalkan' })}
                      className="flex items-center justify-center gap-3 py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
                      <AlertCircle size={18} /> Batalkan & Kembalikan Stok
                    </button>
                  </div>
                ) : (
                  <div className={`p-5 rounded-[24px] border flex items-start gap-4 ${
                    sale.status === 'COMPLETED'
                      ? 'bg-green-50 border-green-100 text-green-700'
                      : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {sale.status === 'COMPLETED'
                      ? <CheckCircle size={22} className="shrink-0 mt-0.5" />
                      : <AlertCircle size={22} className="shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">
                        {sale.status === 'COMPLETED' ? '✓ Transaksi Selesai' : 'Transaksi Dibatalkan'}
                      </p>
                      <p className="text-[11px] font-bold mt-1 opacity-70 leading-relaxed">
                        {sale.status === 'COMPLETED'
                          ? `Dana telah dicatat sebagai Income. ${sale.paidAt ? `Dibayar: ${fmtDate(sale.paidAt)}` : ''}`
                          : 'Stok telah dikembalikan ke inventori.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm modal ──────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmModal.action === 'COMPLETED' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {confirmModal.action === 'COMPLETED'
                ? <CheckCircle size={28} className="text-green-500" />
                : <AlertCircle size={28} className="text-red-500"   />
              }
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight text-center mb-1">
              {confirmModal.action === 'COMPLETED' ? 'Selesaikan Pesanan?' : 'Batalkan Pesanan?'}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 text-center leading-relaxed mb-5">
              {confirmModal.action === 'COMPLETED'
                ? `Pesanan ${sale.id} akan ditandai selesai dan Rp ${sale.total.toLocaleString('id-ID')} dicatat sebagai Income.`
                : `Pesanan ${sale.id} akan dibatalkan dan semua stok dikembalikan ke inventori.`
              }
            </p>

            {confirmModal.action === 'COMPLETED' && (
              <div className="mb-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CASH', 'TRANSFER', 'CREDIT', 'QRIS'].map(m => (
                    <button type="button" key={m}
                      onClick={() => setPayMethod(m)}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        payMethod === m
                          ? 'bg-[#8da070] text-white border-[#8da070]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#8da070]/30'
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} disabled={loading}
                className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                Batal
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className={`flex-[2] py-3.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${
                  confirmModal.action === 'COMPLETED'
                    ? 'bg-[#8da070] hover:bg-[#7a8c61] shadow-[#8da070]/30'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                }`}>
                {loading
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Memproses...</>
                  : confirmModal.label
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaleDetail;