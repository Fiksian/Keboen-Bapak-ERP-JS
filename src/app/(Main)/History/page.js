'use client'

import React, { useState, useEffect } from 'react';
import { History, FileSpreadsheet, Loader2 } from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';
import HistoryFilters from './HistoryFilters';
import HistoryLogItem from './HistoryLogItem';

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

  useEffect(() => { fetchLogs(); }, []);

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

  useEffect(() => { setCurrentPage(1); }, [filter, searchTerm, startDate, endDate]);

  return (
    <div className="p-3 sm:p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-4 md:space-y-8 animate-in fade-in duration-500 text-gray-800">
      
      <div className="flex flex-col sm:flex-row sm:items-end md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tight flex items-center gap-2 md:gap-3">
            <History className="text-blue-600 shrink-0" size={24} md={28} />
            System Audit Trail
          </h2>
          <p className="text-gray-400 text-[10px] md:text-sm font-medium italic leading-relaxed max-w-[280px] md:max-w-none">
            Monitoring pergerakan stok, invoice, dan audit log secara real-time.
          </p>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 md:py-3 bg-white border border-gray-100 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <FileSpreadsheet size={16} className="text-green-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      <HistoryFilters 
        filter={filter} 
        setFilter={setFilter}
        startDate={startDate} 
        setStartDate={setStartDate}
        endDate={endDate} 
        setEndDate={setEndDate}
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        resetDateFilter={() => { setStartDate(''); setEndDate(''); }}
      />

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6 italic">Waktu & Tanggal</th>
                <th className="px-6 py-6 italic">Rincian Transaksi</th>
                <th className="px-6 py-6 italic text-center">Status & Qty</th>
                <th className="px-6 py-6 italic text-center">Otorisator</th>
                <th className="px-8 py-6 italic text-right">Referensi</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100 md:divide-gray-50 block md:table-row-group">
              {loading ? (
                <tr className="block md:table-row">
                  <td colSpan="5" className="py-16 md:py-20 text-center block md:table-cell">
                    <Loader2 className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
                    <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sinkronisasi Data...</span>
                  </td>
                </tr>
              ) : currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <HistoryLogItem key={log.id} log={log} />
                ))
              ) : (
                <tr className="block md:table-row">
                  <td colSpan="5" className="px-8 py-20 text-center block md:table-cell">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <History size={48} strokeWidth={1} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Data tidak ditemukan</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-50 flex justify-center md:justify-end">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => setCurrentPage(page)} 
          />
        </div>
      </div>
    </div>
  );
};

export default HistoryTransaksi;