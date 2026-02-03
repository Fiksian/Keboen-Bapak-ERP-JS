'use client'

import React, { useState, useEffect } from 'react';
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  Search, FileSpreadsheet, Loader2,
  User, Package, X, Calendar as CalendarIcon,
  ShoppingBag, RotateCcw, Trash2
} from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

const HistoryTransaksi = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.type === filter;
    
    const searchString = `${log.itemName} ${log.description} ${log.user} ${log.referenceId} ${log.rawAction}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const logDate = new Date(log.createdAt).setHours(0,0,0,0);
    const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
    const end = endDate ? new Date(endDate).setHours(0,0,0,0) : null;

    const matchesDate = (!start || logDate >= start) && (!end || logDate <= end);
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, startDate, endDate]);

  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'PENJUALAN': return <ShoppingBag size={12} className="text-orange-500" />;
      case 'PEMBATALAN': return <RotateCcw size={12} className="text-green-500" />;
      case 'PENGHAPUSAN': return <Trash2 size={12} className="text-red-500" />;
      default: return <Package size={12} className="text-blue-500" />;
    }
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500 text-gray-800">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
            <History className="text-blue-600" size={28} />
            System Audit Trail
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">
            Monitoring pergerakan stok, invoice penjualan, dan restock otomatis secara real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Export Audit Log
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
          
          <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
            {['ALL', 'INCOMING', 'OUTGOING'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all cursor-pointer ${
                  filter === type 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <div className="flex items-center px-3 gap-2">
              <CalendarIcon size={14} className="text-gray-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[14px] font-black uppercase outline-none text-gray-500 cursor-pointer"
              />
              <span className="text-gray-400 font-bold px-1 text-[12px]">TO</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[14px] font-black uppercase outline-none text-gray-500 cursor-pointer"
              />
              {(startDate || endDate) && (
                <button onClick={resetDateFilter} className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
                  <X size={12} className="text-gray-500" />
                </button>
              )}
            </div>
          </div>

          <div className="relative group flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari item, nomor invoice, atau user..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-100 outline-none transition-all w-full shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6 italic">Waktu & Tanggal</th>
                <th className="px-6 py-6 italic">Rincian Transaksi</th>
                <th className="px-6 py-6 italic text-center">Status</th>
                <th className="px-6 py-6 italic text-center">Otorisator</th>
                <th className="px-6 py-6 italic text-center">Perubahan</th>
                <th className="px-8 py-6 italic text-right">Referensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Audit Log...</span>
                  </td>
                </tr>
              ) : currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/10 transition-colors group animate-in slide-in-from-bottom-2 duration-300">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 text-xs">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} WIB
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.rawAction)}
                          <span className="font-black text-gray-800 uppercase text-[11px] tracking-tight">{log.itemName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic leading-tight max-w-xs">{log.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 mx-auto w-fit border ${
                        log.type === 'INCOMING' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {log.type === 'INCOMING' ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-200 w-fit mx-auto">
                        <User size={10} className="text-gray-500" />
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{log.user || 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black italic ${log.type === 'INCOMING' ? 'text-blue-600' : 'text-red-500'}`}>
                          {log.type === 'INCOMING' ? '+' : '-'}{log.quantity?.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">{log.unit}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-mono text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        {log.rawAction === 'PENJUALAN' || log.rawAction === 'PEMBATALAN' ? log.referenceId : `#${log.referenceId}`}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <History size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Tidak ada riwayat audit yang ditemukan.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => setCurrentPage(page)} 
        />
      </div>
    </div>
  );
};

export default HistoryTransaksi;