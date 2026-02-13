'use client'

import React, { useState, useEffect } from 'react';
import { 
  Download, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, Loader2, AlertTriangle, Users, FileBarChart, 
  ChevronDown, History as HistoryIcon, Package, Activity 
} from 'lucide-react';
import ReportStatCard from './ReportStatCard';
import InventoryAlert from './InventoryAlert';
import ProductionChart from './ProductionChart';
import ActivityLogsTable from './ActivityLogsTable';
import { exportToExcel } from './ExportUtils';

const Report = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [range, setRange] = useState('Daily');

  const fetchReport = async (selectedRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/report/dashboard?range=${selectedRange}`);
      if (!res.ok) throw new Error('Gagal mengambil data laporan');
      const result = await res.json();
      setData(result);
      setRange(selectedRange);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport('Daily');
  }, []);

  useEffect(() => {
    const closeMenu = () => setShowExportMenu(false);
    if (showExportMenu) window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [showExportMenu]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <Loader2 className="animate-spin text-[#8da070]" size={48} />
        <FileBarChart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8da070]/30" size={18} />
      </div>
      <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Gathering Intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center bg-white rounded-[32px] border border-red-100 m-6 shadow-xl shadow-red-50/50">
      <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="text-red-500" size={32} />
      </div>
      <h3 className="text-gray-800 font-black uppercase italic tracking-tighter text-lg">System Error</h3>
      <p className="text-red-500 font-bold uppercase text-[10px] mt-2 tracking-widest">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic active:scale-95 transition-all">
        Try Again
      </button>
    </div>
  );

  const handleExport = (period) => {
    exportToExcel(data, period);
    setShowExportMenu(false);
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-full space-y-6 md:space-y-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 md:p-0 md:bg-transparent rounded-[32px] md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 bg-[#8da070]/10 text-[#8da070] px-3 py-1 rounded-lg mb-3">
             <Activity size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest italic">Live Analytics - {range}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
            Business Intelligence
          </h2>
          <p className="text-gray-400 text-[10px] md:text-sm mt-2 font-bold uppercase md:normal-case md:font-medium italic tracking-tight md:tracking-normal">
            Monitoring Finance, Production, & Inventory from {data.config?.entityName || 'Keboen Bapak'}.
          </p>
        </div>

        <div className="flex flex-row gap-2 w-full lg:w-auto relative">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black text-gray-600 hover:bg-gray-50 shadow-sm uppercase tracking-wider transition-all">
            <Calendar size={14} className="text-[#8da070]" />
            <span className="hidden sm:inline">Updated:</span> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </button>

          <div className="relative flex-1 lg:flex-none" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#8da070] text-white rounded-2xl text-[10px] font-black hover:bg-[#7a8c5f] shadow-xl shadow-[#8da070]/20 uppercase tracking-wider transition-all active:scale-95"
            >
              <Download size={14} strokeWidth={3} />
              Export Data
              <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Timeframe</span>
                </div>
                <div className="p-2">
                  <button onClick={() => { fetchReport('Daily'); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-700 hover:bg-[#8da070]/5 hover:text-[#8da070] rounded-xl transition-colors uppercase italic flex items-center justify-between group">
                    Daily Report <TrendingUp size={12} className="opacity-0 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => { fetchReport('Weekly'); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-700 hover:bg-[#8da070]/5 hover:text-[#8da070] rounded-xl transition-colors uppercase italic flex items-center justify-between group">
                    Weekly Report <Package size={12} className="opacity-0 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => { fetchReport('Monthly'); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-700 hover:bg-[#8da070]/5 hover:text-[#8da070] rounded-xl transition-colors uppercase italic flex items-center justify-between group">
                    Monthly Report <HistoryIcon size={12} className="opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="h-[1px] bg-gray-100 my-1 mx-2" />
                  <button onClick={() => handleExport(range)} className="w-full text-left px-4 py-3 text-[10px] font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-colors uppercase italic flex items-center justify-between group">
                    Download Current Excel <Download size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <ReportStatCard 
          title="Net Balance" 
          value={`Rp ${data.finance.netBalance.toLocaleString('id-ID')}`} 
          isPositive={data.finance.netBalance >= 0} 
          icon={<TrendingUp size={18}/>}
        />
        <ReportStatCard 
          title="Income" 
          value={`Rp ${data.finance.totalIncome.toLocaleString('id-ID')}`} 
          isPositive={true}
          icon={<ArrowUpRight size={18}/>}
        />
        <ReportStatCard 
          title="Expense" 
          value={`Rp ${data.finance.totalExpense.toLocaleString('id-ID')}`} 
          isPositive={false}
          icon={<ArrowDownRight size={18}/>}
        />
        <ReportStatCard 
          title="Staff Count" 
          value={`${data.hr.totalStaff} Pers`} 
          isPositive={true}
          icon={<Users size={18}/>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="w-full">
            <InventoryAlert items={data.inventory.criticalItems} />
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm w-full">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 italic flex items-center gap-2">
              <TrendingUp size={14} className="text-[#8da070]" />
              Production Distribution
            </h3>
            <div className="h-[320px] w-full">
                <ProductionChart data={data.production} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-3">
              <HistoryIcon size={18} className="text-[#8da070]" />
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest italic">System Activity Logs</h3>
            </div>
            <span className="text-[9px] font-bold text-[#8da070] bg-[#8da070]/10 px-3 py-1 rounded-full animate-pulse">Live Feed</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <ActivityLogsTable logs={data.activities} />
        </div>
      </div>
      
    </div>
  );
};

export default Report;