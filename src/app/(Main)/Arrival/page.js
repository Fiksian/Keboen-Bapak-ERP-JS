'use client';

import React, { useState, useEffect } from 'react';
import { History, Package, Clock, CheckCircle2, Loader2, Truck, RefreshCw } from 'lucide-react';
import ArrivalMonitor from '@/app/(Main)/Arrival/ArrivalMonitor';
import ArrivalHistory from '@/app/(Main)/Arrival/ArrivalHistory';

const ItemArrival = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArrivalStats = async () => {
    try {
      const res = await fetch('/api/purchasing');
      if (res.ok) {
        const data = await res.json();
        const receivedCount = data.filter(item => item.isReceived).length;
        setTotalReceived(receivedCount);
      }
    } catch (error) {
      console.error("Gagal mengambil statistik kedatangan:", error);
    }
  };
  
  const fetchPendingArrivals = async () => {
    try {
      const res = await fetch('/api/stock/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingArrivals(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data antrean:", error);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchArrivalStats(), fetchPendingArrivals()]);
    setLoading(false);
  };

  useEffect(() => { 
    loadInitialData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchArrivalStats(), fetchPendingArrivals()]);
    setLoading(false);
  };

  const stats = [
    { 
      label: 'Antrean Kedatangan', 
      value: pendingArrivals.length, 
      icon: <Clock size={20} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Total Kedatangan',
      value: totalReceived, 
      icon: <Truck size={20} />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Selesai Diproses', 
      value: totalReceived, 
      icon: <Package size={20} />, 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    }
  ];
  
  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight leading-none">
            Kedatangan Barang
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
            Logistik & Inventory System
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 md:bg-white md:hover:bg-slate-50 text-white md:text-slate-700 rounded-2xl border border-transparent md:border-slate-200 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl md:shadow-sm group cursor-pointer italic"
          >
            <History size={16} className="text-indigo-400 md:text-indigo-600 group-hover:rotate-[-45deg] transition-transform" />
            Arrival Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left transition-transform hover:scale-[1.02]">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl shrink-0`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-none truncate">
                {stat.label}
              </p>
              <div className="text-xl font-black text-gray-900 leading-none mt-2 flex items-center">
                {loading ? (
                  <div className="h-5 w-8 bg-slate-100 animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {loading && pendingArrivals.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center bg-white rounded-[32px] border border-gray-100 shadow-sm">
            <div className="relative mb-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200" size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
              Sinkronisasi Data Gudang...
            </p>
          </div>
        ) : pendingArrivals.length === 0 ? (
          <div className="bg-white rounded-[32px] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl text-gray-900 font-black uppercase italic tracking-tight">Semua Beres!</h3>
            <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest leading-relaxed max-w-xs">
              Tidak ada antrean kedatangan barang saat ini. Semua kiriman telah diverifikasi ke gudang.
            </p>
          </div>
        ) : (
          <ArrivalMonitor 
            arrivals={pendingArrivals} 
            onRefresh={handleRefresh} 
          />
        )}
      </div>
    
      <ArrivalHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

    </div>
  );
};

export default ItemArrival;