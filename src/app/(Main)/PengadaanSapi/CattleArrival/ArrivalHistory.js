'use client';

import React, { useState, useEffect } from 'react';
import {
  X, History, ArrowDownLeft, Calendar, FileText,
  Hash, Loader2, UserCheck, Clock, Truck, Scale,
  Wifi, AlertTriangle, CheckCircle2, Beef
} from 'lucide-react';

const fmtKg   = (v) => `${(parseFloat(v) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
const fmtRp   = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const SusutBadge = ({ pct }) => {
  const isCrit = pct > 8.5;
  const isWarn = pct > 8.0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
      isCrit ? 'bg-red-50 text-red-600 border-red-200' :
      isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' :
               'bg-green-50 text-green-700 border-green-200'
    }`}>
      {isCrit || isWarn ? <AlertTriangle size={9} /> : <CheckCircle2 size={9} />}
      Susut {pct?.toFixed(1)}%{isCrit ? ' ⚠' : ''}
    </span>
  );
};

const CattleArrivalHistory = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/cattle/arrival')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        // Hanya tampilkan yang sudah selesai / sudah ada data timbang
        const done = data.filter(a => a.totalHeadArrived > 0)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(done);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full z-[250] flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">

        {/* Header */}
        <div className="p-5 md:p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Log Arrival Sapi</h2>
              <p className="text-[9px] text-[#8da070] font-bold uppercase tracking-widest mt-1">Inbound Livestock Tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Loader2 size={32} className="animate-spin mb-2 text-[#8da070]" />
              <p className="text-[10px] font-black uppercase tracking-widest">Memuat log...</p>
            </div>
          ) : history.length > 0 ? history.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4 hover:border-[#8da070]/30 transition-all">

              {/* Row 1: Item + badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0 flex-1">
                  <div className="p-3 bg-[#8da070]/10 text-[#8da070] rounded-2xl shrink-0">
                    <ArrowDownLeft size={20} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-800 uppercase text-sm truncate">
                      {log.purchasing?.vendorName || '-'} — {log.arrivalNo}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="flex items-center gap-1 text-[#8da070] font-black text-[9px] bg-[#8da070]/10 px-2 py-0.5 rounded uppercase italic">
                        <Hash size={9} /> {log.purchasing?.noPO || '-'}
                      </span>
                      {log.rfidImported && (
                        <span className="flex items-center gap-1 text-indigo-600 font-black text-[9px] bg-indigo-50 px-2 py-0.5 rounded uppercase">
                          <Wifi size={9} /> {log.rfidCount} RFID
                        </span>
                      )}
                      <SusutBadge pct={log.susutPct} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#8da070] text-white px-3 py-1.5 rounded-xl text-[10px] font-black italic shrink-0">
                  +{log.totalHeadArrived} Ekor
                </div>
              </div>

              {/* Timbang summary */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                {[
                  { l: 'Gross',    v: fmtKg(log.grossWeightTotal) },
                  { l: 'Tare',     v: fmtKg(log.tareWeightTotal)  },
                  { l: 'Net',      v: fmtKg(log.netWeightTotal)   },
                  { l: 'Avg/ekor', v: fmtKg(log.avgWeightReceived) },
                ].map((r, i) => (
                  <div key={i} className="text-left">
                    <p className="text-[7px] font-black text-orange-400 uppercase mb-0.5">{r.l}</p>
                    <p className="text-[10px] font-black text-slate-700">{r.v}</p>
                  </div>
                ))}
              </div>

              {/* Truk breakdown */}
              {log.trucks?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Truck size={9} /> {log.trucks.length} Truk
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {log.trucks.map((t, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-3 py-2 text-[9px]">
                        <p className="font-black text-gray-700 uppercase">{t.noTruk}</p>
                        <p className="text-gray-400">{t.headCount} ekor · Net: {fmtKg(t.netWeight)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Info Kedatangan</p>
                  <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Calendar size={10} className="text-blue-500" /> {fmtDate(log.createdAt)}
                  </p>
                  {log.namaKapal && (
                    <p className="text-[10px] font-bold text-gray-500">Kapal: {log.namaKapal}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-gray-400 uppercase">PIC</p>
                  <p className="text-[10px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                    <UserCheck size={10} className="text-[#8da070]" /> {log.receivedBy}
                  </p>
                  {log.namaPBM && <p className="text-[9px] text-gray-400">PBM: {log.namaPBM}</p>}
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-200">
              <Beef size={40} className="opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Belum ada data kedatangan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CattleArrivalHistory;
