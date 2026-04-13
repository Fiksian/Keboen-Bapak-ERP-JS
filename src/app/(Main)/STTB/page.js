'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck, Clock, CheckCircle2, X, Loader2,
  Package, RefreshCw, FileText, Warehouse, User,
  Eye, Printer, Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const PrintSTTB = dynamic(() => import('@/app/(Main)/Components/Arrival/PrintSTTB'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 gap-3">
      <Loader2 className="animate-spin text-blue-600" size={24} />
      <p className="text-[11px] font-black uppercase text-gray-400">Menyiapkan Preview...</p>
    </div>
  ),
});

// ─── Status config — 4 tahap ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING_QC: {
    label: 'Menunggu QC',         cls: 'bg-orange-50 text-orange-600 border-orange-200', step: 0,
  },
  PENDING_ADMIN: {
    label: 'Menunggu Admin',      cls: 'bg-amber-50 text-amber-700 border-amber-200',    step: 1,
  },
  PENDING_SUPERVISOR: {
    label: 'Menunggu Supervisor', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', step: 2,
  },
  PENDING_MANAGER: {
    label: 'Menunggu Manager',    cls: 'bg-blue-50 text-blue-700 border-blue-200',       step: 3,
  },
  APPROVED: {
    label: 'Approved & Stok Dicatat', cls: 'bg-green-50 text-green-700 border-green-200', step: 4,
  },
  REJECTED: {
    label: 'Ditolak',             cls: 'bg-red-50 text-red-600 border-red-100',          step: -1,
  },
};

// Label tahap untuk stepper (index 0-3 = stage 1-4)
const STAGE_LABELS = ['QC Penerimaan', 'Admin', 'Supervisor', 'Manager & Gudang'];

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const STTBStepper = ({ status, sttb }) => {
  const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_QC;
  const current    = cfg.step; // 0=QC selesai belum admin, 1=admin done, 2=sup done, 3=mgr done, 4=all done
  const isRejected = status === 'REJECTED';

  if (isRejected) return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
      <X size={14} className="text-red-500 shrink-0" />
      <div>
        <p className="text-[10px] font-black text-red-600 uppercase">STTB Ditolak</p>
        {sttb.rejectedNotes && (
          <p className="text-[9px] text-red-400 mt-0.5">{sttb.rejectedNotes}</p>
        )}
        {sttb.rejectedBy && (
          <p className="text-[9px] text-red-400">Oleh: {sttb.rejectedBy} · {sttb.rejectedAt ? new Date(sttb.rejectedAt).toLocaleString('id-ID') : ''}</p>
        )}
      </div>
    </div>
  );

  // Mapping: step index di stepper → data stamp
  // Stepper step 0 = QC (tahap 1), step 1 = Admin (tahap 2),
  // step 2 = Supervisor (tahap 3), step 3 = Manager (tahap 4)
  const stamps = [
    { label: 'QC Penerimaan', by: sttb.qcApprovedBy,         at: sttb.qcApprovedAt,         notes: sttb.qcNotes         },
    { label: 'Admin',         by: sttb.adminApprovedBy,       at: sttb.adminApprovedAt,       notes: sttb.adminNotes       },
    { label: 'Supervisor',    by: sttb.supervisorApprovedBy,  at: sttb.supervisorApprovedAt,  notes: sttb.supervisorNotes  },
    { label: 'Manager',       by: sttb.managerApprovedBy,     at: sttb.managerApprovedAt,     notes: sttb.managerNotes     },
  ];

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STAGE_LABELS.map((label, i) => {
          // step i selesai jika current > i (atau semua selesai jika APPROVED)
          const done    = status === 'APPROVED' || i < current;
          const active  = i === current && status !== 'APPROVED';
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done   ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                           'bg-white border-gray-200 text-gray-300'
                }`}>
                  {done
                    ? <CheckCircle2 size={14} />
                    : <span className="text-[10px] font-black">{i + 1}</span>
                  }
                </div>
                <p className={`text-[8px] font-black uppercase whitespace-nowrap tracking-tight ${
                  done || active ? 'text-green-600' : 'text-gray-300'
                }`}>{label}</p>
              </div>
              {i < STAGE_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 rounded-full ${done ? 'bg-green-400' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stamp details — hanya tampilkan yang sudah done */}
      <div className="space-y-2">
        {stamps.map((s, i) => {
          if (!s.by) return null;
          return (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[9px] font-black text-green-700 uppercase">{s.label}</p>
                <p className="text-[10px] font-bold text-gray-700">{s.by}</p>
                {s.at    && <p className="text-[8px] text-gray-400">{new Date(s.at).toLocaleString('id-ID')}</p>}
                {s.notes && <p className="text-[8px] text-gray-500 italic mt-0.5">{s.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── STTB Detail & Approval Modal ─────────────────────────────────────────────
const STTBDetailModal = ({ sttb, warehouses, onClose, onApproved, onRejected }) => {
  const { data: session } = useSession();
  const [loading,     setLoading]     = useState('');
  const [notes,       setNotes]       = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [rejectMode,  setRejectMode]  = useState(false);

  const role     = session?.user?.role;
  const approver = session?.user?.name || session?.user?.email;

  const canAdmin      = sttb.status === 'PENDING_QC'         && ['Admin', 'SuperAdmin'].includes(role);
  const canSupervisor = sttb.status === 'PENDING_SUPERVISOR'  && ['Supervisor', 'SuperAdmin'].includes(role);
  const canManager    = sttb.status === 'PENDING_MANAGER'     && ['Manager', 'SuperAdmin'].includes(role);
  const canReject     = !['APPROVED', 'REJECTED'].includes(sttb.status)
                        && ['Admin', 'Supervisor', 'Manager', 'SuperAdmin'].includes(role);

  const doApprove = async (stage) => {
    if (stage === 'manager' && !warehouseId) {
      alert('Pilih gudang tujuan terlebih dahulu.');
      return;
    }
    setLoading(stage);
    try {
      const res  = await fetch(`/api/sttb/${sttb.id}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage, warehouseId: warehouseId || undefined, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      onApproved?.();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(''); }
  };

  const doReject = async () => {
    if (!notes.trim()) { alert('Isi alasan penolakan.'); return; }
    setLoading('reject');
    try {
      const res  = await fetch(`/api/sttb/${sttb.id}/approve`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage: 'reject', notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRejected?.();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(''); }
  };

  const purchase = sttb.purchasing;
  const receipt  = sttb.receipt;

  const printData = {
    noPO:                 purchase?.noPO,
    item:                 purchase?.item,
    supplier:             purchase?.supplier,
    unit:                 purchase?.unit,
    suratJalan:           receipt?.suratJalan,
    vehicleNo:            receipt?.vehicleNo,
    receivedBy:           receipt?.receivedBy,
    receivedAt:           receipt?.receivedAt,
    condition:            receipt?.condition,
    notes:                receipt?.notes,
    grossWeight:          receipt?.grossWeight,
    tareWeight:           receipt?.tareWeight,
    refraksi:             receipt?.refraksi,
    netWeight:            receipt?.netWeight,
    imageUrl:             receipt?.imageUrl,
    qcApprovedBy:         sttb.qcApprovedBy,
    qcApprovedAt:         sttb.qcApprovedAt,
    adminApprovedBy:      sttb.adminApprovedBy,
    adminApprovedAt:      sttb.adminApprovedAt,
    supervisorApprovedBy: sttb.supervisorApprovedBy,
    supervisorApprovedAt: sttb.supervisorApprovedAt,
    managerApprovedBy:    sttb.managerApprovedBy,
    managerApprovedAt:    sttb.managerApprovedAt,
    warehouseName:        sttb.warehouse?.name,
    sttbNo:               sttb.sttbNo,
    status:               sttb.status,
  };

  const anyActionAvailable = canAdmin || canSupervisor || canManager || canReject;

  return (
    <div className="fixed inset-0 h-full z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className={`p-6 flex justify-between items-start shrink-0 ${
          sttb.status === 'APPROVED' ? 'bg-green-50' :
          sttb.status === 'REJECTED' ? 'bg-red-50'   : 'bg-blue-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              sttb.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
              sttb.status === 'REJECTED' ? 'bg-red-100 text-red-600'     : 'bg-blue-100 text-blue-600'
            }`}><FileText size={20} /></div>
            <div>
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{sttb.sttbNo}</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-lg text-[9px] font-black uppercase border ${STATUS_CONFIG[sttb.status]?.cls}`}>
                {STATUS_CONFIG[sttb.status]?.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(p => !p)}
              className="p-2 bg-white/70 hover:bg-white rounded-xl transition-colors text-gray-500">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="absolute inset-0 z-[350] bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center shadow-xl">
              <div className="flex items-center gap-3">
                <Printer size={18} className="text-blue-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Dokumen Preview</p>
                  <p className="text-xs font-bold">{sttb.sttbNo}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 bg-white/10 hover:bg-red-500 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase"
              >
                Tutup Preview <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-700 p-2 md:p-8 overflow-auto flex justify-center">
              <div className="w-full max-w-4xl bg-white shadow-2xl rounded-sm md:rounded-lg overflow-hidden">
                <PrintSTTB data={printData} />
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          <STTBStepper status={sttb.status} sttb={sttb} />

          {/* Info item */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Item',        value: purchase?.item },
              { label: 'No PO',       value: purchase?.noPO },
              { label: 'Supplier',    value: purchase?.supplier || '-' },
              { label: 'Surat Jalan', value: receipt?.suratJalan },
            ].map((m, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{m.label}</p>
                <p className="text-[11px] font-bold text-gray-800 uppercase mt-0.5">{m.value || '-'}</p>
              </div>
            ))}
          </div>

          {/* Timbang */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
            {[
              { label: 'Gross',     value: `${receipt?.grossWeight || 0} Kg` },
              { label: 'Tare',      value: `${receipt?.tareWeight  || 0} Kg` },
              { label: 'Refraksi',  value: `${receipt?.refraksi  || 0} %` },
              { label: 'Netto',     value: `${receipt?.netWeight   || 0} Kg`, bold: true },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-[8px] font-black text-orange-400 uppercase">{m.label}</p>
                <p className={`text-[12px] font-black ${m.bold ? 'text-orange-700 underline underline-offset-2' : 'text-gray-700'}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Kondisi */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-[11px] font-black uppercase ${
            receipt?.condition === 'GOOD'    ? 'bg-green-50 text-green-700 border-green-200' :
            receipt?.condition === 'DAMAGED' ? 'bg-red-50 text-red-600 border-red-200'       :
                                               'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            {receipt?.condition === 'GOOD' ? '✅' : receipt?.condition === 'DAMAGED' ? '❌' : '⚠️'}
            Kondisi: {receipt?.condition}
          </div>

          {/* Gudang (setelah Manager approve) */}
          {sttb.warehouse && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <Warehouse size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase">Gudang Penyimpanan</p>
                <p className="text-[11px] font-bold text-gray-800">{sttb.warehouse.name}</p>
              </div>
              <CheckCircle2 size={16} className="text-green-500 ml-auto" />
            </div>
          )}

          {/* Pesan jika user tidak punya akses untuk tahap ini */}
          {!anyActionAvailable && !['APPROVED','REJECTED'].includes(sttb.status) && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                Tahap ini membutuhkan role <strong>{STATUS_CONFIG[sttb.status]?.label?.replace('Menunggu ', '')}</strong>.
                Akun Anda ({role}) tidak memiliki akses untuk approve tahap ini.
              </p>
            </div>
          )}

          {/* Textarea notes */}
          {(canAdmin || canSupervisor || canManager || (canReject && rejectMode)) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {rejectMode ? 'Alasan Penolakan *' : 'Catatan Approval (Opsional)'}
              </label>
              <textarea rows={2}
                className={`w-full text-gray-800 bg-gray-50 border rounded-2xl px-4 py-3 text-[11px] font-medium outline-none focus:ring-2 resize-none ${
                  rejectMode ? 'border-red-200 focus:ring-red-100' : 'border-gray-100 focus:ring-blue-100'
                }`}
                placeholder={rejectMode ? 'Tulis alasan penolakan...' : 'Tambahkan catatan...'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Warehouse selector (hanya untuk Manager) */}
          {canManager && !rejectMode && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <Warehouse size={12} /> Gudang Tujuan Penyimpanan *
              </label>
              <select
                className={`w-full border rounded-2xl py-4 px-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer transition-all ${
                  warehouseId ? 'border-blue-300 bg-blue-50/20 text-gray-800' : 'border-gray-100 bg-gray-50 text-gray-400'
                }`}
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
              >
                <option value="">-- PILIH GUDANG PENYIMPANAN --</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name.toUpperCase()} {wh.code ? `[${wh.code}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action footer */}
        {anyActionAvailable && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3 shrink-0">
            {!rejectMode ? (
              <div className="flex gap-3">

                {/* ADMIN APPROVE — hanya role "Admin" */}
                {canAdmin && (
                  <button onClick={() => doApprove('admin')} disabled={!!loading}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-100">
                    {loading === 'admin' ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    Approve — Admin
                  </button>
                )}

                {/* SUPERVISOR APPROVE */}
                {canSupervisor && (
                  <button onClick={() => doApprove('supervisor')} disabled={!!loading}
                    className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-yellow-100">
                    {loading === 'supervisor' ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    Approve — Supervisor
                  </button>
                )}

                {/* MANAGER APPROVE + pilih gudang */}
                {canManager && (
                  <button onClick={() => doApprove('manager')} disabled={!!loading || !warehouseId}
                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-100">
                    {loading === 'manager' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Final Approve & Catat Stok
                  </button>
                )}

                {/* Tombol reject */}
                {canReject && (
                  <button onClick={() => setRejectMode(true)}
                    className="px-4 py-3.5 bg-red-50 text-red-500 border border-red-200 rounded-2xl text-[10px] font-black uppercase transition-all hover:bg-red-100">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={doReject} disabled={!!loading || !notes.trim()}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {loading === 'reject' ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                  Tolak STTB
                </button>
                <button onClick={() => { setRejectMode(false); setNotes(''); }}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase transition-all hover:bg-gray-200">
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

// ─── STTB Card ────────────────────────────────────────────────────────────────
const STTBCard = ({ sttb, onView }) => {
  const cfg      = STATUS_CONFIG[sttb.status] || STATUS_CONFIG.PENDING_QC;
  const purchase = sttb.purchasing;
  const receipt  = sttb.receipt;

  // 4 step dots: 0=QC, 1=Admin, 2=Supervisor, 3=Manager
  const currentStep = cfg.step; // 0..4

  return (
    <div
      onClick={() => onView(sttb)}
      className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border mb-2 ${cfg.cls}`}>
            {cfg.label}
          </p>
          <h4 className="font-black text-gray-900 uppercase text-[13px] truncate">{purchase?.item}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{purchase?.supplier || 'No Supplier'}</p>
        </div>
        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
          <Eye size={16} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {sttb.sttbNo}
        </span>
        <span className="text-[9px] font-bold text-gray-400">{purchase?.noPO}</span>
      </div>

      {/* Mini stepper — 4 dots */}
      <div className="flex items-center gap-1 mb-3">
        {[0, 1, 2, 3].map(i => {
          const done   = sttb.status === 'APPROVED' || i < currentStep;
          const active = i === currentStep && sttb.status !== 'APPROVED';
          return (
            <React.Fragment key={i}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                done   ? 'bg-green-500 text-white' :
                active ? 'bg-blue-500 text-white'  : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-0.5 transition-all ${done ? 'bg-green-300' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-gray-400 font-bold">
            {receipt?.netWeight || receipt?.receivedQty || 0} {purchase?.unit}
          </p>
          <p className="text-[8px] text-gray-300">
            {new Date(sttb.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {sttb.warehouse && (
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
            <Warehouse size={10} /> {sttb.warehouse.name}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const STTBApprovalPage = () => {
  const [sttbs,      setSttbs]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState('ALL');
  const [search,     setSearch]     = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sttbRes, whRes] = await Promise.all([
        fetch('/api/sttb'),
        fetch('/api/warehouse'),
      ]);
      if (sttbRes.ok) setSttbs(await sttbRes.json());
      if (whRes.ok)   setWarehouses(await whRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = sttbs.filter(s => {
    const matchStatus = filter === 'ALL' || s.status === filter;
    const q           = search.toLowerCase();
    const matchSearch = !search
      || s.sttbNo?.toLowerCase().includes(q)
      || s.purchasing?.item?.toLowerCase().includes(q)
      || s.purchasing?.noPO?.toLowerCase().includes(q)
      || s.purchasing?.supplier?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL:                sttbs.length,
    PENDING_QC:         sttbs.filter(s => s.status === 'PENDING_QC').length,
    PENDING_ADMIN:      sttbs.filter(s => s.status === 'PENDING_ADMIN').length,
    PENDING_SUPERVISOR: sttbs.filter(s => s.status === 'PENDING_SUPERVISOR').length,
    PENDING_MANAGER:    sttbs.filter(s => s.status === 'PENDING_MANAGER').length,
    APPROVED:           sttbs.filter(s => s.status === 'APPROVED').length,
    REJECTED:           sttbs.filter(s => s.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 space-y-6">

      {selected && (
        <STTBDetailModal
          sttb={selected}
          warehouses={warehouses}
          onClose={() => setSelected(null)}
          onApproved={fetchData}
          onRejected={fetchData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Approval STTB
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            QC → Admin → Supervisor → Manager · 4-Stage Approval
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm text-[11px] font-black uppercase">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',        key: 'ALL',                color: 'text-gray-700',   bg: 'bg-gray-50'   },
          { label: 'Pending QC',   key: 'PENDING_QC',         color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Pending Admin',key: 'PENDING_ADMIN',      color: 'text-amber-700',  bg: 'bg-amber-50'  },
          { label: 'Pending SPV',  key: 'PENDING_SUPERVISOR', color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Pending Mgr',  key: 'PENDING_MANAGER',    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Approved',     key: 'APPROVED',           color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-[20px] px-4 py-3 border border-white flex items-center justify-between`}>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-tight">{s.label}</p>
            <span className={`text-xl font-black ${s.color}`}>{loading ? '—' : counts[s.key]}</span>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Cari STTB, Item, No PO, Supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto flex-wrap">
          {[
            { key: 'ALL',                label: 'Semua'        },
            { key: 'PENDING_QC',         label: 'QC'           },
            { key: 'PENDING_ADMIN',      label: 'Admin'        },
            { key: 'PENDING_SUPERVISOR', label: 'Supervisor'   },
            { key: 'PENDING_MANAGER',    label: 'Manager'      },
            { key: 'APPROVED',           label: 'Approved'     },
            { key: 'REJECTED',           label: 'Ditolak'      },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                filter === s.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                  : 'bg-white text-gray-400 border-gray-100 hover:border-blue-300'
              }`}>
              {s.label}
              {counts[s.key] > 0 && s.key !== 'ALL' && (
                <span className={`ml-1 px-1 rounded-full text-[8px] ${filter === s.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {counts[s.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid STTB */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={36} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat STTB...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(s => (
            <STTBCard key={s.id} sttb={s} onView={setSelected} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-[32px] border border-dashed border-gray-200">
          <div className="p-8 bg-gray-50 rounded-full">
            <FileText size={40} className="text-gray-200" />
          </div>
          <p className="text-gray-400 font-black uppercase italic text-sm">
            {search || filter !== 'ALL' ? 'Tidak ditemukan' : 'Belum ada STTB'}
          </p>
        </div>
      )}
    </div>
  );
};

export default STTBApprovalPage;