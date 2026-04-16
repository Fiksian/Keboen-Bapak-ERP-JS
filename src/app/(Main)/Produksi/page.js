'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory, Plus, Loader2, CheckCircle2, XCircle, AlertCircle,
  Calendar, Hash, Target, ShieldCheck, X, RefreshCw, Warehouse,
  TrendingDown, DollarSign, BarChart3, Clock
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import AddProduction from './AddProduction';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING_QC_PROD:    { label: 'Menunggu QC',         cls: 'bg-orange-50 text-orange-600 border-orange-200', step: 0, pulse: true  },
  PENDING_ADMIN:      { label: 'Menunggu Admin',       cls: 'bg-amber-50 text-amber-700 border-amber-200',   step: 1, pulse: true  },
  PENDING_SUPERVISOR: { label: 'Menunggu Supervisor',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',step: 2, pulse: true  },
  PENDING_MANAGER:    { label: 'Menunggu Manager',     cls: 'bg-blue-50 text-blue-700 border-blue-200',      step: 3, pulse: true  },
  COMPLETED:          { label: 'Selesai',              cls: 'bg-green-50 text-green-700 border-green-200',   step: 4, pulse: false },
  CANCELLED:          { label: 'Dibatalkan',           cls: 'bg-red-50 text-red-600 border-red-200',        step: -1, pulse: false },
};
const STAGE_LABELS = ['QC Prod', 'Admin', 'Supervisor', 'Manager'];

const fmtRp  = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtQty = (v) => (parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });

// ─── Stepper ──────────────────────────────────────────────────────────────────
const ProductionStepper = ({ status, order }) => {
  const cfg     = STATUS_CFG[status] || STATUS_CFG.PENDING_QC_PROD;
  const current = cfg.step;

  if (status === 'CANCELLED') return (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black text-red-500 uppercase">
      <X size={12} /> Dibatalkan {order.rejectedBy ? `oleh ${order.rejectedBy}` : ''}
    </div>
  );

  const stamps = [
    { by: order.qcApprovedBy,         at: order.qcApprovedAt,         notes: order.qcNotes         },
    { by: order.adminApprovedBy,       at: order.adminApprovedAt,       notes: order.adminNotes       },
    { by: order.supervisorApprovedBy,  at: order.supervisorApprovedAt,  notes: order.supervisorNotes  },
    { by: order.managerApprovedBy,     at: order.managerApprovedAt,     notes: order.managerNotes     },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-0.5">
        {STAGE_LABELS.map((label, i) => {
          const done   = status === 'COMPLETED' || i < current;
          const active = i === current && !['COMPLETED','CANCELLED'].includes(status);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black border ${
                  done   ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse' :
                           'bg-white border-gray-200 text-gray-300'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <p className={`text-[7px] font-black uppercase whitespace-nowrap ${done || active ? 'text-green-600' : 'text-gray-300'}`}>
                  {label}
                </p>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mb-3 rounded-full mx-0.5 ${done ? 'bg-green-400' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
      {/* Stamp mikro */}
      <div className="space-y-1">
        {stamps.map((s, i) => s.by && (
          <div key={i} className="flex items-center gap-1.5 text-[8px]">
            <CheckCircle2 size={9} className="text-green-500 shrink-0" />
            <span className="font-black text-gray-600">{STAGE_LABELS[i]}: {s.by}</span>
            {s.at && <span className="text-gray-400">{new Date(s.at).toLocaleDateString('id-ID')}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Approval modal ────────────────────────────────────────────────────────────
const ApprovalModal = ({ order, onClose, onDone }) => {
  const { data: session } = useSession();
  const [notes,      setNotes]      = useState('');
  const [warehouseId, setWH]        = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState('');
  const [rejectMode, setRejectMode] = useState(false);

  const role = session?.user?.role;

  useEffect(() => {
    fetch('/api/warehouse').then(r => r.ok ? r.json() : []).then(setWarehouses);
  }, []);

  const canQC         = order.status === 'PENDING_QC_PROD'    && ['Supervisor','SuperAdmin'].includes(role);
  const canAdmin      = order.status === 'PENDING_ADMIN'      && ['Admin','SuperAdmin'].includes(role);
  const canSupervisor = order.status === 'PENDING_SUPERVISOR' && ['Supervisor','SuperAdmin'].includes(role);
  const canManager    = order.status === 'PENDING_MANAGER'    && ['Manager','SuperAdmin'].includes(role);
  const canReject     = !['COMPLETED','CANCELLED'].includes(order.status)
                        && ['Admin','Supervisor','Manager','SuperAdmin'].includes(role);

  const doApprove = async (stage) => {
    if (stage === 'manager' && !warehouseId) { alert('Pilih gudang tujuan.'); return; }
    setLoading(stage);
    try {
      const res  = await fetch(`/api/production/${order.id}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage, warehouseId: warehouseId || undefined, notes }),
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
    setLoading('reject');
    try {
      const res = await fetch(`/api/production/${order.id}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage: 'reject', notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onDone();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(''); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        <div className={`p-5 flex justify-between items-start shrink-0 ${
          order.status === 'COMPLETED' ? 'bg-green-50' :
          order.status === 'CANCELLED' ? 'bg-red-50'   : 'bg-indigo-50'
        }`}>
          <div>
            <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{order.productName}</p>
            <p className="text-[9px] font-bold text-indigo-600 mt-0.5">{order.noBatch}</p>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 mt-2 rounded-lg text-[9px] font-black uppercase border ${STATUS_CFG[order.status]?.cls}`}>
              {STATUS_CFG[order.status]?.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full"><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          <ProductionStepper status={order.status} order={order} />

          {/* HPP & rendemen */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Target Output', value: `${fmtQty(order.targetQty)} ${order.targetUnit || 'UNIT'}` },
              { label: 'HPP Est.',      value: fmtRp(order.hpp) },
              { label: 'Total Biaya',   value: fmtRp(order.totalCost) },
              { label: 'Rendemen',      value: order.rendemen ? `${parseFloat(order.rendemen).toFixed(1)}%` : '-' },
            ].map((m, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase">{m.label}</p>
                <p className="text-[12px] font-black text-gray-800 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Loss warning */}
          {order.lossWarning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-700">Rendemen {parseFloat(order.rendemen).toFixed(1)}% — loss melebihi 5%. Perlu review.</p>
            </div>
          )}

          {/* Gudang hasil (setelah completed) */}
          {order.warehouse && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <Warehouse size={14} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-blue-500 uppercase">Gudang Output</p>
                <p className="text-[11px] font-bold text-gray-800">{order.warehouse.name}</p>
              </div>
              <CheckCircle2 size={14} className="text-green-500 ml-auto" />
            </div>
          )}

          {/* Notes / reject input */}
          {(canQC || canAdmin || canSupervisor || canManager || (canReject && rejectMode)) && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                {rejectMode ? 'Alasan Penolakan *' : 'Catatan Approval (Opsional)'}
              </label>
              <textarea rows={2}
                className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-[11px] font-medium text-gray-800 outline-none resize-none focus:ring-2 ${
                  rejectMode ? 'border-red-200 focus:ring-red-100' : 'border-gray-100 focus:ring-indigo-100'
                }`}
                placeholder={rejectMode ? 'Tulis alasan...' : 'Catatan tambahan...'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Gudang selector (Manager) */}
          {canManager && !rejectMode && (
            <div>
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Warehouse size={11} /> Gudang Tujuan Output *
              </label>
              <select value={warehouseId} onChange={e => setWH(e.target.value)}
                className={`w-full border rounded-2xl py-3.5 px-4 text-[11px] font-black uppercase outline-none appearance-none ${
                  warehouseId ? 'border-blue-300 bg-blue-50/20 text-gray-800' : 'border-gray-100 bg-gray-50 text-gray-400'
                }`}>
                <option value="">-- PILIH GUDANG --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name.toUpperCase()}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canQC || canAdmin || canSupervisor || canManager || canReject) && (
          <div className="p-5 border-t bg-gray-50 space-y-2 shrink-0">
            {!rejectMode ? (
              <div className="flex gap-2">
                {canQC && (
                  <button onClick={() => doApprove('qc')} disabled={!!loading}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'qc' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} QC Produksi
                  </button>
                )}
                {canAdmin && (
                  <button onClick={() => doApprove('admin')} disabled={!!loading}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'admin' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Admin
                  </button>
                )}
                {canSupervisor && (
                  <button onClick={() => doApprove('supervisor')} disabled={!!loading}
                    className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'supervisor' ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Supervisor
                  </button>
                )}
                {canManager && (
                  <button onClick={() => doApprove('manager')} disabled={!!loading || !warehouseId}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'manager' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Final Approve
                  </button>
                )}
                {canReject && (
                  <button onClick={() => setRejectMode(true)}
                    className="px-3 py-3 bg-red-50 text-red-500 border border-red-200 rounded-2xl text-[10px] font-black hover:bg-red-100 transition-all">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={doReject} disabled={!!loading || !notes.trim()}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95">
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

// =============================================================================
// Main Page
// =============================================================================
const ProductionModule = () => {
  const { data: session } = useSession();
  const [isAddOpen,   setIsAddOpen]   = useState(false);
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [statusFilter, setFilter]     = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/production');
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSubmit = async (data) => {
    const res = await fetch('/api/production', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    await fetchOrders();
    setIsAddOpen(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Batalkan production order ini?')) return;
    const res = await fetch('/api/production', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'CANCELLED', notes: 'Dibatalkan oleh user' }),
    });
    if (res.ok) fetchOrders();
    else { const e = await res.json(); alert(e.message); }
  };

  const filtered = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  // Stats
  const pending = orders.filter(o => ['PENDING_QC_PROD','PENDING_ADMIN','PENDING_SUPERVISOR','PENDING_MANAGER'].includes(o.status)).length;
  const done    = orders.filter(o => o.status === 'COMPLETED').length;
  const totalHPP = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (o.totalCost || 0), 0);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6">

      {/* Modals */}
      <AddProduction isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleSubmit} />
      {selected && (
        <ApprovalModal
          order={selected}
          onClose={() => setSelected(null)}
          onDone={fetchOrders}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight italic uppercase">
            <Factory className="text-indigo-600 shrink-0" size={24} /> Manufacturing Log
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">FIFO · 4-Stage Approval · HPP Auto-Calc</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} disabled={loading}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95">
            <Plus size={16} strokeWidth={3} /> New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Batch',   value: orders.length,           icon: Factory,      color: 'bg-indigo-50 text-indigo-600' },
          { label: 'In Progress',   value: pending,                  icon: Clock,        color: 'bg-amber-50 text-amber-600'   },
          { label: 'Completed',     value: done,                     icon: CheckCircle2, color: 'bg-green-50 text-green-600'   },
          { label: 'Total Biaya',   value: `Rp ${totalHPP.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`p-3 rounded-xl ${s.color} shrink-0`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-lg font-black text-gray-900 italic tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL','PENDING_QC_PROD','PENDING_ADMIN','PENDING_SUPERVISOR','PENDING_MANAGER','COMPLETED','CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'
            }`}>
            {s === 'ALL' ? 'Semua' : STATUS_CFG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Loading...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  {['Batch ID','Produk','Output / HPP','Approval Status','Aksi'].map(h => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(order => {
                  const cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING_QC_PROD;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] text-indigo-600 font-black">{order.noBatch}</span>
                        <p className="text-[9px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-700 uppercase text-sm tracking-tight">{order.productName}</p>
                        {order.warehouse && (
                          <span className="text-[9px] font-bold text-blue-500 flex items-center gap-1 mt-0.5">
                            <Warehouse size={9} /> {order.warehouse.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800">{fmtQty(order.targetQty)} <span className="text-[9px] text-indigo-500">{order.targetUnit || 'UNIT'}</span></p>
                        {order.hpp > 0 && (
                          <p className="text-[9px] font-bold text-amber-600 mt-0.5">HPP: {fmtRp(order.hpp)}/unit</p>
                        )}
                        {order.lossWarning && (
                          <p className="text-[8px] font-bold text-red-500 flex items-center gap-0.5 mt-0.5">
                            <AlertCircle size={9} /> Loss warning
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px]">
                          <ProductionStepper status={order.status} order={order} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelected(order)}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-500 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95">
                            Detail
                          </button>
                          {!['COMPLETED','CANCELLED'].includes(order.status) && (
                            <button onClick={() => handleCancel(order.id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90">
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center gap-3 opacity-30">
            <Factory size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada data produksi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionModule;
