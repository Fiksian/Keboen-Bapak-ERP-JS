'use client'

import React, { useState, useEffect } from 'react';
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  Search, FileSpreadsheet, Loader2,
  User, Hash, Package
} from 'lucide-react';

const HistoryTransaksi = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, INCOMING, OUTGOING
  const [searchTerm, setSearchTerm] = useState('');

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

  // Logika Filtering & Searching
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.type === filter;
    const matchesSearch = 
      log.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500 text-gray-800">
      
      {/* Header & Action Brief */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
            <History className="text-blue-600" size={28} />
            System Audit Trail
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic text-balance">
            Rekam jejak otomatis perpindahan barang, stok, dan otorisasi user.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Export Audit Log
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
          {['ALL', 'INCOMING', 'OUTGOING'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                filter === type 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search item, notes, or user..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-100 outline-none transition-all w-full md:w-80 shadow-inner"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6 italic">Timestamp</th>
                <th className="px-6 py-6 italic">Transaction Details</th>
                <th className="px-6 py-6 italic text-center">Type</th>
                <th className="px-6 py-6 italic text-center">PIC / User</th>
                <th className="px-6 py-6 italic text-center">Changes</th>
                <th className="px-8 py-6 italic text-right">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/10 transition-colors group">
                    {/* Time */}
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 text-xs">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Package size={12} className="text-blue-500" />
                          <span className="font-black text-gray-800 uppercase text-[11px] tracking-tight">{log.itemName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic leading-tight max-w-xs">{log.description}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 mx-auto w-fit border ${
                        log.type === 'INCOMING' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {log.type === 'INCOMING' ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                        {log.type}
                      </span>
                    </td>

                    {/* User / PIC */}
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-200">
                          <User size={10} className="text-gray-500" />
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{log.user || 'SYSTEM'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity Changes */}
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black italic ${log.type === 'INCOMING' ? 'text-blue-600' : 'text-red-500'}`}>
                          {log.type === 'INCOMING' ? '+' : '-'}{log.quantity.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">{log.unit}</span>
                      </div>
                    </td>

                    {/* Reference ID */}
                    <td className="px-8 py-6 text-right">
                      <span className="font-mono text-[10px] text-blue-400 font-black bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        #{log.referenceId || 'LOG-INF'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <History size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">No matching logs found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryTransaksi;