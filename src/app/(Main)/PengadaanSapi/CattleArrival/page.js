'use client';

import React, { useState, useEffect } from 'react';
import {
  History, Beef, Clock, CheckCircle2, Loader2,
  RefreshCw, TrendingDown, Scale
} from 'lucide-react';
import CattleArrivalMonitor from '@/app/(Main)/PengadaanSapi/CattleArrival/ArrivalMonitor';
import CattleArrivalHistory from '@/app/(Main)/PengadaanSapi/CattleArrival/ArrivalHistory';

const fmtRp = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;

const CattleArrivalPage = () => {
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);
  const [pendingPOs,     setPendingPOs]     = useState([]);
  const [totalReceived,  setTotalReceived]  = useState(0);
  const [totalHead,      setTotalHead]      = useState(0);
  const [loading,        setLoading]        = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPending, resAll] = await Promise.all([
        fetch('/api/cattle/purchasing?status=APPROVED'),
        fetch('/api/cattle/purchasing'),
      ]);
      if (resPending.ok) {
        const pend = await resPending.json();
        // Tampilkan hanya yang belum diterima
        setPendingPOs(pend.filter(p => !p.isReceived));
      }
      if (resAll.ok) {
        const all = await resAll.json();
        setTotalReceived(all.filter(p => p.isReceived).length);
        setTotalHead(all.filter(p => p.isReceived).reduce((s, p) => s + (p.headCount || 0), 0));
      }
    } catch (err) {
      console.error('CATTLE_ARRIVAL_FETCH:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = [
    { label: 'Antrean PO',        value: pendingPOs.length,  icon: <Clock size={20} />,  color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total PO Diterima', value: totalReceived,       icon: <Beef size={20} />,   color: 'text-[#8da070]', bg: 'bg-[#8da070]/10' },
    { label: 'Total Ekor Masuk',  value: totalHead,           icon: <Scale size={20} />,  color: 'text-blue-600',  bg: 'bg-blue-50' },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Kedatangan Sapi
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            Livestock Arrival · RFID Import · Timbang Truk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#8da070] transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl italic group cursor-pointer">
            <History size={16} className="text-[#8da070] group-hover:rotate-[-45deg] transition-transform" />
            Arrival Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl shrink-0`}>{stat.icon}</div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-none">{stat.label}</p>
              <p className="text-xl font-black text-gray-900 mt-1 leading-none">
                {loading ? <span className="inline-block h-5 w-8 bg-slate-100 animate-pulse rounded" /> : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Monitor or empty state */}
      {loading && pendingPOs.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-[#8da070] mb-4" size={44} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Sinkronisasi Data...</p>
        </div>
      ) : pendingPOs.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-xl text-gray-900 font-black uppercase italic tracking-tight">Semua PO Selesai!</h3>
          <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest max-w-xs">
            Tidak ada PO sapi yang menunggu penerimaan.
          </p>
        </div>
      ) : (
        <CattleArrivalMonitor arrivals={pendingPOs} onRefresh={fetchData} />
      )}

      <CattleArrivalHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
};

export default CattleArrivalPage;
