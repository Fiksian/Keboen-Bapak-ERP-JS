'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Package, Layers, ChevronRight, Clock, Truck,
  AlertTriangle, CheckCircle2, Search, ArrowDown,
  BarChart3, FileText, User, Calendar, Warehouse,
  TrendingDown, History, RefreshCw, ExternalLink
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtQty = (val) => {
  const n = parseFloat(val) || 0;
  return n < 0.1 && n > 0 ? n.toFixed(3) : parseFloat(n.toFixed(2)).toLocaleString('id-ID');
};
const fmtDate = (dt) => dt
  ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-';
const fmtDateTime = (dt) => dt
  ? new Date(dt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-';

// ─── Batch status badge ───────────────────────────────────────────────────────
const BatchBadge = ({ status }) => {
  const cfg = {
    ACTIVE:   { cls: 'bg-green-50 text-green-700 border-green-200',  label: 'Aktif',    dot: 'bg-green-400' },
    DEPLETED: { cls: 'bg-gray-50 text-gray-500 border-gray-200',     label: 'Habis',    dot: 'bg-gray-400'  },
    EXPIRED:  { cls: 'bg-red-50 text-red-500 border-red-200',        label: 'Kadaluarsa', dot: 'bg-red-400' },
  }[status] || { cls: 'bg-gray-50 text-gray-400 border-gray-100', label: status, dot: 'bg-gray-300' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

// ─── FIFO position indicator ──────────────────────────────────────────────────
const FIFOPosition = ({ position, total }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg">
    <ArrowDown size={9} className="text-blue-400" />
    <span className="text-[9px] font-black text-blue-600">
      {position === 1 ? 'NEXT OUT' : `#${position} FIFO`}
    </span>
  </div>
);

// ─── Batch row ────────────────────────────────────────────────────────────────
const BatchRow = ({ batch, position, totalActive, onViewDeductions }) => {
  const pct = Math.round((batch.qtyRemaining / batch.qtyInitial) * 100) || 0;

  return (
    <div className={`rounded-[20px] border p-4 transition-all ${
      batch.status === 'ACTIVE'
        ? position === 1
          ? 'border-blue-200 bg-blue-50/30 shadow-sm shadow-blue-100'
          : 'border-gray-100 bg-white hover:border-green-200'
        : 'border-gray-100 bg-gray-50/50 opacity-60'
    }`}>
      {/* Header batch */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
            {batch.batchNo}
          </span>
          <BatchBadge status={batch.status} />
          {batch.status === 'ACTIVE' && (
            <FIFOPosition position={position} total={totalActive} />
          )}
        </div>
        <button
          onClick={() => onViewDeductions(batch)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-blue-500 hover:text-white text-gray-400 rounded-xl text-[9px] font-black uppercase border border-gray-100 hover:border-blue-500 transition-all"
        >
          <History size={11} /> Log
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Supplier',  value: batch.supplierName || '-',       icon: Truck   },
          { label: 'No PO',     value: batch.noPO         || '-',       icon: FileText },
          { label: 'Masuk',     value: fmtDate(batch.receivedAt),       icon: Calendar },
          { label: 'Surat Jln', value: batch.suratJalan   || '-',       icon: FileText },
        ].map((info, i) => (
          <div key={i} className="min-w-0">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <info.icon size={8} /> {info.label}
            </p>
            <p className="text-[10px] font-bold text-gray-700 truncate">{info.value}</p>
          </div>
        ))}
      </div>

      {/* Qty progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-black">
          <span className="text-gray-400 uppercase">Sisa Stok</span>
          <span className={batch.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}>
            {fmtQty(batch.qtyRemaining)} / {fmtQty(batch.qtyInitial)} {batch.unit}
            <span className="ml-1 opacity-60">({pct}%)</span>
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-gray-200'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {batch.status === 'ACTIVE' && pct <= 20 && pct > 0 && (
          <p className="text-[9px] font-bold text-red-500 flex items-center gap-1">
            <AlertTriangle size={10} /> Stok hampir habis di batch ini
          </p>
        )}
      </div>

      {/* STTB ref */}
      {batch.sttb?.sttbNo && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
          <span className="text-[8px] font-bold text-gray-400 uppercase">STTB:</span>
          <span className="text-[9px] font-black text-indigo-600">{batch.sttb.sttbNo}</span>
        </div>
      )}
    </div>
  );
};

// ─── Deduction detail modal ───────────────────────────────────────────────────
const DeductionModal = ({ batch, onClose }) => {
  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Log Deduction</h3>
            <p className="text-[9px] font-bold text-blue-600 mt-0.5">{batch.batchNo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {batch.deductions?.length > 0 ? batch.deductions.map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                d.referenceType === 'PRODUCTION' ? 'bg-purple-50 text-purple-500' :
                d.referenceType === 'SALES'      ? 'bg-blue-50 text-blue-500'     :
                                                   'bg-gray-100 text-gray-400'
              }`}>
                <TrendingDown size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-gray-700 uppercase">
                    -{fmtQty(d.qtyDeducted)} {d.unit}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                    d.referenceType === 'PRODUCTION' ? 'bg-purple-50 text-purple-600' :
                    d.referenceType === 'SALES'      ? 'bg-blue-50 text-blue-600'     :
                                                       'bg-gray-100 text-gray-500'
                  }`}>
                    {d.referenceType}
                  </span>
                </div>
                {d.referenceNo && (
                  <p className="text-[9px] font-bold text-gray-500 mt-0.5">{d.referenceNo}</p>
                )}
                <p className="text-[8px] text-gray-400 mt-0.5">{fmtDateTime(d.createdAt)}</p>
                {d.deductedBy && <p className="text-[8px] text-gray-400">oleh: {d.deductedBy}</p>}
                {d.notes && <p className="text-[8px] text-gray-400 italic mt-0.5">{d.notes}</p>}
              </div>
            </div>
          )) : (
            <div className="py-10 text-center text-gray-300 italic text-[10px] font-black uppercase">
              Belum ada deduction dari batch ini
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const BatchDetailModal = ({ isOpen, onClose, item, warehouseId }) => {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [tab,        setTab]        = useState('batches'); // 'batches' | 'history'
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search,     setSearch]     = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

  const fetchBatches = useCallback(async () => {
    if (!item || !isOpen) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ item: item.name, status: 'ALL' });
      if (warehouseId) params.set('warehouseId', warehouseId);
      const res  = await fetch(`/api/stock/batch?${params}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [item, isOpen, warehouseId]);

  useEffect(() => { if (isOpen) fetchBatches(); }, [isOpen, fetchBatches]);

  if (!isOpen || !item) return null;

  const allBatches    = data?.batches || [];
  const activeBatches = allBatches.filter(b => b.status === 'ACTIVE');
  const shown         = allBatches
    .filter(b => statusFilter === 'ALL' || b.status === statusFilter)
    .filter(b => !search || b.batchNo.toLowerCase().includes(search.toLowerCase()) || (b.supplierName || '').toLowerCase().includes(search.toLowerCase()));

  // Hitung posisi FIFO untuk tiap batch aktif
  const activeSorted = [...activeBatches].sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));
  const fifoPos      = Object.fromEntries(activeSorted.map((b, i) => [b.id, i + 1]));

  const totalQty     = data?.summary?.totalQty || 0;
  const totalActive  = data?.summary?.totalActive || 0;

  // Semua deductions dari semua batch (untuk tab history)
  const allDeductions = allBatches
    .flatMap(b => (b.deductions || []).map(d => ({ ...d, batchNo: b.batchNo, supplier: b.supplierName })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      {selectedBatch && (
        <DeductionModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      )}

      <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

          {/* Header */}
          <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start shrink-0 bg-indigo-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tight leading-none">
                  {item.name}
                </h2>
                <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-widest">
                  FIFO Batch Tracker · {totalActive} batch aktif
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchBatches} disabled={loading}
                className="p-2 bg-white/70 hover:bg-white rounded-xl text-indigo-500 transition-all">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
            {[
              { label: 'Total Stok',      value: `${(totalQty).toLocaleString('id-ID')} ${item.unit}`, color: 'text-indigo-600' },
              { label: 'Batch Aktif',     value: `${totalActive} batch`,                                color: 'text-green-600'  },
              { label: 'Batch Selesai',   value: `${data?.summary?.totalDepleted || 0} batch`,          color: 'text-gray-500'   },
            ].map((s, i) => (
              <div key={i} className="px-4 py-3 text-center border-r border-gray-100 last:border-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-sm font-black italic mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/30">
            {[
              { key: 'batches', label: 'Batch FIFO',   icon: Layers  },
              { key: 'history', label: 'Riwayat Keluar', icon: History },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat data batch...</p>
              </div>
            ) : tab === 'batches' ? (
              <div className="p-4 md:p-5 space-y-4">
                {/* Filter toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="Cari batch / supplier..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {['ACTIVE', 'DEPLETED', 'ALL'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${
                          statusFilter === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'
                        }`}>
                        {s === 'ALL' ? 'Semua' : s === 'ACTIVE' ? 'Aktif' : 'Habis'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FIFO order info banner */}
                {activeBatches.length > 0 && statusFilter !== 'DEPLETED' && (
                  <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
                    <ArrowDown size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-blue-700 uppercase">Urutan FIFO</p>
                      <p className="text-[10px] font-medium text-blue-600 mt-0.5 leading-relaxed">
                        Batch bertanda <strong>NEXT OUT</strong> akan digunakan pertama saat ada transaksi keluar.
                        Batch diurutkan dari yang paling lama masuk (oldest first).
                      </p>
                    </div>
                  </div>
                )}

                {/* Batch list */}
                <div className="space-y-3">
                  {shown.length > 0 ? shown.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      position={fifoPos[batch.id] || 0}
                      totalActive={totalActive}
                      onViewDeductions={setSelectedBatch}
                    />
                  )) : (
                    <div className="py-16 text-center flex flex-col items-center gap-3">
                      <Package size={36} className="text-gray-200" />
                      <p className="text-gray-300 font-black uppercase italic text-[10px] tracking-widest">
                        {search ? 'Batch tidak ditemukan' : 'Tidak ada batch aktif'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab: Riwayat Keluar */
              <div className="p-4 md:p-5 space-y-3">
                {allDeductions.length > 0 ? allDeductions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      d.referenceType === 'PRODUCTION' ? 'bg-purple-50 text-purple-500' :
                      d.referenceType === 'SALES'      ? 'bg-blue-50 text-blue-500'     :
                                                         'bg-gray-50 text-gray-400'
                    }`}>
                      <TrendingDown size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-black text-gray-800">
                          -{fmtQty(d.qtyDeducted)} {d.unit}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          d.referenceType === 'PRODUCTION' ? 'bg-purple-50 text-purple-600' :
                          d.referenceType === 'SALES'      ? 'bg-blue-50 text-blue-600'     :
                                                             'bg-gray-100 text-gray-500'
                        }`}>
                          {d.referenceType}
                        </span>
                        {d.referenceNo && (
                          <span className="text-[9px] font-bold text-gray-400">{d.referenceNo}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {d.batchNo}
                        </span>
                        {d.supplier && (
                          <span className="text-[9px] font-bold text-gray-400">· {d.supplier}</span>
                        )}
                      </div>
                      <p className="text-[8px] text-gray-400 mt-1">{fmtDateTime(d.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center flex flex-col items-center gap-3">
                    <History size={36} className="text-gray-200" />
                    <p className="text-gray-300 font-black uppercase italic text-[10px] tracking-widest">
                      Belum ada riwayat keluar
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchDetailModal;