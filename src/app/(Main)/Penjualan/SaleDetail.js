'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, User, Calendar, Package, CheckCircle, AlertCircle,
  Tag, FileText, ArrowLeft, Truck, CreditCard, Info, Shield,
  ShieldCheck, ChevronDown, ChevronUp, Layers, DollarSign,
  TrendingUp, Loader2, Warehouse, RefreshCw
} from 'lucide-react';
import PrintSalesNote from '@/app/(Main)/Components/NotaPenjualan/page.js';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING_SALES:    { label: 'Menunggu Sales',     cls: 'bg-orange-50 text-orange-600 border-orange-200', step: 0, pulse: true  },
  PENDING_ADMIN:    { label: 'Menunggu Admin',     cls: 'bg-amber-50 text-amber-700 border-amber-200',   step: 1, pulse: true  },
  PENDING_SUPERVISOR: { label: 'Menunggu SPV',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', step: 2, pulse: true  },
  PENDING_MANAGER:  { label: 'Menunggu Manager',  cls: 'bg-blue-50 text-blue-700 border-blue-200',       step: 3, pulse: true  },
  COMPLETED:        { label: 'Selesai',           cls: 'bg-green-50 text-green-700 border-green-200',    step: 4, pulse: false },
  CANCELLED:        { label: 'Dibatalkan',        cls: 'bg-red-50 text-red-600 border-red-200',          step: -1, pulse: false },
  PENDING:          { label: 'Pending',           cls: 'bg-amber-50 text-amber-600 border-amber-200',    step: 0, pulse: true  },
};
const STAGE_LABELS = ['Sales', 'Admin', 'Supervisor', 'Manager'];

const fmtRp   = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtQty  = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.cls.includes('green') ? 'bg-green-500' : cfg.cls.includes('red') ? 'bg-red-400' : 'bg-amber-400'} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ─── Approval Stepper ────────────────────────────────────────────────────────
const ApprovalStepper = ({ status, sale }) => {
  const cfg     = STATUS_CFG[status] || STATUS_CFG.PENDING_SALES;
  const current = cfg.step;

  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
      <X size={13} className="text-red-500 shrink-0" />
      <div>
        <p className="text-[10px] font-black text-red-600 uppercase">Dibatalkan</p>
        {sale.rejectedBy     && <p className="text-[9px] text-red-400">Oleh: {sale.rejectedBy}</p>}
        {sale.rejectedNotes  && <p className="text-[9px] text-red-400 italic">{sale.rejectedNotes}</p>}
      </div>
    </div>
  );

  const stamps = [
    { by: sale.salesApprovedBy,       at: sale.salesApprovedAt,      label: 'Sales'      },
    { by: sale.adminApprovedBy,       at: sale.adminApprovedAt,      label: 'Admin'      },
    { by: sale.supervisorApprovedBy,  at: sale.supervisorApprovedAt, label: 'Supervisor' },
    { by: sale.managerApprovedBy,     at: sale.managerApprovedAt,    label: 'Manager'    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0.5">
        {STAGE_LABELS.map((label, i) => {
          const done   = status === 'COMPLETED' || i < current;
          const active = i === current && !['COMPLETED','CANCELLED'].includes(status);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black border-2 transition-all ${
                  done   ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-[#8da070] border-[#8da070] text-white animate-pulse' :
                           'bg-white border-gray-200 text-gray-300'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <p className={`text-[7px] font-black uppercase whitespace-nowrap ${done || active ? 'text-green-600' : 'text-gray-300'}`}>{label}</p>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mb-3.5 rounded-full mx-0.5 ${done ? 'bg-green-400' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
      <div className="space-y-1">
        {stamps.filter(s => s.by).map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[8px]">
            <CheckCircle size={9} className="text-green-500 shrink-0" />
            <span className="font-black text-gray-600">{s.label}: {s.by}</span>
            {s.at && <span className="text-gray-400">{new Date(s.at).toLocaleDateString('id-ID')}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Batch Traceability section ───────────────────────────────────────────────
const BatchTrace = ({ items }) => {
  const [open, setOpen] = useState(false);
  const hasAlloc = items?.some(i => (i.batchAllocation || []).length > 0);
  if (!hasAlloc) return null;

  return (
    <div className="border border-indigo-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
        <span className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
          <Layers size={13} /> Traceability Batch FIFO
        </span>
        {open ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-indigo-400" />}
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-white">
          {items?.map((item, idx) => {
            const alloc = item.batchAllocation || [];
            if (!alloc.length) return null;
            return (
              <div key={idx}>
                <p className="text-[9px] font-black text-gray-500 uppercase mb-1.5">{item.productName}</p>
                <div className="space-y-1.5">
                  {alloc.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl text-[9px]">
                      <span className="font-black text-indigo-600">{a.batchNo}</span>
                      <span className="text-gray-400">|</span>
                      <span className="font-bold text-gray-600">{a.supplier || '-'}</span>
                      <span className="text-gray-400">|</span>
                      <span className="font-bold text-gray-600">PO: {a.noPO || '-'}</span>
                      <span className="text-gray-400 ml-auto">-{fmtQty(a.qty)} {item.unit}</span>
                      {a.price && a.price !== "0" && (
                        <span className="text-amber-600 font-black">@{fmtRp(a.price)}</span>
                      )}
                    </div>
                  ))}
                </div>
                {item.totalCost > 0 && (
                  <div className="mt-1 flex gap-3 text-[9px]">
                    <span className="text-gray-400">HPP: <strong className="text-amber-600">{fmtRp(item.totalCost)}</strong></span>
                    <span className="text-gray-400">Margin: <strong className={item.margin >= 0 ? 'text-green-600' : 'text-red-500'}>{fmtRp(item.margin)}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Approval Modal ──────────────────────────────────────────────────────────
const ApprovalModal = ({ sale, onClose, onDone }) => {
  const { data: session } = useSession();
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const role = session?.user?.role;

  const canSales      = sale.status === 'PENDING_SALES'      && ['Sales','Admin','Supervisor','Manager','SuperAdmin'].includes(role);
  const canAdmin      = sale.status === 'PENDING_ADMIN'      && ['Admin','SuperAdmin'].includes(role);
  const canSupervisor = sale.status === 'PENDING_SUPERVISOR' && ['Supervisor','SuperAdmin'].includes(role);
  const canManager    = sale.status === 'PENDING_MANAGER'    && ['Manager','SuperAdmin'].includes(role);
  const canReject     = !['COMPLETED','CANCELLED'].includes(sale.status)
                        && ['Admin','Sales','Supervisor','Manager','SuperAdmin'].includes(role);

  const doApprove = async (stage) => {
    setLoading(stage);
    try {
      const res  = await fetch(`/api/penjualan/${sale.dbId}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      onDone();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(''); }
  };

  const doReject = async () => {
    if (!notes.trim()) { alert('Isi alasan penolakan.'); return; }
    await doApprove('reject');
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className={`p-5 flex justify-between items-start shrink-0 ${sale.status === 'COMPLETED' ? 'bg-green-50' : sale.status === 'CANCELLED' ? 'bg-red-50' : 'bg-amber-50/50'}`}>
          <div>
            <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{sale.id}</p>
            <p className="text-[9px] font-bold text-gray-500 mt-0.5">{sale.customer}</p>
            <StatusBadge status={sale.status} />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full"><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <ApprovalStepper status={sale.status} sale={sale} />
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              { label: 'Total',   value: fmtRp(sale.total)   },
              { label: 'Channel', value: sale.saleType || 'REGULAR' },
              { label: 'HPP Est.', value: sale.items?.reduce((s, i) => s + (i.totalCost || 0), 0) > 0
                ? fmtRp(sale.items?.reduce((s, i) => s + (i.totalCost || 0), 0)) : '-' },
              { label: 'Pembayaran', value: sale.paymentMethod || 'CASH' },
            ].map((m, i) => (
              <div key={i} className="p-2.5 bg-gray-50 rounded-xl">
                <p className="text-[8px] font-black text-gray-400 uppercase">{m.label}</p>
                <p className="text-[11px] font-black text-gray-800 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
          {(canSales || canAdmin || canSupervisor || canManager || (canReject && rejectMode)) && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                {rejectMode ? 'Alasan Penolakan *' : 'Catatan Approval (Opsional)'}
              </label>
              <textarea rows={2}
                className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-[11px] font-medium text-gray-800 outline-none resize-none focus:ring-2 ${rejectMode ? 'border-red-200 focus:ring-red-100' : 'border-gray-100 focus:ring-[#8da070]/20'}`}
                placeholder={rejectMode ? 'Tulis alasan...' : 'Catatan tambahan...'}
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
        {(canSales || canAdmin || canSupervisor || canManager || canReject) && (
          <div className="p-5 border-t bg-gray-50 space-y-2 shrink-0">
            {!rejectMode ? (
              <div className="flex gap-2">
                {canSales && (
                  <button onClick={() => doApprove('sales')} disabled={!!loading}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
                    {loading === 'sales' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Sales
                  </button>
                )}
                {canAdmin && (
                  <button onClick={() => doApprove('admin')} disabled={!!loading}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
                    {loading === 'admin' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Admin
                  </button>
                )}
                {canSupervisor && (
                  <button onClick={() => doApprove('supervisor')} disabled={!!loading}
                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
                    {loading === 'supervisor' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} SPV
                  </button>
                )}
                {canManager && (
                  <button onClick={() => doApprove('manager')} disabled={!!loading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
                    {loading === 'manager' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />} Final
                  </button>
                )}
                {canReject && (
                  <button onClick={() => setRejectMode(true)}
                    className="px-3 py-3 bg-red-50 text-red-500 border border-red-200 rounded-2xl font-black hover:bg-red-100 transition-all">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={doReject} disabled={!!loading || !notes.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50">
                  {loading === 'reject' ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />} Tolak
                </button>
                <button onClick={() => { setRejectMode(false); setNotes(''); }}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-200">
                  Batal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main SaleDetail ──────────────────────────────────────────────────────────
const SaleDetail = ({ isOpen, sale, onClose, onRefresh }) => {
  const { data: session }  = useSession();
  const [showInvoice, setShowInvoice] = useState(false);
  const [showApproval, setShowApproval] = useState(false);

  const canManage = ['Admin', 'Sales', 'Supervisor', 'Manager', 'SuperAdmin'].includes(session?.user?.role);
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(session?.user?.role);
  const isRegular = (sale?.saleType || 'REGULAR') === 'REGULAR';
  const isPending = !['COMPLETED', 'CANCELLED'].includes(sale?.status);

  if (!isOpen || !sale) return null;

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
            invoiceId:    sale.id, createdAt: sale.createdAt, dueDate: sale.dueDate,
            customer:     { name: sale.customer, address: sale.customerAddress, phone: sale.customerPhone },
            deliveryAddress: sale.deliveryAddress,
            items:        sale.items, subtotal: sale.subtotal,
            discount:     sale.discount, discountPct: sale.discountPct,
            taxPct:       sale.taxPct, taxAmount: sale.taxAmount,
            shippingCost: sale.shippingCost, totalAmount: sale.total,
            paymentMethod: sale.paymentMethod, status: sale.status, notes: sale.notes,
          }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {showApproval && (
        <ApprovalModal sale={sale} onClose={() => setShowApproval(false)} onDone={() => { setShowApproval(false); onRefresh?.(); }} />
      )}

      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in duration-300">

          {/* Header */}
          <div className={`p-5 md:p-6 border-b border-gray-100 flex justify-between items-center shrink-0 ${
            sale.status === 'COMPLETED' ? 'bg-green-50/50' : sale.status === 'CANCELLED' ? 'bg-red-50/30' : 'bg-amber-50/30'}`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Detail Transaksi</h2>
                <StatusBadge status={sale.status} />
                {(sale.saleType || 'REGULAR') === 'DIRECT' && (
                  <span className="text-[8px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-lg uppercase">Direct</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#8da070] tracking-[0.15em] uppercase">{sale.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {sale.status === 'COMPLETED' && (
                <button onClick={() => setShowInvoice(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#8da070]/10 text-[#8da070] border border-[#8da070]/20 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#8da070] hover:text-white transition-all">
                  <FileText size={16} /> <span className="hidden sm:inline">Cetak Nota</span>
                </button>
              )}
              {canManage && isPending && isRegular && (
                <button onClick={() => setShowApproval(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-500 hover:text-white transition-all">
                  <ShieldCheck size={16} /> Approval
                </button>
              )}
              <button onClick={onClose}
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* Approval stepper (hanya untuk REGULAR) */}
            {isRegular && (
              <div className="px-5 md:px-6 pt-5">
                <ApprovalStepper status={sale.status} sale={sale} />
              </div>
            )}

            {/* Info cards */}
            <div className="p-5 md:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: User,       color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Pelanggan',  value: sale.customer },
                { icon: Calendar,   color: 'text-orange-500', bg: 'bg-orange-50', label: 'Tanggal',    value: fmtDate(sale.createdAt) },
                { icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Pembayaran', value: sale.paymentMethod || 'CASH' },
              ].map((info, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-3 shadow-sm">
                  <div className={`p-2 ${info.bg} rounded-xl shrink-0`}>
                    <info.icon size={16} className={info.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{info.label}</p>
                    <p className="text-[12px] font-black text-gray-800 uppercase tracking-tight mt-0.5 truncate">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="px-5 md:px-6 mb-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Package size={13} className="text-[#8da070]" /> Rincian Produk
              </h3>
              <div className="border border-gray-100 rounded-[24px] overflow-hidden">
                <table className="w-full text-left hidden sm:table">
                  <thead className="bg-gray-50/50">
                    <tr>
                      {['Produk','Qty','Harga','Subtotal','HPP','Margin'].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase italic">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sale.items?.map((item, idx) => {
                      const sub    = item.subtotal || item.quantity * item.price;
                      const margin = item.margin ?? (sub - (item.totalCost || 0));
                      return (
                        <tr key={idx} className="hover:bg-gray-50/30">
                          <td className="px-4 py-3.5 text-sm font-bold text-gray-700 max-w-[160px] truncate">{item.productName}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-gray-900 text-center">{fmtQty(item.quantity)} {item.unit}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-gray-900">{fmtRp(item.price)}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-[#8da070] italic">{fmtRp(sub)}</td>
                          <td className="px-4 py-3.5 text-[10px] font-bold text-amber-600">{item.totalCost > 0 ? fmtRp(item.totalCost) : '-'}</td>
                          <td className={`px-4 py-3.5 text-[10px] font-black ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {item.totalCost > 0 ? fmtRp(margin) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Mobile */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {sale.items?.map((item, idx) => (
                    <div key={idx} className="p-4">
                      <p className="text-sm font-black text-gray-800 uppercase">{item.productName}</p>
                      <div className="flex justify-between mt-1 text-[10px] font-bold text-gray-400">
                        <span>{fmtQty(item.quantity)} {item.unit} × {fmtRp(item.price)}</span>
                        <span className="text-[#8da070] font-black">{fmtRp(item.subtotal || item.quantity * item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch traceability */}
            <div className="px-5 md:px-6 mb-4">
              <BatchTrace items={sale.items} />
            </div>

            {/* Price breakdown */}
            <div className="px-5 md:px-6 mb-4">
              <div className="bg-gray-900 rounded-[28px] p-6 space-y-2">
                {[
                  ...(sale.discountPct > 0 ? [{ label: `Diskon (${sale.discountPct}%)`, value: `-${fmtRp(sale.discount)}`, color: 'text-orange-400' }] : []),
                  ...(sale.taxPct > 0 ? [{ label: `PPN (${sale.taxPct}%)`, value: fmtRp(sale.taxAmount), color: 'text-blue-400' }] : []),
                  ...(sale.shippingCost > 0 ? [{ label: 'Biaya Kirim', value: fmtRp(sale.shippingCost), color: 'text-purple-400' }] : []),
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">{r.label}</span>
                    <span className={`font-black italic ${r.color}`}>{r.value}</span>
                  </div>
                ))}
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
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Catatan</p>
                  <p className="text-sm font-medium text-gray-600 italic">{sale.notes}</p>
                </div>
              </div>
            )}
            {sale.salesNotes && isAdmin && (
              <div className="px-5 md:px-6 mb-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Info size={10} /> Catatan Internal (Admin)
                  </p>
                  <p className="text-sm font-medium text-gray-600 italic">{sale.salesNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SaleDetail;