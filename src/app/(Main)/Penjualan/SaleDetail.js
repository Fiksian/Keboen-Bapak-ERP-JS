'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  X, User, Calendar, Package, CheckCircle, AlertCircle,
  Tag, FileText, ArrowLeft, Truck, CreditCard, Info,
  ShieldCheck, ChevronDown, ChevronUp, Layers, Loader2,
  Warehouse, TrendingUp, DollarSign
} from 'lucide-react';
import PrintSalesNote from '@/app/(Main)/Components/NotaPenjualan/page.js';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING_SALES:    { label: 'Menunggu Sales',   cls: 'bg-orange-50 text-orange-600 border-orange-200', step: 0, dot: 'bg-orange-400' },
  PENDING_ADMIN:    { label: 'Menunggu Admin',   cls: 'bg-amber-50 text-amber-700 border-amber-200',   step: 1, dot: 'bg-amber-400'   },
  PENDING_SUPERVISOR: { label: 'Menunggu SPV',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', step: 2, dot: 'bg-yellow-400'  },
  PENDING_MANAGER:  { label: 'Menunggu Manager', cls: 'bg-blue-50 text-blue-700 border-blue-200',      step: 3, dot: 'bg-blue-400'    },
  COMPLETED:        { label: 'Selesai',          cls: 'bg-green-50 text-green-700 border-green-200',   step: 4, dot: 'bg-green-500'   },
  CANCELLED:        { label: 'Dibatalkan',       cls: 'bg-red-50 text-red-600 border-red-200',         step: -1, dot: 'bg-red-400'   },
  PENDING:          { label: 'Pending',          cls: 'bg-amber-50 text-amber-600 border-amber-200',   step: 0, dot: 'bg-amber-400'   },
};
const STAGE_LABELS = ['Sales', 'Admin', 'Supervisor', 'Manager'];

const fmtRp   = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtQty  = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${!['COMPLETED','CANCELLED'].includes(status) ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ─── Approval Stepper ─────────────────────────────────────────────────────────
const ApprovalStepper = ({ localSale }) => {
  const { status } = localSale;
  const cfg     = STATUS_CFG[status] || STATUS_CFG.PENDING_SALES;
  const current = cfg.step;

  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
      <X size={13} className="text-red-500 shrink-0" />
      <div>
        <p className="text-[10px] font-black text-red-600 uppercase">Dibatalkan</p>
        {localSale.rejectedBy    && <p className="text-[9px] text-red-400">Oleh: {localSale.rejectedBy}</p>}
        {localSale.rejectedNotes && <p className="text-[9px] text-red-400 italic">{localSale.rejectedNotes}</p>}
      </div>
    </div>
  );

  const stamps = [
    { by: localSale.salesApprovedBy,       at: localSale.salesApprovedAt      },
    { by: localSale.adminApprovedBy,       at: localSale.adminApprovedAt      },
    { by: localSale.supervisorApprovedBy,  at: localSale.supervisorApprovedAt },
    { by: localSale.managerApprovedBy,     at: localSale.managerApprovedAt    },
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
                           'bg-white border-gray-200 text-gray-300'
                }`}>
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
            <span className="font-black text-gray-600">{STAGE_LABELS[i]}: {s.by}</span>
            {s.at && <span className="text-gray-400">{new Date(s.at).toLocaleDateString('id-ID')}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Batch Traceability ────────────────────────────────────────────────────────
const BatchTrace = ({ items }) => {
  const [open, setOpen] = useState(false);
  const hasAlloc = items?.some(i => {
    try { const a = JSON.parse(i.batchAllocation || '[]'); return a.length > 0; }
    catch { return false; }
  });
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
            let alloc = [];
            try { alloc = JSON.parse(item.batchAllocation || '[]'); } catch { alloc = []; }
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
                      <span className="text-gray-500">PO: {a.noPO || '-'}</span>
                      <span className="text-gray-400 ml-auto">-{fmtQty(a.qty)} {item.unit}</span>
                      {a.price && a.price !== '0' && (
                        <span className="text-amber-600 font-black">@{fmtRp(a.price)}</span>
                      )}
                    </div>
                  ))}
                </div>
                {(item.totalCost > 0) && (
                  <div className="mt-1 flex gap-3 text-[9px]">
                    <span className="text-gray-400">HPP: <strong className="text-amber-600">{fmtRp(item.totalCost)}</strong></span>
                    {item.margin != null && (
                      <span className="text-gray-400">Margin: <strong className={item.margin >= 0 ? 'text-green-600' : 'text-red-500'}>{fmtRp(item.margin)}</strong></span>
                    )}
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

// ─── Approval Modal — Optimistic UI ──────────────────────────────────────────
//
// PERUBAHAN UTAMA:
//   1. Tombol disabled saat loading (mencegah double-click)
//   2. Optimistic update: update localSale di state SEBELUM server response
//   3. Rollback ke state sebelumnya jika server error
//   4. onApproved(updatedSale) mengirim sale terupdate ke parent
//
const ApprovalModal = ({ sale, localSale, onClose, onApproved }) => {
  const { data: session }  = useSession();
  const [notes,       setNotes]      = useState('');
  const [loadingStage, setLoadingStage] = useState(''); // '' | 'sales' | 'admin' | ...
  const [rejectMode,  setRejectMode] = useState(false);
  const [errorMsg,    setErrorMsg]   = useState('');
  // Ref untuk mencegah double-submit
  const submittingRef = useRef(false);

  const role = session?.user?.role;

  const canSales      = localSale.status === 'PENDING_SALES'      && ['Sales','Admin','Supervisor','Manager','SuperAdmin'].includes(role);
  const canAdmin      = localSale.status === 'PENDING_ADMIN'      && ['Admin','SuperAdmin'].includes(role);
  const canSupervisor = localSale.status === 'PENDING_SUPERVISOR' && ['Supervisor','SuperAdmin'].includes(role);
  const canManager    = localSale.status === 'PENDING_MANAGER'    && ['Manager','SuperAdmin'].includes(role);
  const canReject     = !['COMPLETED','CANCELLED'].includes(localSale.status)
                        && ['Admin','Sales','Supervisor','Manager','SuperAdmin'].includes(role);

  // Mapping stage → status berikutnya (untuk optimistic update)
  const NEXT_STATUS = {
    sales:      'PENDING_ADMIN',
    admin:      'PENDING_SUPERVISOR',
    supervisor: 'PENDING_MANAGER',
    manager:    'COMPLETED',
    reject:     'CANCELLED',
  };

  const doApprove = useCallback(async (stage) => {
    // Guard: double-click prevention
    if (submittingRef.current || loadingStage) return;
    submittingRef.current = true;
    setLoadingStage(stage);
    setErrorMsg('');

    // ── Optimistic update: ubah state SEBELUM server response ──────────────
    const now      = new Date().toISOString();
    const approver = session?.user?.name || session?.user?.email;
    const optimistic = {
      ...localSale,
      status: NEXT_STATUS[stage] || localSale.status,
      ...(stage === 'sales'      ? { salesApprovedBy:       approver, salesApprovedAt:      now } : {}),
      ...(stage === 'admin'      ? { adminApprovedBy:       approver, adminApprovedAt:      now } : {}),
      ...(stage === 'supervisor' ? { supervisorApprovedBy:  approver, supervisorApprovedAt: now } : {}),
      ...(stage === 'manager'    ? { managerApprovedBy:     approver, managerApprovedAt:    now, paidAt: now } : {}),
      ...(stage === 'reject'     ? { rejectedBy: approver, rejectedNotes: notes } : {}),
    };

    // Kirim optimistic state ke parent segera
    onApproved(optimistic, false /* belum final */);

    try {
      const res  = await fetch(`/api/penjualan/${sale.dbId}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage, notes }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic: kembalikan ke state sebelumnya
        onApproved(localSale, false);
        setErrorMsg(data.message || 'Terjadi kesalahan.');
        return;
      }

      // Konfirmasi final dengan data dari server
      onApproved(data.sale || optimistic, true /* final */);
      onClose();
    } catch (err) {
      // Rollback jika network error
      onApproved(localSale, false);
      setErrorMsg('Kesalahan koneksi. Silakan coba lagi.');
    } finally {
      submittingRef.current = false;
      setLoadingStage('');
    }
  }, [loadingStage, localSale, notes, sale.dbId, session, onApproved, onClose]);

  const doReject = () => {
    if (!notes.trim()) { setErrorMsg('Isi alasan penolakan terlebih dahulu.'); return; }
    doApprove('reject');
  };

  const isBusy = !!loadingStage;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className={`p-5 flex justify-between items-start shrink-0 ${
          localSale.status === 'COMPLETED' ? 'bg-green-50' :
          localSale.status === 'CANCELLED' ? 'bg-red-50'   : 'bg-amber-50/50'}`}>
          <div>
            <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{sale.id}</p>
            <p className="text-[9px] font-bold text-gray-500 mt-0.5">{sale.customer}</p>
            <div className="mt-2"><StatusBadge status={localSale.status} /></div>
          </div>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-white/70 rounded-full disabled:opacity-50">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <ApprovalStepper localSale={localSale} />

          {/* Quick info */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              { label: 'Total',    value: fmtRp(sale.total)        },
              { label: 'Channel',  value: sale.saleType || 'REGULAR' },
              { label: 'Bayar',    value: sale.paymentMethod || 'CASH' },
              { label: 'Customer', value: sale.customer            },
            ].map((m, i) => (
              <div key={i} className="p-2.5 bg-gray-50 rounded-xl">
                <p className="text-[8px] font-black text-gray-400 uppercase">{m.label}</p>
                <p className="text-[11px] font-black text-gray-800 mt-0.5 truncate">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* Notes input */}
          {(canSales || canAdmin || canSupervisor || canManager || (canReject && rejectMode)) && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                {rejectMode ? 'Alasan Penolakan *' : 'Catatan (Opsional)'}
              </label>
              <textarea rows={2} disabled={isBusy}
                className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-[11px] font-medium text-gray-800 outline-none resize-none focus:ring-2 disabled:opacity-60 ${
                  rejectMode ? 'border-red-200 focus:ring-red-100' : 'border-gray-100 focus:ring-[#8da070]/20'}`}
                placeholder={rejectMode ? 'Tulis alasan...' : 'Catatan tambahan...'}
                value={notes} onChange={e => { setNotes(e.target.value); setErrorMsg(''); }}
              />
            </div>
          )}
        </div>

        {/* Action footer */}
        {(canSales || canAdmin || canSupervisor || canManager || canReject) && (
          <div className="p-5 border-t bg-gray-50 space-y-2 shrink-0">
            {!rejectMode ? (
              <div className="flex gap-2">
                {canSales && (
                  <button
                    onClick={() => doApprove('sales')}
                    disabled={isBusy}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loadingStage === 'sales'
                      ? <><Loader2 className="animate-spin" size={14} /> Memproses...</>
                      : <><ShieldCheck size={14} /> Sales</>}
                  </button>
                )}
                {canAdmin && (
                  <button
                    onClick={() => doApprove('admin')}
                    disabled={isBusy}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loadingStage === 'admin'
                      ? <><Loader2 className="animate-spin" size={14} /> Memproses...</>
                      : <><ShieldCheck size={14} /> Admin</>}
                  </button>
                )}
                {canSupervisor && (
                  <button
                    onClick={() => doApprove('supervisor')}
                    disabled={isBusy}
                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loadingStage === 'supervisor'
                      ? <><Loader2 className="animate-spin" size={14} /> Memproses...</>
                      : <><ShieldCheck size={14} /> SPV</>}
                  </button>
                )}
                {canManager && (
                  <button
                    onClick={() => doApprove('manager')}
                    disabled={isBusy}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loadingStage === 'manager'
                      ? <><Loader2 className="animate-spin" size={14} /> Memproses...</>
                      : <><CheckCircle size={14} /> Final</>}
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={isBusy}
                    className="px-3 py-3 bg-red-50 text-red-500 border border-red-200 rounded-2xl font-black hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={doReject}
                  disabled={isBusy || !notes.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {loadingStage === 'reject'
                    ? <><Loader2 className="animate-spin" size={14} /> Memproses...</>
                    : <><X size={14} /> Tolak</>}
                </button>
                <button
                  onClick={() => { setRejectMode(false); setNotes(''); setErrorMsg(''); }}
                  disabled={isBusy}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-200 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            )}
            {/* Global loading indicator */}
            {isBusy && (
              <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Mohon tunggu, sedang memproses...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main SaleDetail ──────────────────────────────────────────────────────────
//
// PERUBAHAN:
//   1. localSale: state lokal salinan sale prop — diedit oleh optimistic update
//      tanpa harus menunggu fetchSales() selesai di parent
//   2. onApproved(updatedSale, isFinal): parent bisa memperbarui salesData secara
//      in-place tanpa re-fetch penuh
//
const SaleDetail = ({ isOpen, sale, onClose, onSaleUpdated }) => {
  const { data: session } = useSession();
  const [showInvoice,  setShowInvoice]  = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  // ── Local sale state untuk optimistic update ──────────────────────────────
  const [localSale, setLocalSale] = useState(sale || {});

  // Sync localSale ketika prop sale berubah (misalnya setelah parent re-fetch)
  React.useEffect(() => { if (sale) setLocalSale(sale); }, [sale]);

  const canManage = ['Admin', 'Sales', 'Supervisor', 'Manager', 'SuperAdmin'].includes(session?.user?.role);
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(session?.user?.role);
  const isRegular = (localSale.saleType || 'REGULAR') === 'REGULAR';
  const isPending = !['COMPLETED', 'CANCELLED'].includes(localSale.status);

  // ── Callback dari ApprovalModal ───────────────────────────────────────────
  const handleApproved = useCallback((updatedSale, isFinal) => {
    setLocalSale(prev => ({ ...prev, ...updatedSale }));
    // Notifikasi parent (page.js) untuk update salesData in-place
    onSaleUpdated?.(updatedSale, isFinal);
  }, [onSaleUpdated]);

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
            invoiceId: sale.id, createdAt: sale.createdAt, dueDate: sale.dueDate,
            customer: { name: sale.customer, address: sale.customerAddress, phone: sale.customerPhone },
            deliveryAddress: sale.deliveryAddress, items: sale.items,
            subtotal: sale.subtotal, discount: sale.discount, discountPct: sale.discountPct,
            taxPct: sale.taxPct, taxAmount: sale.taxAmount, shippingCost: sale.shippingCost,
            totalAmount: sale.total, paymentMethod: sale.paymentMethod,
            status: localSale.status, notes: sale.notes,
          }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {showApproval && (
        <ApprovalModal
          sale={sale}
          localSale={localSale}
          onClose={() => setShowApproval(false)}
          onApproved={handleApproved}
        />
      )}

      <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in duration-300">

          {/* Header */}
          <div className={`p-5 md:p-6 border-b border-gray-100 flex justify-between items-start shrink-0 ${
            localSale.status === 'COMPLETED' ? 'bg-green-50/50' :
            localSale.status === 'CANCELLED' ? 'bg-red-50/30'   : 'bg-amber-50/30'}`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Detail Transaksi</h2>
                {/* Status badge mencerminkan localSale — update optimis langsung kelihatan */}
                <StatusBadge status={localSale.status} />
                {(localSale.saleType || 'REGULAR') === 'DIRECT' && (
                  <span className="text-[8px] font-black text-white bg-blue-500 px-2 py-0.5 rounded-lg">Direct</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#8da070] tracking-[0.15em] uppercase">{sale.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {localSale.status === 'COMPLETED' && (
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
            {/* Stepper — menampilkan localSale.status secara real-time */}
            {isRegular && (
              <div className="px-5 md:px-6 pt-5">
                <ApprovalStepper localSale={localSale} />
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
                          <td className="px-4 py-3.5 text-sm font-black text-gray-900 text-center">{fmtQty(item.quantity)} <span className="text-[9px] text-gray-400">{item.unit}</span></td>
                          <td className="px-4 py-3.5 text-sm font-black text-gray-800">{fmtRp(item.price)}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-[#8da070] italic">{fmtRp(sub)}</td>
                          <td className="px-4 py-3.5 text-[10px] font-bold text-amber-600">{item.totalCost > 0 ? fmtRp(item.totalCost) : '-'}</td>
                          <td className={`px-4 py-3.5 text-[10px] font-black ${item.totalCost > 0 ? (margin >= 0 ? 'text-green-600' : 'text-red-500') : 'text-gray-300'}`}>
                            {item.totalCost > 0 ? fmtRp(margin) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                  ...(sale.discountPct > 0 ? [{ label: `Diskon (${sale.discountPct}%)`, value: `-${fmtRp(sale.discount)}`, cls: 'text-orange-400' }] : []),
                  ...(sale.taxPct > 0       ? [{ label: `PPN (${sale.taxPct}%)`,          value: fmtRp(sale.taxAmount),        cls: 'text-blue-400'   }] : []),
                  ...(sale.shippingCost > 0 ? [{ label: 'Biaya Kirim',                    value: fmtRp(sale.shippingCost),     cls: 'text-purple-400' }] : []),
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">{r.label}</span>
                    <span className={`font-black italic ${r.cls}`}>{r.value}</span>
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
                    <Info size={10} /> Catatan Internal
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