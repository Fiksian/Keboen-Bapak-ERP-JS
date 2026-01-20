'use client'

import React, { useState, useEffect } from 'react';
import { 
  History, ArrowUpRight, ArrowDownLeft, 
  Search, Filter, Calendar, Loader2,
  FileSpreadsheet
} from 'lucide-react';

const HistoryTransaksi = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, INCOMING, OUTGOING

  // Asumsi API History sudah dibuat
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
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

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500 text-gray-800">
      
      {/* Header & Stats Brief */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-3">
            <History className="text-blue-600" size={28} />
            Transaction Audit Trail
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">Rekam jejak otomatis seluruh perpindahan barang dan pengadaan.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            <FileSpreadsheet size={16} className="text-green-600" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'INCOMING', 'OUTGOING'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                filter === type 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input 
            type="text" 
            placeholder="Search transaction..." 
            className="pl-12 pr-6 py-3 bg-gray-50 border border-transparent rounded-2xl text-xs font-bold focus:bg-white focus:border-blue-100 outline-none transition-all w-64"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6">Date & Time</th>
                <th className="px-6 py-6">Event / Transaction</th>
                <th className="px-6 py-6 text-center">Type</th>
                <th className="px-6 py-6 text-center">Changes</th>
                <th className="px-8 py-6 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Logs...</span>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 uppercase tracking-tight">{log.itemName}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">{log.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 mx-auto w-fit border ${
                        log.type === 'INCOMING' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {log.type === 'INCOMING' ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`text-sm font-black ${log.type === 'INCOMING' ? 'text-blue-600' : 'text-red-500'}`}>
                        {log.type === 'INCOMING' ? '+' : '-'}{log.quantity}
                      </span>
                      <span className="ml-1 text-[9px] text-gray-400 font-bold uppercase">{log.unit}</span>
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-[10px] text-gray-400 font-bold">
                      #{log.referenceId || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">No transaction history found.</td>
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