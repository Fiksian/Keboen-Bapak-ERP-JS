'use client'

import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Loader2, AlertTriangle, Users, FileBarChart } from 'lucide-react';
import ReportStatCard from './ReportStatCard';
import InventoryAlert from './InventoryAlert';
import ProductionChart from './ProductionChart';
import ActivityLogsTable from './ActivityLogsTable';

const Report = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/report/dashboard');
        if (!res.ok) throw new Error('Gagal mengambil data laporan');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <FileBarChart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200" size={18} />
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

  const productionDataFormatted = data.production.map(item => ({
    name: item.status,
    value: item._count.id
  }));

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-full space-y-6 md:space-y-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 md:p-0 md:bg-transparent rounded-[32px] md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg mb-3">
             <FileBarChart size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest italic">Live Dashboard</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
            Analytical Reports
          </h2>
          <p className="text-gray-400 text-[10px] md:text-sm mt-2 font-bold uppercase md:normal-case md:font-medium italic tracking-tight md:tracking-normal">
            Real-time intelligence: Finance, Production, & Inventory.
          </p>
        </div>

        <div className="flex flex-row gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black text-gray-600 hover:bg-gray-50 shadow-sm uppercase tracking-wider transition-all active:scale-95">
            <Calendar size={14} className="text-blue-500" />
            <span className="hidden sm:inline">Update:</span> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-wider transition-all active:scale-95">
            <Download size={14} strokeWidth={3} />
            Export <span className="hidden sm:inline">Analytics</span>
          </button>
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
          title="Total Income" 
          value={`Rp ${data.finance.totalIncome.toLocaleString('id-ID')}`} 
          isPositive={true}
          icon={<ArrowUpRight size={18}/>}
        />
        <ReportStatCard 
          title="Total Expense" 
          value={`Rp ${data.finance.totalExpense.toLocaleString('id-ID')}`} 
          isPositive={false}
          icon={<ArrowDownRight size={18}/>}
        />
        <ReportStatCard 
          title="Total Staff" 
          value={`${data.hr.totalStaff} Pers`} 
          isPositive={true}
          icon={<Users size={18}/>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="w-full">
            <InventoryAlert items={data.inventory.criticalItems} />
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm w-full">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic ml-1">Production Distribution</h3>
            <div className="h-[300px] w-full">
                <ProductionChart data={productionDataFormatted} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest italic">System Activity Logs</h3>
            <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">Live Feed</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <ActivityLogsTable logs={data.activities} />
        </div>
      </div>
      
    </div>
  );
};

export default Report;