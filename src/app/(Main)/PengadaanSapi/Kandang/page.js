// /app/(Main)/PengadaanSapi/Kandang/page.js — v2
// Keboen Bapak ERP
// Fitur baru:
//  • CattleProfileModal — per-sapi detail (klik baris di CattleDetailModal)
//  • Tab Bobot     — 4 tipe (Beli, Terima, Grading, Panen) + kalkulasi susut
//  • Tab Kesehatan — status + riwayat catatan kesehatan
//  • Tab Vaksin    — daftar vaksin + form input baru
//  • Tab HPP       — komponen biaya + kalkulasi HPP/ekor & HPP/kg
//  • Tab Transfer  — pindah kandang + riwayat
// ──────────────────────────────────────────────────────────────

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Beef, Upload, X, CheckCircle2, AlertTriangle,
  RefreshCw, Loader2, ChevronRight, Scale,
  Warehouse, Calendar, Wifi, TrendingUp, TrendingDown,
  ChevronDown, Search, FileSpreadsheet, Activity,
  Hash, MapPin, Syringe, Heart, ArrowLeftRight,
  DollarSign, Plus, ChevronLeft, BarChart3,
  ShieldCheck, Thermometer, Package, Truck,
  Zap, Users, MoreHorizontal, ArrowRight, Check,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

// ─── Helpers ──────────────────────────────────────────────────
const fmtKg  = (v) => v != null ? `${parseFloat(v).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg` : '-';
const fmtRp  = (v) => v != null ? `Rp ${parseFloat(v).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '-';
const fmtPct = (v) => v != null ? `${parseFloat(v).toFixed(1)}%` : '-';
const fmtDate = (dt) => dt
  ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  : '-';
const fmtDateTime = (dt) => dt
  ? `${fmtDate(dt)} ${new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  : '-';

const resolveWeight = (c) => parseFloat(c?.weight ?? 0);
const resolveDate   = (c) => c?.lastScanAt ?? c?.lastWeightDate ?? null;

// ─── Configs ──────────────────────────────────────────────────
const STATUS_CFG = {
  ARRIVAL   : { label: 'Arrival',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-400'  },
  IN_KANDANG: { label: 'In Kandang', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', dot: 'bg-green-400'  },
  GRADING   : { label: 'Grading',    bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-400'   },
  SOLD      : { label: 'Sold',       bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-200', dot: 'bg-slate-400'  },
  KARANTINA : { label: 'Karantina',  bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200',dot: 'bg-purple-400' },
};

const HEALTH_CFG = {
  SEHAT    : { label: 'Sehat',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
  SAKIT    : { label: 'Sakit',     bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
  OBSERVASI: { label: 'Observasi', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  KARANTINA: { label: 'Karantina', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const WEIGHT_CFG = {
  BELI   : { label: 'Bobot Beli',    color: '#64748b', bg: 'bg-slate-50',   field: 'weightBeli',    location: 'Priok'      },
  TERIMA : { label: 'Bobot Terima',  color: '#8da070', bg: 'bg-green-50',   field: 'weightTerima',  location: 'Kandang'    },
  GRADING: { label: 'Bobot Grading', color: '#3b82f6', bg: 'bg-blue-50',    field: 'weightGrading', location: 'Grading'    },
  PANEN  : { label: 'Bobot Panen',   color: '#f59e0b', bg: 'bg-amber-50',   field: 'weightPanen',   location: 'Panen'      },
};

const HPP_CAT_CFG = {
  HARGA_BELI   : { label: 'Harga Beli',      icon: <Beef size={12} />,      color: 'text-slate-700', bg: 'bg-slate-100'   },
  LANDED_COST  : { label: 'Landed Cost',     icon: <Truck size={12} />,     color: 'text-blue-700',  bg: 'bg-blue-50'     },
  KARANTINA    : { label: 'Karantina',       icon: <ShieldCheck size={12}/>,color: 'text-purple-700',bg: 'bg-purple-50'   },
  PAKAN        : { label: 'Pakan',           icon: <Package size={12} />,   color: 'text-green-700', bg: 'bg-green-50'    },
  TENAGA_KERJA : { label: 'Tenaga Kerja',    icon: <Users size={12} />,     color: 'text-orange-700',bg: 'bg-orange-50'   },
  UTILITAS     : { label: 'Listrik & Air',   icon: <Zap size={12} />,       color: 'text-yellow-700',bg: 'bg-yellow-50'   },
  OVERHEAD     : { label: 'Overhead',        icon: <BarChart3 size={12} />, color: 'text-indigo-700',bg: 'bg-indigo-50'   },
  LAINNYA      : { label: 'Lainnya',         icon: <MoreHorizontal size={12}/>,color:'text-gray-700',bg: 'bg-gray-100'    },
};

// ─── Badges ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.ARRIVAL;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const HealthBadge = ({ status }) => {
  const c = HEALTH_CFG[status] || HEALTH_CFG.SEHAT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

const SusutBadge = ({ pct }) => {
  if (pct == null) return null;
  const isCrit = pct > 8.5;
  const isWarn = pct > 8.0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
      isCrit ? 'bg-red-50 text-red-600 border-red-200'
      : isWarn ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-green-50 text-green-700 border-green-200'
    }`}>
      {isCrit || isWarn ? <AlertTriangle size={8} /> : <CheckCircle2 size={8} />}
      Susut {fmtPct(pct)}{isCrit ? ' ⚠' : ''}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// CattleProfileModal — per-sapi full detail dengan tab
// ═══════════════════════════════════════════════════════════════
const CattleProfileModal = ({ cattleId, isOpen, onClose, warehouses }) => {
  const { data: session }   = useSession();
  const [data,    setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]   = useState('bobot');
  const [saving,  setSaving] = useState(false);
  const [msg,     setMsg]   = useState(null); // { type: 'ok'|'err', text }

  const isAuthorized = ['SuperAdmin','Admin','Supervisor','Staff'].includes(session?.user?.role);

  const fetchDetail = useCallback(async () => {
    if (!cattleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cattle/${cattleId}`);
      if (res.ok) setData(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [cattleId]);

  useEffect(() => {
    if (isOpen && cattleId) { setTab('bobot'); setMsg(null); fetchDetail(); }
  }, [isOpen, cattleId, fetchDetail]);

  const post = async (url, body) => {
    setSaving(true); setMsg(null);
    try {
      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: json.message }); fetchDetail(); }
      else        { setMsg({ type: 'err', text: json.message }); }
    } catch { setMsg({ type: 'err', text: 'Gagal terhubung.' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const TABS = [
    { key: 'bobot',     label: 'Bobot',      icon: <Scale size={13} />         },
    { key: 'kesehatan', label: 'Kesehatan',   icon: <Heart size={13} />         },
    { key: 'vaksin',    label: 'Vaksin',      icon: <Syringe size={13} />       },
    { key: 'hpp',       label: 'HPP',         icon: <DollarSign size={13} />    },
    { key: 'transfer',  label: 'Transfer',    icon: <ArrowLeftRight size={13} />},
  ];

  return (
    <div className="fixed inset-0 z-[350] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

        {/* ── Header ── */}
        <div className="p-5 md:p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl text-white shadow-lg shrink-0 ${
                data?.healthStatus === 'SAKIT' ? 'bg-red-500 shadow-red-200'
                : data?.healthStatus === 'KARANTINA' ? 'bg-purple-500 shadow-purple-200'
                : 'bg-[#8da070] shadow-[#8da070]/20'
              }`}>
                <Wifi size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-800 text-[13px] font-mono uppercase truncate leading-none">
                  {data?.id ?? cattleId}
                </p>
                {data?.name && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{data.name}</p>}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {data && <StatusBadge status={data.status} />}
                  {data && <HealthBadge status={data.healthStatus} />}
                  {data?.vaccinated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border bg-teal-50 text-teal-700 border-teal-200">
                      <Syringe size={8} /> Vaksin ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all shrink-0">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Kandang + quick weight row */}
          {data && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-[7px] font-black text-slate-400 uppercase">Kandang</p>
                <p className="text-[11px] font-black text-slate-700 truncate">{data.warehouse?.name ?? '-'}</p>
              </div>
              <div className="bg-[#8da070]/10 rounded-xl p-2.5">
                <p className="text-[7px] font-black text-[#8da070] uppercase">Bobot Terima</p>
                <p className="text-[11px] font-black text-[#8da070]">{fmtKg(data.weightTerima ?? data.weight)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-[7px] font-black text-slate-400 uppercase">HPP/Ekor</p>
                <p className="text-[11px] font-black text-slate-700">{data.hppPerEkor ? fmtRp(data.hppPerEkor) : '-'}</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {msg && (
            <div className={`mt-3 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 ${
              msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg.type === 'ok' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {msg.text}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-slate-50 p-1 rounded-xl">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  tab === t.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}>
                {t.icon} <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-[#8da070] mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Memuat detail sapi...</p>
            </div>
          ) : !data ? (
            <p className="text-center text-slate-400 text-sm mt-10">Data tidak tersedia</p>
          ) : (
            <>
              {tab === 'bobot'     && <TabBobot     data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} />}
              {tab === 'kesehatan' && <TabKesehatan data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} />}
              {tab === 'vaksin'    && <TabVaksin    data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} />}
              {tab === 'hpp'       && <TabHPP       data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} />}
              {tab === 'transfer'  && <TabTransfer  data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} warehouses={warehouses} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: BOBOT — 4 tipe + susut + form input
// ══════════════════════════════════════════
const TabBobot = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm] = useState({ weightType: 'TERIMA', weight: '', location: '', note: '' });

  const susut = data.susutPct ?? (
    data.weightBeli && data.weightTerima
      ? ((data.weightBeli - data.weightTerima) / data.weightBeli) * 100
      : null
  );

  const weightTypes = ['BELI','TERIMA','GRADING','PANEN'];

  return (
    <div className="space-y-5">
      {/* 4 Weight cards */}
      <div className="grid grid-cols-2 gap-3">
        {weightTypes.map((type) => {
          const cfg = WEIGHT_CFG[type];
          const val = data[cfg.field];
          const hasVal = val != null && val > 0;
          return (
            <div key={type} className={`rounded-[18px] p-4 border ${hasVal ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-dashed border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{cfg.label}</p>
              </div>
              {hasVal ? (
                <>
                  <p className="text-2xl font-black leading-none" style={{ color: cfg.color }}>{fmtKg(val)}</p>
                  {type === 'TERIMA' && data.weightBeli && (
                    <p className="text-[8px] text-slate-400 font-bold mt-1">
                      dari {fmtKg(data.weightBeli)} beli
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] font-black text-slate-300 italic">Belum diisi</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Susut analysis */}
      <div className={`rounded-[18px] p-4 border ${
        susut == null ? 'bg-slate-50 border-dashed border-slate-200'
        : susut > 8.5 ? 'bg-red-50 border-red-200'
        : susut > 8.0 ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Analisis Susut (Beli → Terima)</p>
          {susut != null && <SusutBadge pct={susut} />}
        </div>
        {susut != null ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: 'Bobot Beli',   v: fmtKg(data.weightBeli)   },
              { l: 'Bobot Terima', v: fmtKg(data.weightTerima) },
              { l: 'Selisih',      v: fmtKg((data.weightBeli ?? 0) - (data.weightTerima ?? 0)) },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-[7px] font-black text-slate-500 uppercase">{s.l}</p>
                <p className="text-[12px] font-black text-slate-800">{s.v}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 italic">Isi Bobot Beli dan Bobot Terima untuk kalkulasi susut otomatis.</p>
        )}
        {susut != null && (
          <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${
              susut > 8.5 ? 'bg-red-400' : susut > 8.0 ? 'bg-amber-400' : 'bg-green-400'
            }`} style={{ width: `${Math.min(susut / 12 * 100, 100)}%` }} />
          </div>
        )}
        <p className="text-[7px] text-slate-400 mt-1">Toleransi: ≤8.0% normal · 8.0–8.5% warning · &gt;8.5% kritis</p>
      </div>

      {/* History */}
      {data.weightRecords?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Riwayat Penimbangan</p>
          <div className="space-y-1.5">
            {data.weightRecords.map((r) => (
              <div key={r.id} className="bg-white rounded-xl px-3 py-2 border border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${WEIGHT_CFG[r.weightType]?.bg ?? 'bg-slate-50'}`}
                    style={{ color: WEIGHT_CFG[r.weightType]?.color }}>
                    {r.weightType}
                  </span>
                  <span className="text-[9px] text-slate-400">{fmtDateTime(r.recordedAt)}</span>
                  {r.location && <span className="text-[8px] text-slate-300">· {r.location}</span>}
                </div>
                <span className="font-black text-slate-800 text-[11px]">{fmtKg(r.weight)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form input bobot */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Input Bobot Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Tipe Bobot *</label>
              <select value={form.weightType} onChange={(e) => setForm((f) => ({ ...f, weightType: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                {weightTypes.map((t) => <option key={t} value={t}>{WEIGHT_CFG[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Berat (kg) *</label>
              <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                placeholder="mis: 312.5"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>
          <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Lokasi timbang (mis: Priok, Kandang A)"
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Catatan (opsional)"
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          <button onClick={() => onPost(`/api/cattle/${data.id}/weight`, form)} disabled={saving || !form.weight}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8da070] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Simpan Bobot
          </button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: KESEHATAN
// ══════════════════════════════════════════
const TabKesehatan = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm] = useState({ healthStatus: 'SEHAT', diagnosis: '', treatment: '', treatedBy: '', note: '' });

  const hCfg = HEALTH_CFG[data.healthStatus] ?? HEALTH_CFG.SEHAT;

  return (
    <div className="space-y-5">
      {/* Current status */}
      <div className={`rounded-[18px] p-5 border ${hCfg.bg} ${hCfg.border}`}>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Status Kesehatan Saat Ini</p>
        <p className={`text-2xl font-black uppercase italic tracking-tight ${hCfg.text}`}>{hCfg.label}</p>
        <p className="text-[9px] opacity-60 mt-1">Diperbarui: {fmtDateTime(data.updatedAt)}</p>
      </div>

      {/* Health history */}
      {data.healthRecords?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Riwayat Kesehatan</p>
          <div className="space-y-2">
            {data.healthRecords.map((r) => {
              const c = HEALTH_CFG[r.healthStatus] ?? HEALTH_CFG.SEHAT;
              return (
                <div key={r.id} className={`rounded-xl p-3 border ${c.bg} ${c.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-black uppercase ${c.text}`}>{c.label}</span>
                    <span className="text-[8px] text-slate-400">{fmtDateTime(r.recordedAt)}</span>
                  </div>
                  {r.diagnosis  && <p className="text-[10px] font-bold text-slate-700">Diagnosa: {r.diagnosis}</p>}
                  {r.treatment  && <p className="text-[10px] text-slate-600">Treatment: {r.treatment}</p>}
                  {r.treatedBy  && <p className="text-[9px] text-slate-400">Oleh: {r.treatedBy}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Perbarui Catatan Kesehatan</p>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Status Baru *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(HEALTH_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => setForm((f) => ({ ...f, healthStatus: key }))}
                  className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase border transition-all ${
                    form.healthStatus === key ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm` : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          {['diagnosis','treatment','treatedBy','note'].map((field) => (
            <input key={field} type="text" value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              placeholder={{ diagnosis: 'Diagnosa penyakit', treatment: 'Tindakan/obat', treatedBy: 'Nama dokter/petugas', note: 'Catatan tambahan' }[field]}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          ))}
          <button onClick={() => onPost(`/api/cattle/${data.id}/health`, form)} disabled={saving}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8da070] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Simpan Catatan
          </button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: VAKSIN
// ══════════════════════════════════════════
const VACCINE_TYPES = ['ANTHRAX','JEMBRANA','SE (Septicemia)','BRUCELLOSIS','HELMINTHIASIS','FMD','LEPTOSPIROSIS','LAINNYA'];

const TabVaksin = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm] = useState({
    vaccineType: 'ANTHRAX', vaccineDate: '', doseNumber: '1', nextDueDate: '', administeredBy: '', batchNo: '', note: '',
  });

  const today     = new Date();
  const overdue   = (data.vaccines ?? []).filter((v) => v.nextDueDate && new Date(v.nextDueDate) < today);

  return (
    <div className="space-y-5">
      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[18px] p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase">Vaksin Terlambat</p>
            <p className="text-[9px] text-amber-700 mt-0.5">{overdue.map((v) => `${v.vaccineType} (jatuh ${fmtDate(v.nextDueDate)})`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-[18px] p-4 border ${data.vaccinated ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Vaksin</p>
          <p className={`text-sm font-black uppercase italic ${data.vaccinated ? 'text-teal-700' : 'text-slate-400'}`}>
            {data.vaccinated ? '✓ Sudah Vaksin' : 'Belum Vaksin'}
          </p>
          {data.lastVaccineDate && (
            <p className="text-[8px] text-teal-600 mt-0.5">Terakhir: {fmtDate(data.lastVaccineDate)}</p>
          )}
        </div>
        <div className="bg-slate-50 rounded-[18px] p-4 border border-slate-100">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Vaksinasi</p>
          <p className="text-2xl font-black text-slate-800">{data.vaccines?.length ?? 0}</p>
          <p className="text-[8px] text-slate-400">record</p>
        </div>
      </div>

      {/* Vaccine list */}
      {data.vaccines?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Riwayat Vaksin</p>
          <div className="space-y-2">
            {data.vaccines.map((v) => {
              const isDue = v.nextDueDate && new Date(v.nextDueDate) < today;
              return (
                <div key={v.id} className="bg-white rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg"><Syringe size={11} /></div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800 uppercase">{v.vaccineType}</p>
                        <p className="text-[8px] text-slate-400">Dosis {v.doseNumber} · {fmtDate(v.vaccineDate)}</p>
                      </div>
                    </div>
                    {v.nextDueDate && (
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border ${
                        isDue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {isDue ? '⚠ ' : ''}Next: {fmtDate(v.nextDueDate)}
                      </span>
                    )}
                  </div>
                  {v.administeredBy && <p className="text-[8px] text-slate-300 mt-1">Oleh: {v.administeredBy}{v.batchNo ? ` · Batch: ${v.batchNo}` : ''}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Input Vaksin Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Jenis Vaksin *</label>
              <select value={form.vaccineType} onChange={(e) => setForm((f) => ({ ...f, vaccineType: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                {VACCINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Dosis ke-</label>
              <input type="number" min="1" value={form.doseNumber} onChange={(e) => setForm((f) => ({ ...f, doseNumber: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Tanggal Vaksin *</label>
              <input type="date" value={form.vaccineDate} onChange={(e) => setForm((f) => ({ ...f, vaccineDate: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Tanggal Berikutnya</label>
              <input type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.administeredBy} onChange={(e) => setForm((f) => ({ ...f, administeredBy: e.target.value }))}
              placeholder="Petugas / dokter hewan"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            <input type="text" value={form.batchNo} onChange={(e) => setForm((f) => ({ ...f, batchNo: e.target.value }))}
              placeholder="No. batch vaksin"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          </div>
          <button onClick={() => onPost(`/api/cattle/${data.id}/vaccine`, form)}
            disabled={saving || !form.vaccineType || !form.vaccineDate}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Syringe size={13} />} Simpan Vaksin
          </button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: HPP — komponen biaya + kalkulasi
// ══════════════════════════════════════════
const TabHPP = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm] = useState({ category: 'PAKAN', description: '', amount: '', isPerHead: true, headCount: '', note: '' });

  // Rekonstruksi breakdown dari data
  const components = data.hppComponents ?? [];
  const perHead    = (c) => c.isPerHead ? c.amount : (c.headCount ? c.amount / c.headCount : c.amount);

  const grouped = {};
  for (const c of components) {
    if (!grouped[c.category]) grouped[c.category] = { total: 0, items: [] };
    grouped[c.category].total += perHead(c);
    grouped[c.category].items.push({ ...c, amountPerHead: perHead(c) });
  }

  const totalComponents = components.reduce((s, c) => s + perHead(c), 0);
  const baseHargaBeli   = data.hargaBeliTotal ?? 0;
  const grandTotal      = baseHargaBeli + totalComponents;
  const hppPerKg        = data.weightTerima ? grandTotal / data.weightTerima : null;

  // Susut cost adjustment: HPP pakai weightTerima tapi bayar harga weightBeli
  const susutCostAdj = data.weightBeli && data.weightTerima && data.hargaBeliPerKg
    ? (data.weightBeli - data.weightTerima) * data.hargaBeliPerKg
    : null;

  return (
    <div className="space-y-5">
      {/* HPP summary */}
      <div className="bg-white rounded-[18px] p-5 border border-slate-100 space-y-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ringkasan HPP</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
            <span className="text-[11px] text-slate-600 font-bold">Harga Beli Base</span>
            <span className="font-black text-slate-800 text-[11px]">
              {data.hargaBeliTotal ? fmtRp(data.hargaBeliTotal) : '-'}
            </span>
          </div>
          {data.hargaBeliPerKg && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-[11px] text-slate-500">@ {fmtRp(data.hargaBeliPerKg)}/kg × {fmtKg(data.weightBeli)}</span>
              <span className="text-[10px] text-slate-400">bobot beli</span>
            </div>
          )}
          {susutCostAdj != null && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <TrendingDown size={10} /> Kerugian Susut
              </span>
              <span className="font-black text-amber-700 text-[11px]">{fmtRp(susutCostAdj)}</span>
            </div>
          )}
          {Object.entries(grouped).map(([cat, val]) => {
            const cfg = HPP_CAT_CFG[cat] ?? HPP_CAT_CFG.LAINNYA;
            return (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className={`text-[11px] font-bold flex items-center gap-1.5 ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="font-black text-slate-800 text-[11px]">{fmtRp(val.total)}</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between py-2 bg-slate-900 -mx-1 px-3 rounded-xl mt-2">
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Total HPP/Ekor</span>
            <span className="font-black text-[#8da070] text-base">{fmtRp(grandTotal)}</span>
          </div>
          {hppPerKg && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400 font-bold">HPP per kg (bobot terima)</span>
              <span className="font-black text-slate-700 text-[11px]">{fmtRp(hppPerKg)}/kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Komponen detail */}
      {components.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Detail Komponen</p>
          <div className="space-y-1.5">
            {components.map((c) => {
              const cfg = HPP_CAT_CFG[c.category] ?? HPP_CAT_CFG.LAINNYA;
              return (
                <div key={c.id} className={`rounded-xl px-3 py-2 border ${cfg.bg} flex items-center justify-between gap-2`}>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black uppercase ${cfg.color}`}>{c.description}</p>
                    <p className="text-[8px] text-slate-400">
                      {cfg.label}{!c.isPerHead && c.headCount ? ` · batch ÷ ${c.headCount}` : ' · per ekor'}
                    </p>
                  </div>
                  <span className={`font-black text-[11px] shrink-0 ${cfg.color}`}>{fmtRp(perHead(c))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form tambah komponen */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tambah Komponen Biaya</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Kategori *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                {Object.entries(HPP_CAT_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Jumlah (IDR) *</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="mis: 150000"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          </div>
          <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Keterangan biaya (mis: Pakan konsentrat minggu ke-1)"
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPerHead} onChange={(e) => setForm((f) => ({ ...f, isPerHead: e.target.checked }))}
                className="accent-[#8da070]" />
              <span className="text-[10px] font-bold text-slate-600">Jumlah di atas sudah per ekor</span>
            </label>
          </div>
          {!form.isPerHead && (
            <input type="number" min="1" value={form.headCount} onChange={(e) => setForm((f) => ({ ...f, headCount: e.target.value }))}
              placeholder="Jumlah ekor dalam batch (untuk dibagi rata)"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          )}
          <button onClick={() => onPost(`/api/cattle/${data.id}/hpp`, form)}
            disabled={saving || !form.category || !form.description || !form.amount}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8da070] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Tambah Biaya
          </button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: TRANSFER
// ══════════════════════════════════════════
const TabTransfer = ({ data, onPost, saving, isAuthorized, warehouses }) => {
  const [form, setForm] = useState({ toWarehouseId: '', reason: '', note: '' });
  const availableWh = (warehouses ?? []).filter((w) => w.id !== data.warehouseId);

  return (
    <div className="space-y-5">
      {/* Current location */}
      <div className="bg-[#8da070]/10 rounded-[18px] p-4 border border-[#8da070]/20 flex items-center gap-3">
        <div className="p-2.5 bg-[#8da070] text-white rounded-xl"><Warehouse size={16} /></div>
        <div>
          <p className="text-[8px] font-black text-[#8da070] uppercase tracking-widest">Lokasi Sekarang</p>
          <p className="font-black text-slate-800 text-sm uppercase italic">{data.warehouse?.name ?? '-'}</p>
          {data.warehouse?.code && <p className="text-[8px] text-slate-400">{data.warehouse.code}</p>}
        </div>
      </div>

      {/* Transfer history */}
      {data.transfers?.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Riwayat Transfer</p>
          <div className="space-y-2">
            {data.transfers.map((t) => (
              <div key={t.id} className="bg-white rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 truncate">{t.fromWarehouse?.name ?? '?'}</span>
                  <ArrowRight size={10} className="text-[#8da070] shrink-0" />
                  <span className="text-[10px] font-black text-slate-800 truncate">{t.toWarehouse?.name ?? '?'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] text-slate-400">{fmtDateTime(t.transferredAt)}</span>
                  {t.reason && <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{t.reason}</span>}
                </div>
                {t.transferredBy && <p className="text-[8px] text-slate-300 mt-0.5">Oleh: {t.transferredBy}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer form */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pindah ke Kandang Lain</p>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Kandang Tujuan *</label>
            <select value={form.toWarehouseId} onChange={(e) => setForm((f) => ({ ...f, toWarehouseId: e.target.value }))}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
              <option value="">-- Pilih Kandang Tujuan --</option>
              {availableWh.map((w) => (
                <option key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Alasan Transfer</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['Grading','Penggemukan','Karantina','Penjualan','Perawatan','Lainnya'].map((r) => (
                <button key={r} onClick={() => setForm((f) => ({ ...f, reason: r }))}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${
                    form.reason === r
                      ? 'bg-[#8da070] text-white border-[#8da070]'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#8da070]'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Catatan tambahan (opsional)"
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          <button onClick={() => onPost(`/api/cattle/${data.id}/transfer`, form)}
            disabled={saving || !form.toWarehouseId}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#8da070] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeftRight size={13} />} Pindah Kandang
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CattleDetailModal — daftar sapi dalam satu kandang
// Klik baris → CattleProfileModal
// ═══════════════════════════════════════════════════════════════
const CattleDetailModal = ({ warehouse, isOpen, onClose, warehouses }) => {
  const [cattle,    setCattle]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('ALL');
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    if (!isOpen || !warehouse?.id) return;
    setSearch(''); setFilter('ALL');
    setLoading(true);
    fetch(`/api/cattle/import-rfid?warehouseId=${warehouse.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setCattle)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, warehouse?.id]);

  if (!isOpen || !warehouse) return null;

  const filtered = cattle.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.id.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)) &&
      (filter === 'ALL' || c.status === filter)
    );
  });

  const activeWeight     = filtered.reduce((s, c) => s + resolveWeight(c), 0);
  const totalAllStatus   = warehouse._count?.cattle ?? cattle.length;
  const vaccinated       = cattle.filter((c) => c.vaccinated).length;
  const healthIssues     = cattle.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length;

  return (
    <>
      <div className="fixed inset-0 z-[250] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-400 flex flex-col">

          {/* Header */}
          <div className="p-5 md:p-6 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20">
                  <Warehouse size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">{warehouse.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {warehouse.code && (
                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                        <Hash size={7} strokeWidth={4} /> {warehouse.code}
                      </span>
                    )}
                    {warehouse.address && (
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin size={9} /> {warehouse.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all shrink-0">
                <X size={22} className="text-slate-400" />
              </button>
            </div>

            {/* Mini stats 5 kolom */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { l: 'Total', v: totalAllStatus, bg: 'bg-slate-50' },
                { l: 'Aktif', v: filtered.length, bg: 'bg-[#8da070]/10' },
                { l: 'Vaksin', v: vaccinated, bg: 'bg-teal-50' },
                { l: 'Isu Kes.', v: healthIssues, bg: healthIssues > 0 ? 'bg-red-50' : 'bg-slate-50' },
                { l: 'Berat', v: fmtKg(activeWeight), bg: 'bg-blue-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-xl p-2`}>
                  <p className="text-[7px] font-black text-slate-400 uppercase">{s.l}</p>
                  <p className="text-[11px] font-black text-slate-800">{s.v}</p>
                </div>
              ))}
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder="Cari RFID atau nama..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
              </div>
              <div className="relative">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-[10px] font-black text-slate-600 focus:outline-none">
                  <option value="ALL">Semua</option>
                  <option value="IN_KANDANG">In Kandang</option>
                  <option value="ARRIVAL">Arrival</option>
                  <option value="GRADING">Grading</option>
                  <option value="KARANTINA">Karantina</option>
                  <option value="SOLD">Sold</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Cattle list */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#8da070] mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Memuat data sapi...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Beef size={36} className="text-slate-200 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tidak ada data</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-[#8da070]/10 rounded-2xl px-4 py-2.5 flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-[#8da070] uppercase tracking-widest">{filtered.length} ekor</span>
                  <span className="text-[9px] font-black text-[#8da070]">Total: {fmtKg(activeWeight)}</span>
                </div>

                {filtered.map((c) => {
                  const displayWeight = resolveWeight(c);
                  const displayDate   = resolveDate(c);
                  const hasIssue      = c.healthStatus && c.healthStatus !== 'SEHAT';

                  return (
                    // Klik → CattleProfileModal
                    <div key={c.id} onClick={() => setProfileId(c.id)}
                      className="bg-white rounded-[18px] p-4 border border-slate-100 flex items-center gap-3 hover:border-[#8da070]/30 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]"
                    >
                      <div className={`p-2 rounded-xl shrink-0 transition-all group-hover:scale-110 ${
                        hasIssue ? 'bg-red-50 text-red-500' : 'bg-[#8da070]/10 text-[#8da070] group-hover:bg-[#8da070] group-hover:text-white'
                      }`}>
                        <Wifi size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight font-mono">{c.id}</span>
                          {c.name && <span className="text-[9px] text-slate-400 font-bold">{c.name}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <StatusBadge status={c.status} />
                          {c.healthStatus && c.healthStatus !== 'SEHAT' && <HealthBadge status={c.healthStatus} />}
                          {c.vaccinated && (
                            <span className="text-[8px] text-teal-600 font-black bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                              💉 Vaksin
                            </span>
                          )}
                          {c.susutPct != null && <SusutBadge pct={c.susutPct} />}
                          {displayDate && (
                            <span className="text-[8px] text-slate-300 font-bold flex items-center gap-0.5">
                              <Calendar size={8} /> {fmtDate(displayDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-base font-black text-slate-900">{fmtKg(displayWeight)}</p>
                          {c.hppPerEkor && <p className="text-[8px] text-[#8da070] font-black">{fmtRp(c.hppPerEkor)}</p>}
                        </div>
                        <div className="p-1.5 bg-slate-50 text-slate-300 rounded-lg group-hover:bg-[#8da070] group-hover:text-white transition-all">
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CattleProfileModal stacks on top */}
      <CattleProfileModal
        cattleId={profileId}
        isOpen={!!profileId}
        onClose={() => setProfileId(null)}
        warehouses={warehouses}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// KandangCard
// ═══════════════════════════════════════════════════════════════
const KandangCard = ({ warehouse, onOpen }) => {
  const activeCattle = warehouse.cattle ?? [];
  const headCount    = activeCattle.length;
  const totalCount   = warehouse._count?.cattle ?? headCount;
  const soldCount    = Math.max(0, totalCount - headCount);
  const totalWeight  = activeCattle.reduce((s, c) => s + resolveWeight(c), 0);
  const avgWeight    = headCount > 0 ? totalWeight / headCount : 0;
  const vaccinated   = activeCattle.filter((c) => c.vaccinated).length;
  const healthIssues = activeCattle.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length;

  const fillPct  = warehouse.capacity ? Math.min(100, Math.round((headCount / warehouse.capacity) * 100)) : null;
  const capColor = fillPct > 90 ? 'bg-red-400' : fillPct > 70 ? 'bg-amber-400' : 'bg-[#8da070]';

  return (
    <div onClick={() => onOpen(warehouse)}
      className="bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm cursor-pointer hover:border-[#8da070]/40 hover:shadow-2xl hover:shadow-[#8da070]/10 active:scale-[0.97] transition-all group relative overflow-hidden"
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#8da070]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

      {/* Health alert badge */}
      {healthIssues > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            {healthIssues} isu
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8da070] text-white rounded-xl shadow-lg shadow-[#8da070]/20 shrink-0 group-hover:rotate-[-5deg] transition-transform">
            <Warehouse size={18} />
          </div>
          <div>
            <h4 className="font-black text-gray-900 uppercase text-[13px] tracking-tight leading-none">{warehouse.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {warehouse.code && <span className="text-[8px] font-black text-slate-400 uppercase">{warehouse.code}</span>}
              {warehouse.address && <span className="text-[8px] text-slate-300 flex items-center gap-0.5"><MapPin size={7} /> {warehouse.address}</span>}
            </div>
          </div>
        </div>
        <div className="p-2 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-[#8da070] group-hover:text-white transition-all shrink-0">
          <ChevronRight size={14} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 rounded-2xl p-3">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Beef size={8} /> Aktif</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{headCount.toLocaleString('id-ID')}</p>
          {soldCount > 0 && <p className="text-[8px] text-slate-300 font-bold mt-0.5">{soldCount} sold</p>}
        </div>
        <div className="bg-[#8da070]/5 rounded-2xl p-3">
          <p className="text-[8px] font-black text-[#8da070]/70 uppercase mb-1 flex items-center gap-1"><Scale size={8} /> Berat</p>
          <p className="text-sm font-black text-[#8da070] leading-none">{fmtKg(totalWeight)}</p>
          <p className="text-[8px] text-[#8da070]/50 font-bold mt-0.5">avg {fmtKg(avgWeight)}</p>
        </div>
      </div>

      {/* Vaksin & health mini row */}
      {headCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[8px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Syringe size={8} /> {vaccinated}/{headCount} vaksin
          </span>
          {healthIssues > 0 && (
            <span className="text-[8px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Heart size={8} /> {healthIssues} perlu atensi
            </span>
          )}
        </div>
      )}

      {fillPct !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-slate-400 uppercase">Kapasitas</p>
            <p className="text-[8px] font-black text-slate-500">{headCount}/{warehouse.capacity}</p>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${capColor}`} style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      )}

      {headCount > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
          <Activity size={9} className="text-[#8da070] animate-pulse" />
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Active</span>
        </div>
      )}
    </div>
  );
};

// ─── ImportModal (unchanged) ──────────────────────────────────
const ImportModal = ({ isOpen, onClose, warehouses, onSuccess }) => {
  const fileRef = useRef(null);
  const [file,        setFile]        = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [note,        setNote]        = useState('');
  const [progress,    setProgress]    = useState(0);
  const [status,      setStatus]      = useState('idle');
  const [result,      setResult]      = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  const reset = () => {
    setFile(null); setWarehouseId(''); setNote('');
    setProgress(0); setStatus('idle'); setResult(null); setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!file || !warehouseId) return;
    setStatus('uploading'); setProgress(10);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('warehouseId', warehouseId);
    if (note.trim()) fd.append('note', note.trim());
    const iv = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 300);
    try {
      const res  = await fetch('/api/cattle/import-rfid', { method: 'POST', body: fd });
      const data = await res.json();
      clearInterval(iv); setProgress(100);
      if (res.ok) { setStatus('success'); setResult(data); onSuccess?.(); }
      else        { setStatus('error');   setErrorMsg(data.message); }
    } catch { clearInterval(iv); setStatus('error'); setErrorMsg('Gagal terhubung.'); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><FileSpreadsheet size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Import RFID</h3>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest">Upload .xlsx / .csv</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          {status === 'success' && result && (
            <div className="bg-green-50 border border-green-200 rounded-[20px] p-5 text-center space-y-3">
              <CheckCircle2 size={36} className="text-green-500 mx-auto" />
              <p className="font-black text-green-800 uppercase italic text-sm">{result.message}</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ l:'Total',v:result.total},{l:'Baru',v:result.created},{l:'Update',v:result.updated}].map((s,i)=>(
                  <div key={i} className="bg-white rounded-xl p-3 border border-green-100">
                    <p className="text-[8px] font-black text-green-500 uppercase">{s.l}</p>
                    <p className="text-xl font-black text-green-800">{s.v}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleClose} className="w-full py-3 bg-[#8da070] text-white rounded-xl font-black text-xs uppercase">Tutup</button>
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-[20px] p-5 space-y-3">
              <div className="flex items-center gap-3"><AlertTriangle size={20} className="text-red-500 shrink-0" /><p className="text-sm font-black text-red-700 uppercase italic">Import Gagal</p></div>
              <p className="text-[11px] text-red-600">{errorMsg}</p>
              <button onClick={reset} className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">Coba Lagi</button>
            </div>
          )}
          {(status === 'idle' || status === 'uploading') && (
            <>
              <div onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();setFile(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all ${file?'border-[#8da070] bg-[#8da070]/5':'border-slate-200 hover:border-[#8da070]/50'}`}>
                <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={(e)=>setFile(e.target.files[0]||null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet size={20} className="text-[#8da070]" />
                    <div className="text-left"><p className="text-xs font-black text-slate-800 truncate max-w-[200px]">{file.name}</p><p className="text-[9px] text-slate-400">{(file.size/1024).toFixed(1)} KB</p></div>
                    <button onClick={(e)=>{e.stopPropagation();setFile(null);}} className="ml-auto p-1 text-red-400"><X size={14}/></button>
                  </div>
                ) : (
                  <div className="space-y-2"><Upload size={28} className="mx-auto text-slate-300"/><p className="text-xs font-black text-slate-400 uppercase italic">Drop file atau klik</p><p className="text-[8px] text-slate-300">Kolom: RFID/EID + Weight/Berat</p></div>
                )}
              </div>
              <div className="relative">
                <select value={warehouseId} onChange={(e)=>setWarehouseId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                  <option value="">-- Pilih Kandang Tujuan --</option>
                  {warehouses.map((w)=><option key={w.id} value={w.id}>{w.name}{w.code?` (${w.code})`:''}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>
              <input type="text" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Catatan batch (opsional)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
              {status==='uploading' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-[9px] font-black text-[#8da070] uppercase animate-pulse">Memproses...</span><span className="text-[9px] text-slate-400">{progress}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#8da070] rounded-full transition-all duration-300" style={{width:`${progress}%`}}/></div>
                </div>
              )}
              <button onClick={handleSubmit} disabled={!file||!warehouseId||status==='uploading'}
                className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  !file||!warehouseId||status==='uploading'?'bg-slate-100 text-slate-300 cursor-not-allowed':'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'}`}>
                {status==='uploading'?<><Loader2 size={14} className="animate-spin"/>Memproses...</>:<><Upload size={14}/>Proses Import</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
const KandangPage = () => {
  const { data: session } = useSession();
  const [warehouses,   setWarehouses]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [globalStats,  setGlobalStats]  = useState({ active: 0, total: 0, weight: 0, kandang: 0, healthIssues: 0 });

  const isAuthorized = ['SuperAdmin','Admin','Supervisor','Staff'].includes(session?.user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/warehouse?includeCattle=true&isKandang=true');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWarehouses(data);
      const active = data.flatMap((w) => w.cattle ?? []);
      setGlobalStats({
        active      : active.length,
        total       : data.reduce((s, w) => s + (w._count?.cattle ?? 0), 0),
        weight      : active.reduce((s, c) => s + resolveWeight(c), 0),
        kandang     : data.length,
        healthIssues: active.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length,
      });
    } catch { console.error('KANDANG_FETCH'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Manajemen Kandang
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            Cattle Tracking · RFID Import · HPP · Real-time Monitor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#8da070] transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAuthorized && (
            <button onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-3 px-6 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-[#8da070]/20 italic group cursor-pointer hover:bg-[#7a8c61]">
              <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" /> Import RFID
            </button>
          )}
        </div>
      </div>

      {/* Stats — 5 kartu */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l:'Total Kandang', v: globalStats.kandang,                                                    icon:<Warehouse size={18}/>,  color:'text-[#8da070]', bg:'bg-[#8da070]/10' },
          { l:'Sapi Aktif',    v: globalStats.active,   sub: globalStats.total>globalStats.active?`${globalStats.total} total`:null, icon:<Beef size={18}/>,     color:'text-blue-600',  bg:'bg-blue-50'      },
          { l:'Berat Aktif',   v: fmtKg(globalStats.weight),                                              icon:<Scale size={18}/>,     color:'text-amber-600', bg:'bg-amber-50'     },
          { l:'Avg / Ekor',    v: globalStats.active ? fmtKg(globalStats.weight/globalStats.active):'-',  icon:<TrendingUp size={18}/>, color:'text-purple-600',bg:'bg-purple-50'    },
          { l:'Isu Kesehatan', v: globalStats.healthIssues, sub: globalStats.healthIssues>0?'perlu atensi':null,icon:<Heart size={18}/>,color:globalStats.healthIssues>0?'text-red-600':'text-slate-400',bg:globalStats.healthIssues>0?'bg-red-50':'bg-slate-50'},
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className={`${s.bg} ${s.color} p-3 rounded-xl shrink-0`}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate">{s.l}</p>
              <p className="text-lg md:text-xl font-black text-gray-900 mt-0.5 leading-none">
                {loading ? <span className="inline-block h-5 w-12 bg-slate-100 animate-pulse rounded" /> : s.v}
              </p>
              {s.sub && !loading && <p className="text-[8px] text-gray-300 font-bold mt-0.5">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading && warehouses.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center bg-white rounded-[32px] border border-gray-100">
          <Loader2 className="animate-spin text-[#8da070] mb-4" size={44} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Memuat kandang...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#8da070]/10 text-[#8da070] rounded-full flex items-center justify-center mb-6"><Warehouse size={36}/></div>
          <h3 className="text-lg text-gray-900 font-black uppercase italic">Belum Ada Kandang</h3>
          <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest max-w-xs">Tambahkan Warehouse dengan nama/kode "KANDANG" atau "KD".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {warehouses.map((w) => (
            <KandangCard key={w.id} warehouse={w} onOpen={(wh)=>{ setSelected(wh); setIsDetailOpen(true); }} />
          ))}
        </div>
      )}

      <ImportModal isOpen={isImportOpen} onClose={()=>setIsImportOpen(false)} warehouses={warehouses} onSuccess={()=>{ setIsImportOpen(false); fetchData(); }} />
      <CattleDetailModal warehouse={selected} isOpen={isDetailOpen} onClose={()=>{ setIsDetailOpen(false); setSelected(null); }} warehouses={warehouses} />
    </div>
  );
};

export default KandangPage;
