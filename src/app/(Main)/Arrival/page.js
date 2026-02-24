'use client'

import React, { useState, useEffect } from 'react';
import { History, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import ArrivalMonitor from '@/app/(Main)/Arrival/ArrivalMonitor';
import StockHistory from '@/app/(Main)/Arrival/StockHistory';

const ItemArrival = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [allData, setAllData] = useState([]);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setAllData(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPendingArrivals = async () => {
    try {
      const res = await fetch('/api/stock/pending');
      if (res.ok) setPendingArrivals(await res.json());
    } catch (error) {
      console.error("Gagal mengambil data antrean:", error);
    }
  };

  useEffect(() => { 
    fetchAllStocks(); 
    fetchPendingArrivals();
  }, []);

  const stats = [
    { 
      label: 'Antrean Kedatangan', 
      value: pendingArrivals.length, 
      icon: <Clock size={20} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Total Jenis Stok', 
      value: allData.length, 
      icon: <Package size={20} />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    }
  ];
  
  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tight">Kedatangan Barang</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Logistik & Inventory Keboen Bapak</p>
        </div>

        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 md:bg-white md:hover:bg-slate-50 text-white md:text-slate-700 rounded-2xl border border-transparent md:border-slate-200 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl md:shadow-sm group cursor-pointer italic"
        >
          <History size={16} className="text-indigo-400 md:text-indigo-600 group-hover:rotate-[-45deg] transition-transform" />
          Arrival Logs
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-gray-900 leading-none mt-1">{loading ? '...' : stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {pendingArrivals.length === 0 && !loading ? (
          <div className="bg-white rounded-[32px] p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-gray-900 font-black uppercase italic tracking-tight">Tidak Ada Antrean</h3>
            <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Semua barang pesanan telah diterima.</p>
          </div>
        ) : (
          <ArrivalMonitor 
            arrivals={pendingArrivals} 
            onRefresh={() => { fetchAllStocks(); fetchPendingArrivals(); }} 
          />
        )}
      </div>
    
      <StockHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

    </div>
  )
}

export default ItemArrival;