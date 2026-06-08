// /app/(Main)/PengadaanSapi/Kandang/page.js — v6 (Medikasi + Vaksin + Obat)
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
  Link, FileCheck, Pill, // Pill ditambahkan untuk ikon obat
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import withPermission from '@/lib/withPermission';

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
  ARRIVAL     : { label: 'Arrival',       bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  IN_KANDANG  : { label: 'In Kandang',    bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-400'  },
  GRADING     : { label: 'Grading',       bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
  SOLD        : { label: 'Sold',          bg: 'bg-slate-50',   text: 'text-slate-500',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
  KARANTINA   : { label: 'Karantina',     bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
  PENDING_SALE: { label: 'Pending Sale',  bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
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
// DATA MEDIKASI (Vaksin + Obat)
// ═══════════════════════════════════════════════════════════════
const MEDICATION_PRODUCTS = [
  // ── Vaksin ──
  { name: 'Vaksin LSD',               type: 'VAKSIN', defaultUnit: 'dosis' },
  { name: 'Vaksin PMK',               type: 'VAKSIN', defaultUnit: 'dosis' },
  { name: 'Vaksin SE',                type: 'VAKSIN', defaultUnit: 'dosis' },
  // ── Obat & Suplemen ──
  { name: 'Adepros',                  type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Banixin',                  type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Bio Energi',               type: 'OBAT',   defaultUnit: 'sachet' },
  { name: 'Biodin',                   type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Canimag 500ml',            type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Catosal',                  type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Dexapros Inject',          type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Enroflox LA',              type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Hematodin',                type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Hemostop K',               type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Imidox',                   type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Implant Synovex Plus',     type: 'OBAT',   defaultUnit: 'implant' },
  { name: 'Intermectin',              type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Intracin',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Introvit B',               type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Introvit Plus',            type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Limoxin LA',               type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Limoxin Spray',            type: 'OBAT',   defaultUnit: 'semprot' },
  { name: 'Lutalyse',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Luteosyl',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Macrolan',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Nacl 500ml',               type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Neo Kotrimok',             type: 'OBAT',   defaultUnit: 'tablet' },
  { name: 'Paragin',                  type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Procaben',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Prodyl',                   type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Proxyvet LA',              type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Straw Semen Angus',        type: 'OBAT',   defaultUnit: 'straw' },
  { name: 'Straw Semen Belgian Blue', type: 'OBAT',   defaultUnit: 'straw' },
  { name: 'Straw Semen Brahman',      type: 'OBAT',   defaultUnit: 'straw' },
  { name: 'Straw Semen Brangus',      type: 'OBAT',   defaultUnit: 'straw' },
  { name: 'Straw Semen Simental',     type: 'OBAT',   defaultUnit: 'straw' },
  { name: 'Sulprodon',                type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'TM VITA',                  type: 'OBAT',   defaultUnit: 'sachet' },
  { name: 'Tolfen',                   type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Tylocare',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Tympanol',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Vigantol',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Vitol-140',                type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'V-Tropin',                 type: 'OBAT',   defaultUnit: 'ml' },
  { name: 'Wormectin Plus',           type: 'OBAT',   defaultUnit: 'ml' },
];

const VACCINE_LIST  = MEDICATION_PRODUCTS.filter((p) => p.type === 'VAKSIN');
const MEDICINE_LIST = MEDICATION_PRODUCTS.filter((p) => p.type === 'OBAT');

const UNITS = ['ml', 'cc', 'dosis', 'tablet', 'sachet', 'implant', 'straw', 'semprot', 'kapsul', 'mg'];

const getDefaultUnit = (name) =>
  MEDICATION_PRODUCTS.find((p) => p.name === name)?.defaultUnit ?? 'ml';

const getProductType = (name) =>
  MEDICATION_PRODUCTS.find((p) => p.name === name)?.type ?? 'OBAT';

const emptyForm = () => ({
  medicationType: 'VAKSIN',
  productName   : 'Vaksin LSD',
  givenDate     : '',
  doseNumber    : '1',
  nextDueDate   : '',
  quantity      : '1',
  unit          : 'dosis',
  indication    : '',
  administeredBy: '',
  batchNo       : '',
  note          : '',
});

// ─── Sub‑komponen: kartu riwayat satu record ─────────────────────────────────
const MedicationCard = ({ rec, today }) => {
  const isVaccine = rec.medicationType === 'VAKSIN';
  const isDue     = isVaccine && rec.nextDueDate && new Date(rec.nextDueDate) < today;

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isVaccine ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
            {isVaccine ? <Syringe size={11} /> : <Pill size={11} />}
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-800 uppercase">{rec.productName}</p>
            <p className="text-[8px] text-slate-400">
              {isVaccine
                ? `Dosis ${rec.doseNumber} · ${fmtDate(rec.givenDate)}`
                : `${rec.quantity} ${rec.unit} · ${fmtDate(rec.givenDate)}`}
            </p>
            {rec.indication && (
              <p className="text-[8px] text-slate-300 mt-0.5 italic">{rec.indication}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border ${
            isVaccine
              ? 'bg-teal-50 text-teal-600 border-teal-200'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}>
            {isVaccine ? 'VAKSIN' : 'OBAT'}
          </span>
          {isVaccine && rec.nextDueDate && (
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border ${
              isDue
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {isDue ? '⚠ ' : ''}Next: {fmtDate(rec.nextDueDate)}
            </span>
          )}
        </div>
      </div>

      {(rec.administeredBy || rec.batchNo) && (
        <p className="text-[8px] text-slate-300 mt-1">
          Oleh: {rec.administeredBy}
          {rec.batchNo ? ` · Batch: ${rec.batchNo}` : ''}
        </p>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// TAB: MEDIKASI (Vaksin + Obat-obatan)
// ══════════════════════════════════════════
const TabMedikasi = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm]         = useState(emptyForm());
  const [activeTab, setActiveTab] = useState('SEMUA'); // 'SEMUA' | 'VAKSIN' | 'OBAT'

  const today = new Date();

  // data.medications = gabungan dari GET /api/cattle/[id]/medication
  const allRecords = data.medications ?? [];
  const vaccines   = allRecords.filter((r) => r.medicationType === 'VAKSIN');
  const medicines  = allRecords.filter((r) => r.medicationType === 'OBAT');
  const displayed  = activeTab === 'VAKSIN' ? vaccines
                   : activeTab === 'OBAT'   ? medicines
                   : allRecords;

  const overdue = vaccines.filter((v) => v.nextDueDate && new Date(v.nextDueDate) < today);

  // Saat nama produk berubah, auto-set unit dan medicationType
  const handleProductChange = (name) => {
    setForm((f) => ({
      ...f,
      productName   : name,
      medicationType: getProductType(name),
      unit          : getDefaultUnit(name),
    }));
  };

  // Saat medicationType berubah, reset ke produk pertama dari tipe itu
  const handleTypeChange = (type) => {
    const first = type === 'VAKSIN' ? VACCINE_LIST[0] : MEDICINE_LIST[0];
    setForm((f) => ({
      ...f,
      medicationType: type,
      productName   : first.name,
      unit          : first.defaultUnit,
    }));
  };

  const productOptions = form.medicationType === 'VAKSIN' ? VACCINE_LIST : MEDICINE_LIST;
  const isVaccineForm  = form.medicationType === 'VAKSIN';

  return (
    <div className="space-y-5">
      {/* ── Alert vaksin terlambat ── */}
      {overdue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[18px] p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase">Vaksin Terlambat</p>
            <p className="text-[9px] text-amber-700 mt-0.5">
              {overdue.map((v) => `${v.productName} (jatuh ${fmtDate(v.nextDueDate)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-[18px] p-4 border ${data.vaccinated ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Vaksin</p>
          <p className={`text-xs font-black uppercase italic ${data.vaccinated ? 'text-teal-700' : 'text-slate-400'}`}>
            {data.vaccinated ? '✓ Sudah' : 'Belum'}
          </p>
          {data.lastVaccineDate && (
            <p className="text-[8px] text-teal-600 mt-0.5">{fmtDate(data.lastVaccineDate)}</p>
          )}
        </div>
        <div className="bg-slate-50 rounded-[18px] p-4 border border-slate-100">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Vaksin</p>
          <p className="text-2xl font-black text-teal-700">{vaccines.length}</p>
          <p className="text-[8px] text-slate-400">record</p>
        </div>
        <div className="bg-slate-50 rounded-[18px] p-4 border border-slate-100">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Obat</p>
          <p className="text-2xl font-black text-blue-700">{medicines.length}</p>
          <p className="text-[8px] text-slate-400">record</p>
        </div>
      </div>

      {/* ── Filter tabs riwayat ── */}
      {allRecords.length > 0 && (
        <div>
          <div className="flex gap-1 mb-3">
            {['SEMUA', 'VAKSIN', 'OBAT'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${
                  activeTab === t
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {t} {t === 'SEMUA' ? `(${allRecords.length})` : t === 'VAKSIN' ? `(${vaccines.length})` : `(${medicines.length})`}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {displayed.map((rec) => (
              <MedicationCard key={rec.id} rec={rec} today={today} />
            ))}
          </div>
        </div>
      )}

      {/* ── Form input ── */}
      {isAuthorized && (
        <div className="bg-white rounded-[18px] p-4 border border-slate-100 space-y-3">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Catat Pemberian</p>

          {/* Pilih tipe */}
          <div className="flex gap-2">
            {['VAKSIN', 'OBAT'].map((t) => (
              <button key={t} onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl border transition-all ${
                  form.medicationType === t
                    ? t === 'VAKSIN'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {t === 'VAKSIN' ? '💉 Vaksin' : '💊 Obat'}
              </button>
            ))}
          </div>

          {/* Nama produk */}
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">
              {isVaccineForm ? 'Jenis Vaksin *' : 'Nama Obat *'}
            </label>
            <select value={form.productName} onChange={(e) => handleProductChange(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
              {productOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Tanggal + kondisional (dosis untuk vaksin, qty+unit untuk obat) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Tanggal Pemberian *</label>
              <input type="date" value={form.givenDate} onChange={(e) => setForm((f) => ({ ...f, givenDate: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
            {isVaccineForm ? (
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Dosis ke-</label>
                <input type="number" min="1" value={form.doseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, doseNumber: e.target.value }))}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
              </div>
            ) : (
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Jumlah</label>
                <div className="flex gap-1">
                  <input type="number" min="0.1" step="0.1" value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
                  <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Jadwal vaksin berikutnya (hanya untuk vaksin) */}
          {isVaccineForm && (
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Vaksin Berikutnya</label>
              <input type="date" value={form.nextDueDate} onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30" />
            </div>
          )}

          {/* Indikasi (hanya untuk obat) */}
          {!isVaccineForm && (
            <div>
              <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Indikasi / Alasan</label>
              <input type="text" value={form.indication}
                onChange={(e) => setForm((f) => ({ ...f, indication: e.target.value }))}
                placeholder="mis: demam, cacingan, infeksi..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            </div>
          )}

          {/* Petugas + No. batch */}
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={form.administeredBy}
              onChange={(e) => setForm((f) => ({ ...f, administeredBy: e.target.value }))}
              placeholder="Petugas / dokter hewan"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
            <input type="text" value={form.batchNo}
              onChange={(e) => setForm((f) => ({ ...f, batchNo: e.target.value }))}
              placeholder="No. batch produk"
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />
          </div>

          <button
            onClick={() => onPost(`/api/cattle/${data.id}/medication`, form)}
            disabled={saving || !form.productName || !form.givenDate}
            className={`w-full py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
              isVaccineForm ? 'bg-teal-700 hover:bg-teal-600' : 'bg-blue-700 hover:bg-blue-600'
            }`}>
            {saving
              ? <Loader2 size={13} className="animate-spin" />
              : isVaccineForm
                ? <Syringe size={13} />
                : <Pill size={13} />}
            {isVaccineForm ? 'Simpan Vaksin' : 'Simpan Obat'}
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CattleProfileModal — per‑sapi full detail dengan tab (medikasi + PO)
// ═══════════════════════════════════════════════════════════════
const CattleProfileModal = ({ cattleId, isOpen, onClose, warehouses }) => {
  const { data: session }   = useSession();
  const [data,    setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]   = useState('bobot');
  const [saving,  setSaving] = useState(false);
  const [msg,     setMsg]   = useState(null);

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
    { key: 'medikasi',  label: 'Medikasi',   icon: <Syringe size={13} />       }, // Diganti dari 'Vaksin' jadi 'Medikasi'
    { key: 'hpp',       label: 'HPP',         icon: <DollarSign size={13} />    },
    { key: 'transfer',  label: 'Transfer',    icon: <ArrowLeftRight size={13} />},
  ];

  return (
    <div className="fixed inset-0 z-[350] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
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
                {data?.purchasing && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[8px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded border border-[#8da070]/20">
                      PO: {data.purchasing.noPO} - {data.purchasing.vendorName}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all shrink-0">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

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

          {msg && (
            <div className={`mt-3 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 ${
              msg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {msg.type === 'ok' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {msg.text}
            </div>
          )}

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
              {tab === 'medikasi'  && <TabMedikasi  data={data} onPost={post} saving={saving} isAuthorized={isAuthorized} />}
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
      <div className={`rounded-[18px] p-5 border ${hCfg.bg} ${hCfg.border}`}>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Status Kesehatan Saat Ini</p>
        <p className={`text-2xl font-black uppercase italic tracking-tight ${hCfg.text}`}>{hCfg.label}</p>
        <p className="text-[9px] opacity-60 mt-1">Diperbarui: {fmtDateTime(data.updatedAt)}</p>
      </div>

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
// TAB: HPP — komponen biaya + kalkulasi
// ══════════════════════════════════════════
const TabHPP = ({ data, onPost, saving, isAuthorized }) => {
  const [form, setForm] = useState({ category: 'PAKAN', description: '', amount: '', isPerHead: true, headCount: '', note: '' });

  const components = data.hppComponents ?? [];
  const perHead = (c) => c.isPerHead ? c.amount : (c.headCount ? c.amount / c.headCount : c.amount);

  const grouped = {};
  for (const c of components) {
    if (!grouped[c.category]) grouped[c.category] = { total: 0, items: [] };
    grouped[c.category].total += perHead(c);
    grouped[c.category].items.push({ ...c, amountPerHead: perHead(c) });
  }

  const totalComponents = components.reduce((s, c) => s + perHead(c), 0);
  const baseHargaBeli = data.hargaBeliTotal ?? 0;
  const grandTotal = baseHargaBeli + totalComponents;
  const hppPerKg = data.weightTerima ? grandTotal / data.weightTerima : null;
  const susutCostAdj = data.weightBeli && data.weightTerima && data.hargaBeliPerKg
    ? (data.weightBeli - data.weightTerima) * data.hargaBeliPerKg
    : null;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-[18px] p-5 border border-slate-100 space-y-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ringkasan HPP</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
            <span className="text-[11px] text-slate-600 font-bold">Harga Beli Base</span>
            <span className="font-black text-slate-800 text-[11px]">{data.hargaBeliTotal ? fmtRp(data.hargaBeliTotal) : '-'}</span>
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
      <div className="bg-[#8da070]/10 rounded-[18px] p-4 border border-[#8da070]/20 flex items-center gap-3">
        <div className="p-2.5 bg-[#8da070] text-white rounded-xl"><Warehouse size={16} /></div>
        <div>
          <p className="text-[8px] font-black text-[#8da070] uppercase tracking-widest">Lokasi Sekarang</p>
          <p className="font-black text-slate-800 text-sm uppercase italic">{data.warehouse?.name ?? '-'}</p>
          {data.warehouse?.code && <p className="text-[8px] text-slate-400">{data.warehouse.code}</p>}
        </div>
      </div>

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
// CattleDetailModal — daftar sapi dalam satu kandang (ditambah badge PO)
// ═══════════════════════════════════════════════════════════════
const CattleDetailModal = ({ warehouse, isOpen, onClose, warehouses }) => {
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
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

  const activeWeight = filtered.reduce((s, c) => s + resolveWeight(c), 0);
  const totalAllStatus = warehouse._count?.cattle ?? cattle.length;
  const vaccinated = cattle.filter((c) => c.vaccinated).length;
  const healthIssues = cattle.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length;

  return (
    <>
      <div className="fixed inset-0 z-[250] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-400 flex flex-col">
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
                  <option value="PENDING_SALE">Pending Sale</option>
                  <option value="ARRIVAL">Arrival</option>
                  <option value="GRADING">Grading</option>
                  <option value="KARANTINA">Karantina</option>
                  <option value="SOLD">Sold</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

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
                  const displayDate = resolveDate(c);
                  const hasIssue = c.healthStatus && c.healthStatus !== 'SEHAT';
                  const poInfo = c.purchasing;

                  return (
                    <div key={c.id} onClick={() => setProfileId(c.id)}
                      className="bg-white rounded-[18px] p-4 border border-slate-100 flex items-center gap-3 hover:border-[#8da070]/30 hover:shadow-md transition-all group cursor-pointer active:scale-[0.99]">
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
                          {poInfo && (
                            <span className="text-[8px] font-black text-[#8da070] bg-[#8da070]/10 px-1.5 py-0.5 rounded border border-[#8da070]/20">
                              PO: {poInfo.noPO}
                            </span>
                          )}
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
      <CattleProfileModal cattleId={profileId} isOpen={!!profileId} onClose={() => setProfileId(null)} warehouses={warehouses} />
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// KandangCard
// ═══════════════════════════════════════════════════════════════
const KandangCard = ({ warehouse, onOpen }) => {
  const activeCattle = warehouse.cattle ?? [];
  const headCount = activeCattle.length;
  const totalCount = warehouse._count?.cattle ?? headCount;
  const soldCount = Math.max(0, totalCount - headCount);
  const totalWeight = activeCattle.reduce((s, c) => s + resolveWeight(c), 0);
  const avgWeight = headCount > 0 ? totalWeight / headCount : 0;
  const vaccinated = activeCattle.filter((c) => c.vaccinated).length;
  const healthIssues = activeCattle.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length;

  const fillPct = warehouse.capacity ? Math.min(100, Math.round((headCount / warehouse.capacity) * 100)) : null;
  const capColor = fillPct > 90 ? 'bg-red-400' : fillPct > 70 ? 'bg-amber-400' : 'bg-[#8da070]';

  return (
    <div onClick={() => onOpen(warehouse)}
      className="bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm cursor-pointer hover:border-[#8da070]/40 hover:shadow-2xl hover:shadow-[#8da070]/10 active:scale-[0.97] transition-all group relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#8da070]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
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

// ═══════════════════════════════════════════════════════════════
// ImportModal — v9 (Dengan Eartag pintar)
// ═══════════════════════════════════════════════════════════════
const ImportModal = ({ isOpen, onClose, warehouses, onSuccess }) => {
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [note, setNote] = useState('');
  
  const [purchasingId, setPurchasingId] = useState('');
  const [poList, setPoList] = useState([]);
  const [loadingPO, setLoadingPO] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [forceOverride, setForceOverride] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const [sessionId, setSessionId] = useState('');
  const [rfidList, setRfidList] = useState([]);
  const [weights, setWeights] = useState({});
  const [fillAll, setFillAll] = useState('');
  const [fillAllBreed, setFillAllBreed] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [result, setResult] = useState(null);
  const [searchQ, setSearchQ] = useState('');

  // ⭐ State untuk eartag
  const [eartagPrefix, setEartagPrefix] = useState('');
  // ⭐ State untuk menyimpan nomor terakhir setiap prefix dari database
  const [lastEartagNumbers, setLastEartagNumbers] = useState({});

  const [breedsMaster, setBreedsMaster] = useState([]);
  const [breedsLoading, setBreedsLoading] = useState(false);

  // Fetch daftar PO dan breeds saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;
    setPurchasingId('');
    setQuotaInfo(null);
    setForceOverride(false);
    setBreedsLoading(true);
    
    Promise.all([
      fetch('/api/cattle/purchasing?status=APPROVED,PARTIALLY_RECEIVED,RECEIVED&includeFull=true')
        .then(r => r.json())
        .catch(() => []),
      fetch('/api/cattle/breeds')
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    ]).then(([poData, breedData]) => {
      setPoList(poData);
      setBreedsMaster(breedData);
      setBreedsLoading(false);
    });
  }, [isOpen]);

  // ⭐ Fetch existing eartags dari database untuk mendapatkan nomor terakhir per prefix
  const fetchExistingEartags = useCallback(async () => {
    if (!warehouseId) return;
    try {
      const res = await fetch(`/api/cattle/import-rfid?warehouseId=${warehouseId}&getAllEartags=true`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        const lastNumbers = {};
        data.forEach(cattle => {
          if (cattle.name && cattle.name.includes('-')) {
            const parts = cattle.name.split('-');
            const prefix = parts[0];
            const num = parseInt(parts[1]) || 0;
            if (!lastNumbers[prefix] || num > lastNumbers[prefix]) {
              lastNumbers[prefix] = num;
            }
          }
        });
        setLastEartagNumbers(lastNumbers);
      }
    } catch (err) {
      console.error('Gagal fetch eartag:', err);
    }
  }, [warehouseId]);

  // Panggil fetch eartag saat warehouse berubah dan step 2
  useEffect(() => {
    if (warehouseId && step === 2) {
      fetchExistingEartags();
    }
  }, [warehouseId, step, fetchExistingEartags]);

  const reset = () => {
    setStep(1); setFile(null); setWarehouseId(''); setNote('');
    setPurchasingId(''); setQuotaInfo(null); setForceOverride(false);
    setUploading(false); setUploadErr('');
    setSessionId(''); setRfidList([]); setWeights({});
    setFillAll(''); setFillAllBreed(''); setSaving(false); setSaveErr(''); setResult(null); setSearchQ('');
    setEartagPrefix('');
    setLastEartagNumbers({});
    if (fileRef.current) fileRef.current.value = '';
  };
  
  const handleClose = () => { reset(); onClose(); };

  const handlePreview = async () => {
    if (!file || !warehouseId) return;
    setUploading(true); setUploadErr('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('warehouseId', warehouseId);
    fd.append('isPreview', 'true');
    if (purchasingId) fd.append('purchasingId', purchasingId);

    try {
      const res = await fetch('/api/cattle/import-rfid', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadErr(data.message || 'Gagal memproses file.'); return; }
      
      const initWeights = {};
      for (const r of data.rfidList) {
        initWeights[r.rfidNo] = { 
          weight: '', 
          breed: '',
          notes: '', 
          eartagNo: r.eartagNo || '' 
        };
      }
      setRfidList(data.rfidList);
      setWeights(initWeights);
      setSessionId(data.sessionId);
      setQuotaInfo(data.quotaCheck);
      setForceOverride(false);
      setStep(2);
    } catch { setUploadErr('Gagal terhubung ke server.'); }
    finally { setUploading(false); }
  };

  const setWeightField = (rfidNo, field, value) =>
    setWeights((prev) => ({ ...prev, [rfidNo]: { ...prev[rfidNo], [field]: value } }));

  const applyFillAllBreed = () => {
    if (!fillAllBreed) return;
    setWeights((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = { ...next[k], breed: fillAllBreed };
      }
      return next;
    });
  };

  const applyFillAllWeight = () => {
    if (!fillAll) return;
    const v = parseFloat(fillAll);
    if (isNaN(v) || v <= 0 || v > 1500) return;
    setWeights((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = { ...next[k], weight: fillAll };
      }
      return next;
    });
  };

  // Auto fill eartag untuk baris yang kosong (lanjut dari nomor terbesar di session)
  const autoFillEartag = () => {
    if (!eartagPrefix || eartagPrefix.trim() === '') {
      setSaveErr('Isi prefix Eartag terlebih dahulu.');
      return;
    }
    
    const prefix = eartagPrefix.trim();
    // Cari nomor terbesar yang sudah ada di session untuk prefix ini
    let maxNumber = 0;
    Object.values(weights).forEach(w => {
      if (w.eartagNo && w.eartagNo.startsWith(`${prefix}-`)) {
        const parts = w.eartagNo.split('-');
        const num = parseInt(parts[1]) || 0;
        if (num > maxNumber) maxNumber = num;
      }
    });
    
    let nextNumber = maxNumber + 1;
    
    // Gunakan rfidList untuk urutan (hanya isi yang kosong)
    setWeights((prev) => {
      const newWeights = { ...prev };
      rfidList.forEach((rfid) => {
        const current = newWeights[rfid.rfidNo];
        if (current && (!current.eartagNo || current.eartagNo.trim() === '')) {
          newWeights[rfid.rfidNo] = {
            ...current,
            eartagNo: `${prefix}-${nextNumber}`,
          };
          nextNumber++;
        }
      });
      return newWeights;
    });
  };

  // Reset semua eartag (paksa mulai dari 1)
  const resetAllEartag = () => {
    if (!eartagPrefix || eartagPrefix.trim() === '') {
      setSaveErr('Isi prefix Eartag terlebih dahulu.');
      return;
    }
    const prefix = eartagPrefix.trim();
    
    // Gunakan rfidList sebagai sumber urutan (urutan sesuai file Excel)
    setWeights((prev) => {
      const newWeights = { ...prev };
      rfidList.forEach((rfid, index) => {
        if (newWeights[rfid.rfidNo]) {
          newWeights[rfid.rfidNo] = {
            ...newWeights[rfid.rfidNo],
            eartagNo: `${prefix}-${index + 1}`,
          };
        }
      });
      return newWeights;
    });
  };

  //Ketika prefix berubah: jika prefix sudah ada di database, lanjutkan nomor; jika baru, mulai dari 1
  const handlePrefixChange = (newPrefix) => {
    const trimmed = newPrefix.trim();
    setEartagPrefix(trimmed);
    
    if (trimmed === '') {
      setWeights((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          next[k] = { ...next[k], eartagNo: '' };
        }
        return next;
      });
      return;
    }
    
    // Cek apakah prefix sudah pernah ada di database
    const lastNumber = lastEartagNumbers[trimmed] || 0;
    let nextNumber = lastNumber + 1;
    
    // Gunakan rfidList sebagai sumber urutan (urutan sesuai file Excel)
    setWeights((prev) => {
      const newWeights = { ...prev };
      rfidList.forEach((rfid) => {
        if (newWeights[rfid.rfidNo]) {
          newWeights[rfid.rfidNo] = {
            ...newWeights[rfid.rfidNo],
            eartagNo: `${trimmed}-${nextNumber}`,
          };
          nextNumber++;
        }
      });
      return newWeights;
    });
  };

  const filledCount = Object.values(weights).filter((w) => w.weight && parseFloat(w.weight) > 0).length;
  const breedFilledCount = Object.values(weights).filter((w) => w.breed && w.breed.trim()).length;
  const totalCount = rfidList.length;
  const allWeightFilled = filledCount === totalCount && totalCount > 0;
  const allBreedFilled = breedFilledCount === totalCount && totalCount > 0;
  const isValidWeight = (v) => { const n = parseFloat(v); return !isNaN(n) && n > 0 && n <= 1500; };

  const handleSave = async () => {
    const invalidWeight = rfidList.filter((r) => !isValidWeight(weights[r.rfidNo]?.weight));
    if (invalidWeight.length) {
      setSaveErr(`${invalidWeight.length} RFID belum diisi berat yang valid (0.1–1500 kg).`);
      return;
    }
    
    const missingBreed = rfidList.filter((r) => !weights[r.rfidNo]?.breed?.trim());
    if (missingBreed.length) {
      setSaveErr(`${missingBreed.length} RFID belum dipilih jenis sapi.`);
      return;
    }
    
    if (quotaInfo?.isFull && !forceOverride) {
      setSaveErr('⚠️ PO sudah PENUH. Klik "Simpan Paksa" jika tetap ingin melanjutkan.');
      return;
    }
    
    setSaving(true); setSaveErr('');
    try {
      const payload = {
        sessionId,
        warehouseId,
        note: note.trim() || undefined,
        weights: rfidList.map((r) => ({
          rfidNo: r.rfidNo,
          weight: parseFloat(weights[r.rfidNo].weight),
          breed: weights[r.rfidNo].breed.trim().toUpperCase(),
          eartagNo: weights[r.rfidNo].eartagNo?.trim() || null,
          notes: weights[r.rfidNo].notes,
        })),
        forceOverride,
      };
      const res = await fetch('/api/cattle/import-rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setSaveErr(data.message || 'Gagal menyimpan.'); return; }
      setResult(data);
      onSuccess?.();
    } catch { setSaveErr('Gagal terhubung ke server.'); }
    finally { setSaving(false); }
  };

  const filteredList = rfidList.filter((r) => {
    if (!searchQ) return true;
    const liveEartag = weights[r.rfidNo]?.eartagNo || r.eartagNo || '';
    const liveBreed = weights[r.rfidNo]?.breed || '';
    return r.rfidNo.includes(searchQ) || 
          liveEartag.toLowerCase().includes(searchQ.toLowerCase()) ||
          liveBreed.toLowerCase().includes(searchQ.toLowerCase());
  });

  if (!isOpen) return null;

  if (result) return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><FileSpreadsheet size={18} /></div>
          <div><h3 className="text-sm font-black text-slate-900 uppercase italic">Import Selesai</h3></div>
          <button onClick={handleClose} className="ml-auto p-2 hover:bg-slate-100 rounded-xl"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-[20px] p-5 text-center space-y-3">
          <CheckCircle2 size={40} className="text-green-500 mx-auto" />
          <p className="font-black text-green-800 uppercase italic text-sm">{result.message}</p>
          {result.warning && <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg">{result.warning}</p>}
          <div className="grid grid-cols-3 gap-2">
            {[{l:'Total',v:result.total},{l:'Baru',v:result.created},{l:'Update',v:result.updated}].map((s,i)=>(
              <div key={i} className="bg-white rounded-xl p-3 border border-green-100">
                <p className="text-[8px] font-black text-green-500 uppercase">{s.l}</p>
                <p className="text-xl font-black text-green-800">{s.v}</p>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[9px] font-black text-amber-700 uppercase mb-1">Error ({result.errors.length}):</p>
              {result.errors.slice(0,5).map((e,i)=>(
                <p key={i} className="text-[9px] text-amber-600">{e.rfidNo}: {e.reason}</p>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleClose} className="w-full py-3.5 bg-[#8da070] text-white rounded-xl font-black text-xs uppercase tracking-widest">Tutup</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={step === 1 ? handleClose : undefined} />
      <div className={`relative w-full bg-white shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 flex flex-col
        ${step === 1 ? 'sm:max-w-lg rounded-t-[32px] sm:rounded-[32px]' : 'sm:max-w-4xl rounded-t-[32px] sm:rounded-[32px]'}
        max-h-[92vh]`}>

        <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="p-1.5 hover:bg-slate-100 rounded-xl mr-1">
              <ChevronLeft size={18} className="text-slate-400" />
            </button>
          )}
          <div className="p-2.5 bg-[#8da070] rounded-xl text-white"><FileSpreadsheet size={18} /></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">
              {step === 1 ? 'Import RFID' : 'Input Berat & Jenis Sapi'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black
                    ${step >= s ? 'bg-[#8da070] text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
                  {s < 2 && <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[#8da070]' : 'bg-slate-100'}`} />}
                </div>
              ))}
              <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                {step === 1 ? 'Upload File' : `${breedFilledCount}/${totalCount} breed · ${filledCount}/${totalCount} berat`}
              </span>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl shrink-0">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all
                ${file ? 'border-[#8da070] bg-[#8da070]/5' : 'border-slate-200 hover:border-[#8da070]/50'}`}>
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet size={20} className="text-[#8da070]" />
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-800 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[9px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-auto p-1 text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs font-black text-slate-400 uppercase italic">Drop file atau klik</p>
                  <p className="text-[8px] text-slate-300">Kolom wajib: RFID/EID</p>
                </div>
              )}
            </div>

            <div className="relative">
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih Kandang Tujuan --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={purchasingId} onChange={(e) => setPurchasingId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30">
                <option value="">-- Pilih PO Sapi (Opsional) --</option>
                {loadingPO && <option disabled>Memuat PO...</option>}
                {poList.map(po => (
                  <option key={po.id} value={po.id}>
                    {po.noPO} - {po.vendorName} 
                    {po.isFull 
                      ? ` [PENUH - ${po.headReceived}/${po.totalHead} ekor]` 
                      : ` (sisa ${po.sisaKuota} ekor)`}
                    {po.status === 'RECEIVED' && ' ✓ RECEIVED'}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Link size={12} />
              </div>
            </div>

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan batch (opsional)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8da070]/30 placeholder:text-slate-300" />

            {uploadErr && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-600">{uploadErr}</p>
              </div>
            )}

            <button onClick={handlePreview} disabled={!file || !warehouseId || uploading}
              className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${!file || !warehouseId || uploading
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'}`}>
              {uploading
                ? <><Loader2 size={14} className="animate-spin" />Memproses file...</>
                : <><ChevronRight size={14} />Lanjut — Input Berat & Jenis Sapi</>}
            </button>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex-1 min-w-[100px]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Terisi {breedFilledCount}/{totalCount}</span>
                  <span className="text-[9px] font-bold text-slate-400">{Math.round(breedFilledCount/totalCount*100)||0}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#8da070] rounded-full transition-all duration-300"
                    style={{ width: `${totalCount ? (breedFilledCount/totalCount*100) : 0}%` }} />
                </div>
              </div>
              
              {/* Bulk Breed */}
              <div className="flex items-center gap-1">
                <select 
                  value={fillAllBreed} 
                  onChange={(e) => setFillAllBreed(e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border text-slate-500 border-slate-200 rounded-lg text-[9px] font-medium text-slate-700 w-32 focus:outline-none focus:ring-1 focus:ring-[#8da070]/40">
                  <option value="">Set semua jenis...</option>
                  {breedsMaster.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                  <option value="LAINNYA">LAINNYA</option>
                </select>
                <button onClick={applyFillAllBreed}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase whitespace-nowrap hover:bg-[#8da070] transition-colors">
                  Set Semua
                </button>
              </div>
              
              {/* Bulk Weight */}
              <div className="flex items-center gap-1">
                <input type="number" value={fillAll} onChange={(e) => setFillAll(e.target.value)}
                  placeholder="kg semua"
                  className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#8da070]/40 placeholder:text-slate-500" />
                <button onClick={applyFillAllWeight}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase whitespace-nowrap hover:bg-[#8da070] transition-colors">
                  Isi Berat
                </button>
              </div>

              {/* ⭐ Bulk Eartag */}
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                <input
                  type="text"
                  value={eartagPrefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  placeholder="Prefix (1,27,KD)"
                  className="w-28 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#8da070]/40 placeholder:text-slate-400"
                />
                <button
                  onClick={autoFillEartag}
                  className="px-2.5 py-1.5 bg-[#8da070] text-white rounded-lg text-[9px] font-black uppercase whitespace-nowrap hover:bg-[#7a8c61] transition-colors"
                  title="Isi eartag otomatis untuk baris kosong">
                  Auto
                </button>
                <button
                  onClick={resetAllEartag}
                  className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase whitespace-nowrap hover:bg-slate-700 transition-colors"
                  title="Reset semua eartag mulai dari nomor 1">
                  Reset
                </button>
              </div>
              
              {/* Search */}
              <div className="relative ml-auto">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Cari RFID / Eartag / Breed..."
                  className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 w-48 focus:outline-none focus:ring-1 focus:ring-[#8da070]/40" />
              </div>
            </div>

            {/* Info kuota */}
            {quotaInfo && (
              <div className={`mx-5 mt-3 p-3 rounded-xl text-[10px] font-bold flex items-start gap-2 ${
                quotaInfo.isOver ? 'bg-red-50 text-red-700 border border-red-200' 
                : quotaInfo.isFull ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {quotaInfo.isOver ? <AlertTriangle size={14} /> 
                : quotaInfo.isFull ? <AlertTriangle size={14} />
                : <FileCheck size={14} />}
                <div>
                  <p>PO: {quotaInfo.poHead} ekor · Sudah diterima: {quotaInfo.received} ekor · Sisa kuota: {quotaInfo.sisaKuota} ekor</p>
                  <p>Scan: {quotaInfo.scanned} ekor · 
                    {quotaInfo.isOver 
                      ? ` ⚠ Melebihi ${Math.abs(quotaInfo.selisih)} ekor!`
                      : quotaInfo.isFull
                      ? ` ⚠ PO sudah PENUH (${quotaInfo.received}/${quotaInfo.poHead}), import akan menambah ekor melebihi kuota.`
                      : ` Sisa kuota setelah import: ${quotaInfo.selisih} ekor`}
                  </p>
                </div>
              </div>
            )}

            {/* Tabel */}
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase w-8">No</th>
                    <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase">RFID / EID</th>
                    <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase">Eartag</th>
                    <th className="px-3 py-2.5 text-[8px] font-black text-[#8da070] uppercase w-36">Jenis Sapi *</th>
                    <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase w-28">Berat (kg) *</th>
                    <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((r, idx) => {
                    const w = weights[r.rfidNo] || { weight: '', breed: '', notes: '', eartagNo: '' };
                    const weightOk = isValidWeight(w.weight);
                    const weightErr = w.weight && !weightOk;
                    const breedOk = w.breed && w.breed.trim().length > 0;
                    return (
                      <tr key={r.rfidNo} className={`border-t border-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-4 py-2 text-[9px] text-slate-300 font-bold">{r.rowIndex}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-black text-slate-700 font-mono">{r.rfidNo}</span>
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={w.eartagNo}
                            onChange={(e) => setWeightField(r.rfidNo, 'eartagNo', e.target.value)}
                            placeholder="Isi eartag..."
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 transition-colors placeholder:text-slate-400
                              ${w.eartagNo ? 'border-[#8da070]/40 bg-[#8da070]/5 focus:ring-[#8da070]/40' : 'border-slate-200 bg-white focus:ring-[#8da070]/40'}`} />
                        </td>
                        <td className="px-3 py-2">
                          <select 
                            value={w.breed}
                            onChange={(e) => setWeightField(r.rfidNo, 'breed', e.target.value)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-bold focus:outline-none focus:ring-1 transition-colors
                              ${breedOk 
                                ? 'border-green-200 bg-green-50/60 focus:ring-green-400' 
                                : 'border-slate-200 bg-white focus:ring-[#8da070]/40'}`}>
                            <option value="">-- Pilih Jenis Sapi --</option>
                            {breedsMaster.map(b => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                            <option value="CAMPURAN">CAMPURAN</option>
                            <option value="LAINNYA">LAINNYA</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <input type="number" min="0.1" max="1500" step="0.1"
                              value={w.weight} onChange={(e) => setWeightField(r.rfidNo, 'weight', e.target.value)}
                              placeholder="0.0"
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 transition-colors
                                ${weightErr ? 'border-red-300 bg-red-50 focus:ring-red-400'
                                  : weightOk ? 'border-green-200 bg-green-50/60 focus:ring-green-400'
                                  : 'border-slate-200 bg-white focus:ring-[#8da070]/40'}`} />
                            {weightOk && <Check size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={w.notes} onChange={(e) => setWeightField(r.rfidNo, 'notes', e.target.value)}
                            placeholder="opsional"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#8da070]/40 placeholder:text-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredList.length === 0 && (
                <div className="py-10 text-center text-[10px] text-slate-300 font-bold uppercase">Tidak ada hasil untuk "{searchQ}"</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">
              {saveErr && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-600">{saveErr}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => { setStep(1); setSaveErr(''); setForceOverride(false); }}
                  className="px-5 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">
                  Kembali
                </button>
                
                {quotaInfo?.isFull && !forceOverride && (
                  <button onClick={() => setForceOverride(true)}
                    className="px-5 py-3.5 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase hover:bg-amber-600 transition-all">
                    ⚠️ Simpan Paksa (Override)
                  </button>
                )}
                
                <button onClick={handleSave} 
                  disabled={saving || !allWeightFilled || !allBreedFilled || (quotaInfo?.isOver && !forceOverride)}
                  className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                    ${saving || !allWeightFilled || !allBreedFilled || (quotaInfo?.isOver && !forceOverride)
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-[#8da070] active:scale-[0.98] shadow-xl'}`}>
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
                    : <><CheckCircle2 size={14} />Simpan {totalCount} Ekor</>}
                </button>
              </div>
              {!allBreedFilled && (
                <p className="text-center text-[8px] text-red-400 font-bold uppercase">
                  {totalCount - breedFilledCount} ekor belum dipilih jenis sapi
                </p>
              )}
              {!allWeightFilled && allBreedFilled && (
                <p className="text-center text-[8px] text-slate-300 font-bold uppercase">
                  {totalCount - filledCount} ekor belum diisi berat
                </p>
              )}
              {quotaInfo?.isOver && !forceOverride && (
                <p className="text-center text-[8px] text-red-500 font-bold uppercase">
                  ⚠ Jumlah scan melebihi sisa kuota PO. Kurangi jumlah ekor atau pilih PO lain.
                </p>
              )}
              {quotaInfo?.isFull && forceOverride && (
                <p className="text-center text-[8px] text-amber-600 font-bold uppercase">
                  ⚠ Mode Override aktif. Data akan disimpan meskipun PO sudah penuh.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════
const KandangPage = () => {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState({ active: 0, total: 0, weight: 0, kandang: 0, healthIssues: 0, pendingSale: 0 });

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
        active: active.length,
        total: data.reduce((s, w) => s + (w._count?.cattle ?? 0), 0),
        weight: active.reduce((s, c) => s + resolveWeight(c), 0),
        kandang: data.length,
        healthIssues: active.filter((c) => c.healthStatus && c.healthStatus !== 'SEHAT').length,
        pendingSale: active.filter((c) => c.status === 'PENDING_SALE').length,
      });
    } catch { console.error('KANDANG_FETCH'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { l:'Total Kandang', v: globalStats.kandang, icon:<Warehouse size={18}/>, color:'text-[#8da070]', bg:'bg-[#8da070]/10' },
          { l:'Sapi Aktif', v: globalStats.active, sub: globalStats.total>globalStats.active?`${globalStats.total} total`:null, icon:<Beef size={18}/>, color:'text-blue-600', bg:'bg-blue-50' },
          { l:'Berat Aktif', v: fmtKg(globalStats.weight), icon:<Scale size={18}/>, color:'text-amber-600', bg:'bg-amber-50' },
          { l:'Avg / Ekor', v: globalStats.active ? fmtKg(globalStats.weight/globalStats.active):'-', icon:<TrendingUp size={18}/>, color:'text-purple-600', bg:'bg-purple-50' },
          { l:'Pending Sale', v: globalStats.pendingSale, sub: globalStats.pendingSale>0?'di-booking sales':null, icon:<ArrowRight size={18}/>, color: globalStats.pendingSale>0?'text-orange-600':'text-slate-400', bg: globalStats.pendingSale>0?'bg-orange-50':'bg-slate-50' },
          { l:'Isu Kesehatan', v: globalStats.healthIssues, sub: globalStats.healthIssues>0?'perlu atensi':null, icon:<Heart size={18}/>, color:globalStats.healthIssues>0?'text-red-600':'text-slate-400', bg:globalStats.healthIssues>0?'bg-red-50':'bg-slate-50'},
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

export default withPermission(KandangPage,'kandang');