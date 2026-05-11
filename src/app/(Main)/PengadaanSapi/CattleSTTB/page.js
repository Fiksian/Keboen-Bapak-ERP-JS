'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  ShieldCheck, CheckCircle2, X, Loader2,
  RefreshCw, FileText, Warehouse,
  Eye, Printer, Search, Scale, Hash, AlertTriangle,
  TrendingDown, Plus, Info, Globe, ChevronDown,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const PrintSTTB = dynamic(() => import('@/app/(Main)/Components/Arrival/PrintSTTB'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 gap-3">
      <Loader2 className="animate-spin text-[#8da070]" size={24} />
      <p className="text-[11px] font-black uppercase text-gray-400">Menyiapkan Preview...</p>
    </div>
  ),
});

// ─── Konstanta ────────────────────────────────────────────────────────────────
const SUSUT_ALERT = 8.5;

const STATUS_CONFIG = {
  PENDING_QC:         { label: 'Menunggu QC',          cls: 'bg-orange-50 text-orange-600 border-orange-200', step: 0 },
  PENDING_ADMIN:      { label: 'Menunggu Admin',        cls: 'bg-amber-50 text-amber-700 border-amber-200',   step: 1 },
  PENDING_SUPERVISOR: { label: 'Menunggu Supervisor',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', step: 2 },
  PENDING_MANAGER:    { label: 'Menunggu Manager',      cls: 'bg-blue-50 text-blue-700 border-blue-200',      step: 3 },
  APPROVED:           { label: 'Approved & Masuk Kandang', cls: 'bg-green-50 text-green-700 border-green-200', step: 4 },
  REJECTED:           { label: 'Ditolak',               cls: 'bg-red-50 text-red-600 border-red-100',         step: -1 },
};

const STAGE_LABELS = ['QC Penerimaan', 'Admin', 'Supervisor', 'Manager & Kandang'];

const fmtRp  = (v) => `Rp ${(parseFloat(v)||0).toLocaleString('id-ID')}`;
const fmtQty = (v) => (parseFloat(v)||0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

// ─── Susut Badge ──────────────────────────────────────────────────────────────
const SusutBadge = ({ pct, kg }) => {
  if (pct == null) return null;
  const isAlert = parseFloat(pct) > SUSUT_ALERT;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase ${
      isAlert ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
    }`}>
      {isAlert && <AlertTriangle size={10} />}
      <TrendingDown size={10} />
      Susut {parseFloat(pct).toFixed(1)}%
      {kg > 0 && <span className="opacity-70">(-{fmtQty(kg)} kg/ekor)</span>}
    </div>
  );
};

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const STTBStepper = ({ status, sttb }) => {
  const cfg        = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_QC;
  const current    = cfg.step;
  const isRejected = status === 'REJECTED';

  if (isRejected) return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
      <X size={14} className="text-red-500 shrink-0" />
      <div>
        <p className="text-[10px] font-black text-red-600 uppercase">STTB Ditolak</p>
        {sttb.rejectedNotes && <p className="text-[9px] text-red-400 mt-0.5 italic">{sttb.rejectedNotes}</p>}
        {sttb.rejectedBy    && <p className="text-[9px] text-red-400">Oleh: {sttb.rejectedBy}</p>}
      </div>
    </div>
  );

  const stamps = [
    { label: 'QC Penerimaan', by: sttb.qcApprovedBy,        at: sttb.qcApprovedAt,        notes: sttb.qcNotes        },
    { label: 'Admin',         by: sttb.adminApprovedBy,      at: sttb.adminApprovedAt,      notes: sttb.adminNotes      },
    { label: 'Supervisor',    by: sttb.supervisorApprovedBy, at: sttb.supervisorApprovedAt, notes: sttb.supervisorNotes },
    { label: 'Manager',       by: sttb.managerApprovedBy,    at: sttb.managerApprovedAt,    notes: sttb.managerNotes    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {STAGE_LABELS.map((label, i) => {
          const done   = status === 'APPROVED' || i < current;
          const active = i === current && status !== 'APPROVED';
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-[10px] font-black ${
                  done   ? 'bg-green-500 border-green-500 text-white' :
                  active ? 'bg-[#8da070] border-[#8da070] text-white animate-pulse' :
                           'bg-white border-gray-200 text-gray-300'
                }`}>
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <p className={`text-[7px] font-black uppercase whitespace-nowrap tracking-tight ${
                  done || active ? 'text-[#8da070]' : 'text-gray-300'
                }`}>{label}</p>
              </div>
              {i < STAGE_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 rounded-full ${done ? 'bg-[#8da070]' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="space-y-2">
        {stamps.map((s, i) => !s.by ? null : (
          <div key={i} className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-black text-green-700 uppercase">{s.label}</p>
              <p className="text-[10px] font-bold text-gray-700">{s.by}</p>
              {s.at    && <p className="text-[8px] text-gray-400">{new Date(s.at).toLocaleString('id-ID')}</p>}
              {s.notes && <p className="text-[8px] text-gray-500 italic mt-0.5">{s.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Timbang Sapi section ─────────────────────────────────────────────────────
const CattleWeightSection = ({ sttb }) => {
  const po = sttb.cattlePO;
  if (!sttb.jumlahEkor) return null;

  const breeds = po?.items?.map(i => `${i.jenisSapi} (${i.gender || '-'})`).join(', ') || '-';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 bg-[#8da070]/10 border border-[#8da070]/20 rounded-2xl">
        <span className="text-xl">🐄</span>
        <div>
          <p className="text-[10px] font-black text-[#8da070] uppercase tracking-widest">Data Sapi</p>
          <p className="text-[11px] font-bold text-gray-700">{po?.vendorName || '-'} · {po?.vendorCountry || '-'}</p>
          {po?.noPO && <p className="text-[9px] text-gray-400 font-bold">{po.noPO}</p>}
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-2xl">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Jenis Sapi</p>
        <p className="text-[11px] font-bold text-gray-700 uppercase">{breeds}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
        {[
          { label: 'Jumlah Ekor',     value: `${sttb.jumlahEkor} ekor`,                            bold: true  },
          { label: 'Berat Hidup Total', value: `${fmtQty(sttb.beratHidupTotal || 0)} kg`,          bold: false },
          { label: 'Rata-rata / Ekor', value: `${fmtQty(sttb.beratHidupRata  || 0)} kg`,           bold: false },
          { label: 'Berat Beli (PO)',  value: `${fmtQty(sttb.beratBeli       || 0)} kg/ekor`,      bold: false },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl p-3 text-center">
            <p className="text-[8px] font-black text-orange-400 uppercase">{m.label}</p>
            <p className={`text-[12px] font-black mt-0.5 ${m.bold ? 'text-orange-700' : 'text-gray-700'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {sttb.susutPct != null && (
        <div className={`p-3.5 rounded-2xl border ${sttb.susutAlert ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[9px] font-black uppercase ${sttb.susutAlert ? 'text-red-600' : 'text-green-700'}`}>
                {sttb.susutAlert ? '⚠ Susut Melebihi Batas!' : '✓ Susut Normal'}
              </p>
              <p className={`text-xl font-black italic ${sttb.susutAlert ? 'text-red-700' : 'text-green-700'}`}>
                {parseFloat(sttb.susutPct).toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase">Kehilangan</p>
              <p className="text-[11px] font-bold text-gray-700">{fmtQty(sttb.susutKg)} kg/ekor</p>
              <p className="text-[8px] text-gray-400">Batas: {SUSUT_ALERT}%</p>
            </div>
          </div>
        </div>
      )}

      {po?.hppPerEkor > 0 && (
        <div className="flex items-center justify-between p-3 bg-[#8da070]/5 border border-[#8da070]/20 rounded-2xl">
          <p className="text-[10px] font-black text-gray-500 uppercase">HPP / Ekor</p>
          <p className="text-[13px] font-black text-[#8da070] italic">{fmtRp(po.hppPerEkor)}</p>
        </div>
      )}
    </div>
  );
};

// ─── STTB Detail & Approval Modal ─────────────────────────────────────────────
const STTBDetailModal = ({ sttb, warehouses, onClose, onApproved, onRejected }) => {
  const { data: session }  = useSession();
  const [loading,     setLoading]     = useState('');
  const [notes,       setNotes]       = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [rejectMode,  setRejectMode]  = useState(false);

  const role = session?.user?.role;

  const canAdmin      = sttb.status === 'PENDING_QC'         && ['Admin', 'SuperAdmin', 'Super Admin'].includes(role);
  const canSupervisor = sttb.status === 'PENDING_SUPERVISOR'  && ['Supervisor', 'SuperAdmin', 'Super Admin'].includes(role);
  const canManager    = sttb.status === 'PENDING_MANAGER'     && ['Manager', 'SuperAdmin', 'Super Admin'].includes(role);
  const canReject     = !['APPROVED', 'REJECTED'].includes(sttb.status)
                        && ['Admin', 'Supervisor', 'Manager', 'SuperAdmin', 'Super Admin'].includes(role);
  const anyAction     = canAdmin || canSupervisor || canManager || canReject;

  const doApprove = async (stage) => {
    if (stage === 'manager' && !warehouseId) { alert('Pilih kandang terlebih dahulu.'); return; }
    setLoading(stage);
    try {
      const res = await fetch(`/api/cattle/cattleSttb/${sttb.id}/approve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, warehouseId: warehouseId || undefined, notes }),
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
    if (!notes.trim()) { alert('Isi alasan penolakan terlebih dahulu.'); return; }
    setLoading('reject');
    try {
      const res = await fetch(`/api/cattle/cattleSttb/${sttb.id}/approve`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'reject', notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRejected?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(''); }
  };

  const cattlePO = sttb.cattlePO;

  const printData = {
    sttbNo:               sttb.sttbNo,
    status:               sttb.status,
    isCattle:             true,
    noPO:                 cattlePO?.noPO,
    supplier:             cattlePO?.vendorName,
    // Sapi
    cattleVendorName:     cattlePO?.vendorName,
    cattleVendorCountry:  cattlePO?.vendorCountry,
    jumlahEkor:           sttb.jumlahEkor,
    beratHidupTotal:      sttb.beratHidupTotal,
    beratHidupRata:       sttb.beratHidupRata,
    beratBeli:            sttb.beratBeli,
    susutKg:              sttb.susutKg,
    susutPct:             sttb.susutPct,
    susutAlert:           sttb.susutAlert,
    hppPerEkor:           cattlePO?.hppPerEkor,
    cattleItems:          cattlePO?.items || [],
    // Stamps
    qcApprovedBy:         sttb.qcApprovedBy,
    qcApprovedAt:         sttb.qcApprovedAt,
    adminApprovedBy:      sttb.adminApprovedBy,
    adminApprovedAt:      sttb.adminApprovedAt,
    supervisorApprovedBy: sttb.supervisorApprovedBy,
    supervisorApprovedAt: sttb.supervisorApprovedAt,
    managerApprovedBy:    sttb.managerApprovedBy,
    managerApprovedAt:    sttb.managerApprovedAt,
    warehouseName:        sttb.warehouse?.name,
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className={`p-5 flex justify-between items-start shrink-0 ${
          sttb.status === 'APPROVED' ? 'bg-green-50' :
          sttb.status === 'REJECTED' ? 'bg-red-50' : 'bg-[#8da070]/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              sttb.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
              sttb.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-[#8da070]/20 text-[#8da070]'
            }`}>
              <span className="text-xl leading-none">🐄</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{sttb.sttbNo}</h3>
                <span className="text-[8px] font-black text-white bg-[#8da070] px-2 py-0.5 rounded-lg uppercase">Sapi</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-lg text-[9px] font-black uppercase border ${STATUS_CONFIG[sttb.status]?.cls}`}>
                {STATUS_CONFIG[sttb.status]?.label}
              </span>
              {sttb.susutAlert && <SusutBadge pct={sttb.susutPct} kg={sttb.susutKg} />}
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Pratinjau Dokumen</p>
                  <p className="text-xs font-bold">{sttb.sttbNo}</p>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 bg-white/10 hover:bg-red-500 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase">
                Tutup <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-700 p-4 overflow-auto flex justify-center">
              <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg overflow-hidden">
                <PrintSTTB data={printData} />
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          <STTBStepper status={sttb.status} sttb={sttb} />
          <CattleWeightSection sttb={sttb} />

          {/* Gudang (setelah Manager approve) */}
          {sttb.warehouse && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <Warehouse size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase">Kandang Penyimpanan</p>
                <p className="text-[11px] font-bold text-gray-800">{sttb.warehouse.name}</p>
              </div>
              <CheckCircle2 size={16} className="text-green-500 ml-auto" />
            </div>
          )}

          {/* Pesan akses */}
          {!anyAction && !['APPROVED', 'REJECTED'].includes(sttb.status) && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                Tahap ini membutuhkan role <strong>{STATUS_CONFIG[sttb.status]?.label?.replace('Menunggu ', '')}</strong>.
                Akun Anda ({role}) tidak memiliki akses untuk approve tahap ini.
              </p>
            </div>
          )}

          {/* Notes input */}
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
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Warehouse selector (Manager) */}
          {canManager && !rejectMode && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <Warehouse size={12} /> Kandang Tujuan *
              </label>
              <select
                className={`w-full border rounded-2xl py-4 px-4 text-[11px] font-black uppercase outline-none focus:ring-4 appearance-none cursor-pointer transition-all ${
                  warehouseId ? 'border-blue-300 bg-blue-50/20 text-gray-800 focus:ring-blue-500/10' : 'border-gray-100 bg-gray-50 text-gray-400 focus:ring-gray-100'
                }`}
                value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
              >
                <option value="">-- PILIH KANDANG --</option>
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
        {anyAction && (
          <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-3 shrink-0">
            {!rejectMode ? (
              <div className="flex gap-3">
                {canAdmin && (
                  <button onClick={() => doApprove('admin')} disabled={!!loading}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'admin' ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />}
                    Approve Admin
                  </button>
                )}
                {canSupervisor && (
                  <button onClick={() => doApprove('supervisor')} disabled={!!loading}
                    className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'supervisor' ? <Loader2 className="animate-spin" size={15} /> : <ShieldCheck size={15} />}
                    Approve SPV
                  </button>
                )}
                {canManager && (
                  <button onClick={() => doApprove('manager')} disabled={!!loading || !warehouseId}
                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg">
                    {loading === 'manager' ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                    Final & Masuk Kandang
                  </button>
                )}
                {canReject && (
                  <button onClick={() => setRejectMode(true)}
                    className="px-4 py-3.5 bg-red-50 text-red-500 border border-red-200 rounded-2xl text-[10px] font-black hover:bg-red-100 transition-all">
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={doReject} disabled={!!loading || !notes.trim()}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                  {loading === 'reject' ? <Loader2 className="animate-spin" size={15} /> : <X size={15} />}
                  Tolak STTB
                </button>
                <button onClick={() => { setRejectMode(false); setNotes(''); }}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-200">
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

// ─── Create Cattle STTB Modal ─────────────────────────────────────────────────
const CreateCattleSTTBModal = ({ isOpen, onClose, onSuccess }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [jumlahEkor, setJumlahEkor] = useState('');
  const [beratHidupTotal, setBeratHidupTotal] = useState('');
  const [suratJalan, setSuratJalan] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/cattle/purchasing?status=APPROVED')
      .then(r => r.ok ? r.json() : [])
      .then(data => setApprovedPOs(data.filter(po => !po.isReceived)))
      .catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPO(null); setJumlahEkor(''); setBeratHidupTotal('');
      setSuratJalan(''); setVehicleNo(''); setCondition('GOOD'); setNotes('');
    }
  }, [isOpen]);

  const avgBerat = selectedPO && parseInt(jumlahEkor) > 0 && parseFloat(beratHidupTotal) > 0
    ? parseFloat(beratHidupTotal) / parseInt(jumlahEkor)
    : 0;

  const beratBeli = selectedPO && selectedPO.totalHeadOrdered > 0
    ? selectedPO.totalWeightKg / selectedPO.totalHeadOrdered
    : 0;

  const susutKg  = beratBeli > 0 && avgBerat > 0 ? Math.max(0, beratBeli - avgBerat) : 0;
  const susutPct = beratBeli > 0 && susutKg > 0 ? (susutKg / beratBeli) * 100 : 0;

  const isValid = selectedPO && parseInt(jumlahEkor) > 0 && parseFloat(beratHidupTotal) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cattle/cattleSttb', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCattle: true,
          cattlePOId: selectedPO.id,
          jumlahEkor: parseInt(jumlahEkor),
          beratHidupTotal: parseFloat(beratHidupTotal),
          suratJalan: suratJalan || null,
          vehicleNo: vehicleNo || null,
          condition,
          notes: notes || null,
          receivedBy: session?.user?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      onSuccess?.(); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const CONDITIONS = [
    { v: 'GOOD',    l: '✅ Kondisi Baik & Sehat' },
    { v: 'DAMAGED', l: '❌ Ada Yang Sakit / Cedera' },
    { v: 'PARTIAL', l: '⚠️ Tidak Sesuai Spesifikasi' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[97vh] md:max-h-[90vh] animate-in slide-in-from-bottom md:zoom-in duration-300">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-[#8da070]/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20">
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase italic tracking-tight">Buat STTB Sapi</h2>
              <p className="text-[9px] font-bold text-[#8da070] uppercase tracking-widest">Input Timbang Kandang · Auto-Kalkulasi Susut</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Pilih PO Sapi */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              PO Sapi (Approved) *
            </label>
            {approvedPOs.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700">
                  Tidak ada PO Sapi yang sudah Approved dan belum diterima. Approve PO sapi terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {approvedPOs.map(po => (
                  <div key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedPO?.id === po.id
                        ? 'border-[#8da070] bg-[#8da070]/5 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-[#8da070]/40'
                    }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20">{po.noPO}</span>
                          {selectedPO?.id === po.id && <CheckCircle2 size={13} className="text-[#8da070]" />}
                        </div>
                        <p className="text-[11px] font-black text-gray-800 uppercase mt-1">{po.vendorName}</p>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-0.5">
                          <Globe size={9} /> {po.vendorCountry}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-gray-800">{po.totalHeadOrdered} ekor</p>
                        <p className="text-[9px] text-amber-600 font-bold">{fmtQty(po.totalWeightKg)} kg</p>
                        <p className="text-[8px] text-gray-400">≈{(po.totalWeightKg/Math.max(1,po.totalHeadOrdered)).toFixed(1)} kg/ekor</p>
                      </div>
                    </div>
                    {po.items?.length > 0 && (
                      <p className="text-[8px] text-gray-400 mt-1.5 truncate">
                        {po.items.map(i => `${i.jenisSapi} (${i.gender})`).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPO && (
            <>
              {/* Input timbang */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">
                    <Hash size={9} /> Jumlah Ekor Tiba *
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3">
                    <input type="number" step="1" min="1" max={selectedPO.totalHeadOrdered}
                      className="flex-1 py-3 bg-transparent text-sm font-black text-center text-gray-700 outline-none"
                      placeholder={selectedPO.totalHeadOrdered.toString()}
                      value={jumlahEkor} onChange={e => setJumlahEkor(e.target.value)} />
                    <span className="text-[9px] text-gray-400 shrink-0">ekor</span>
                  </div>
                  <p className="text-[8px] text-gray-400 ml-1">PO: {selectedPO.totalHeadOrdered} ekor</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">
                    <Scale size={9} /> Total Berat Hidup *
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3">
                    <input type="number" step="any" min="0.1"
                      className="flex-1 py-3 bg-transparent text-sm font-black text-center text-gray-700 outline-none"
                      value={beratHidupTotal} onChange={e => setBeratHidupTotal(e.target.value)} />
                    <span className="text-[9px] text-gray-400 shrink-0">kg</span>
                  </div>
                  {avgBerat > 0 && (
                    <p className="text-[8px] text-[#8da070] font-bold ml-1">≈{avgBerat.toFixed(1)} kg/ekor</p>
                  )}
                </div>
              </div>

              {/* Preview susut live */}
              {avgBerat > 0 && beratBeli > 0 && (
                <div className={`p-4 rounded-2xl border ${susutPct > SUSUT_ALERT ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-[9px] font-black uppercase ${susutPct > SUSUT_ALERT ? 'text-red-600' : 'text-green-700'}`}>
                    {susutPct > SUSUT_ALERT ? '⚠ Susut Melebihi Batas!' : '✓ Susut Normal'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    {[
                      { l: 'Berat Beli',   v: `${beratBeli.toFixed(1)} kg/ekor` },
                      { l: 'Berat Terima', v: `${avgBerat.toFixed(1)} kg/ekor` },
                      { l: 'Susut',        v: `${susutPct.toFixed(1)}%`, bold: true },
                    ].map((m, i) => (
                      <div key={i}>
                        <p className="text-[7px] font-black text-gray-400 uppercase">{m.l}</p>
                        <p className={`text-[12px] font-black ${m.bold && susutPct > SUSUT_ALERT ? 'text-red-600' : m.bold ? 'text-green-600' : 'text-gray-700'}`}>{m.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Surat jalan & plat */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Surat Jalan</label>
                  <input type="text" placeholder="SJ-XXXX"
                    className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-bold uppercase outline-none focus:border-[#8da070]/40"
                    value={suratJalan} onChange={e => setSuratJalan(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1">No. Plat Truk</label>
                  <input type="text" placeholder="D 1234 ABC"
                    className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-bold uppercase outline-none focus:border-[#8da070]/40"
                    value={vehicleNo} onChange={e => setVehicleNo(e.target.value.toUpperCase())} />
                </div>
              </div>

              {/* Kondisi */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Kondisi Sapi</label>
                <select value={condition} onChange={e => setCondition(e.target.value)}
                  className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-bold outline-none appearance-none">
                  {CONDITIONS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Catatan (Opsional)</label>
                <textarea rows={2}
                  className="w-full text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-medium outline-none resize-none"
                  placeholder="Catatan kondisi sapi, ear tag, dll..."
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/30 flex gap-3 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] uppercase hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading || !isValid}
            className="flex-[2] flex items-center justify-center gap-2 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#8da070]/20 hover:bg-[#7a8c61] active:scale-95 disabled:opacity-50 transition-all">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Buat STTB Sapi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── STTB Card ─────────────────────────────────────────────────────────────────
const STTBCard = ({ sttb, onView }) => {
  const cfg = STATUS_CONFIG[sttb.status] || STATUS_CONFIG.PENDING_QC;
  const currentStep = cfg.step;

  return (
    <div
      onClick={() => onView(sttb)}
      className="bg-white p-5 rounded-[28px] border border-[#8da070]/20 shadow-sm hover:shadow-lg hover:border-[#8da070]/50 transition-all cursor-pointer group active:scale-[0.98]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${cfg.cls}`}>
              {cfg.label}
            </span>
            <span className="text-[8px] font-black text-white bg-[#8da070] px-2 py-0.5 rounded-lg">🐄 Sapi</span>
            {sttb.susutAlert && (
              <span className="text-[8px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 flex items-center gap-1">
                <AlertTriangle size={9} /> Susut ⚠
              </span>
            )}
          </div>

          <h4 className="font-black text-gray-900 uppercase text-[13px] truncate">
            {sttb.cattlePO?.vendorName || 'Sapi Impor'}
          </h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
            {sttb.cattlePO?.vendorCountry}
          </p>
        </div>
        <div className="p-2.5 bg-[#8da070]/10 text-[#8da070] rounded-xl transition-all group-hover:bg-[#8da070] group-hover:text-white shrink-0">
          <Eye size={16} />
        </div>
      </div>

      {/* STTB No + PO */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20">
          {sttb.sttbNo}
        </span>
        <span className="text-[9px] font-bold text-gray-400">
          {sttb.cattlePO?.noPO}
        </span>
      </div>

      {/* Mini stepper */}
      <div className="flex items-center gap-1 mb-3">
        {[0, 1, 2, 3].map(i => {
          const done   = sttb.status === 'APPROVED' || i < currentStep;
          const active = i === currentStep && sttb.status !== 'APPROVED' && sttb.status !== 'REJECTED';
          return (
            <React.Fragment key={i}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${
                done   ? 'bg-green-500 text-white' :
                active ? 'bg-[#8da070] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 transition-all ${done ? 'bg-green-300' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-700">
            {sttb.jumlahEkor} ekor · {fmtQty(sttb.beratHidupTotal)} kg
          </p>
          {sttb.susutPct != null && (
            <p className={`text-[9px] font-bold flex items-center gap-1 ${
              sttb.susutAlert ? 'text-red-500' : 'text-green-600'
            }`}>
              <TrendingDown size={9} />
              Susut {parseFloat(sttb.susutPct).toFixed(1)}%
              {sttb.susutAlert ? ' ⚠' : ' ✓'}
            </p>
          )}
          <p className="text-[8px] text-gray-300 mt-0.5">
            {new Date(sttb.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {sttb.warehouse && (
          <span className="text-[9px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-1 rounded-lg border border-[#8da070]/20 flex items-center gap-1">
            <Warehouse size={10} /> {sttb.warehouse.name}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const STTBApprovalPage = () => {
  const { data: session } = useSession();
  const [sttbs, setSttbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showCreateCattle, setShowCreateCattle] = useState(false);

  const canCreateCattle = ['Admin', 'SuperAdmin', 'Super Admin', 'Staff', 'Supervisor'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sttbRes, whRes] = await Promise.all([
        fetch('/api/cattle/cattleSttb?type=cattle'),
        fetch('/api/warehouse'),
      ]);
      if (sttbRes.ok) setSttbs(await sttbRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = sttbs.filter(s => {
    const matchStatus = filter === 'ALL' || s.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !search
      || s.sttbNo?.toLowerCase().includes(q)
      || s.cattlePO?.vendorName?.toLowerCase().includes(q)
      || s.cattlePO?.noPO?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL: sttbs.length,
    PENDING_QC: sttbs.filter(s => s.status === 'PENDING_QC').length,
    PENDING_ADMIN: sttbs.filter(s => s.status === 'PENDING_ADMIN').length,
    PENDING_SUPERVISOR: sttbs.filter(s => s.status === 'PENDING_SUPERVISOR').length,
    PENDING_MANAGER: sttbs.filter(s => s.status === 'PENDING_MANAGER').length,
    APPROVED: sttbs.filter(s => s.status === 'APPROVED').length,
    REJECTED: sttbs.filter(s => s.status === 'REJECTED').length,
  };

  const susutAlerts = sttbs.filter(s => s.susutAlert).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 space-y-6 pb-24 md:pb-8">

      {/* Modals */}
      {selected && (
        <STTBDetailModal
          sttb={selected}
          warehouses={warehouses}
          onClose={() => setSelected(null)}
          onApproved={fetchData}
          onRejected={fetchData}
        />
      )}
      {showCreateCattle && (
        <CreateCattleSTTBModal
          isOpen={showCreateCattle}
          onClose={() => setShowCreateCattle(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Approval STTB Sapi
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            QC → Admin → Supervisor → Manager · Manajemen Penerimaan Sapi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* {canCreateCattle && (
            <button onClick={() => setShowCreateCattle(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#8da070] text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-[#8da070]/20 hover:bg-[#7a8c61] transition-all active:scale-95">
              <Plus size={15} strokeWidth={3} /> Buat STTB Sapi
            </button>
          )} */}
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-[#8da070] transition-all active:scale-95 disabled:opacity-50 shadow-sm text-[11px] font-black uppercase">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert susut */}
      {susutAlerts > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top duration-500">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-[11px] font-black text-red-700 uppercase tracking-wider">
              ⚠ {susutAlerts} STTB dengan Susut Melebihi Batas ({SUSUT_ALERT}%)
            </p>
            <p className="text-[9px] text-red-500 font-bold mt-0.5">
              Harap ditinjau sebelum approval Manager.
            </p>
          </div>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total',        key: 'ALL',                color: 'text-gray-700',   bg: 'bg-gray-50'   },
          { label: 'Pending QC',   key: 'PENDING_QC',         color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Pending Admin',key: 'PENDING_ADMIN',      color: 'text-amber-700',  bg: 'bg-amber-50'  },
          { label: 'Pending SPV',  key: 'PENDING_SUPERVISOR', color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Pending Mgr',  key: 'PENDING_MANAGER',    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Approved',     key: 'APPROVED',           color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Ditolak',      key: 'REJECTED',           color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(s => (
          <div key={s.key}
            onClick={() => setFilter(s.key)}
            className={`${s.bg} rounded-[20px] px-3 py-3 border border-white flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity ${
              filter === s.key ? 'ring-2 ring-offset-1 ring-[#8da070]' : ''
            }`}>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-wider leading-tight">{s.label}</p>
            <span className={`text-lg font-black ${s.color}`}>
              {loading ? '—' : counts[s.key]}
            </span>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#8da070]/20"
            placeholder="Cari STTB, No PO, Vendor Sapi..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { key: 'ALL', label: 'Semua' },
              { key: 'PENDING_QC', label: 'QC' },
              { key: 'PENDING_ADMIN', label: 'Admin' },
              { key: 'PENDING_SUPERVISOR', label: 'SPV' },
              { key: 'PENDING_MANAGER', label: 'Manager' },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'REJECTED', label: 'Ditolak' },
            ].map(s => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                  filter === s.key
                    ? 'bg-[#8da070] text-white border-[#8da070] shadow-md'
                    : 'bg-white text-gray-400 border-gray-100 hover:border-[#8da070]'
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
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-[#8da070]" size={36} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memuat STTB Sapi...</p>
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
            {search || filter !== 'ALL' ? 'Tidak ditemukan' : 'Belum ada STTB Sapi'}
          </p>
        </div>
      )}
    </div>
  );
};

export default STTBApprovalPage;