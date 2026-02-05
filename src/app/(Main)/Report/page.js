'use client'

import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Loader2, AlertTriangle, Users } from 'lucide-react';
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
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs tracking-widest">Loading Analytics...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center bg-red-50 rounded-3xl border border-red-100 m-6 italic">
      <AlertTriangle className="mx-auto text-red-500 mb-2" />
      <p className="text-red-600 font-bold uppercase text-xs">{error}</p>
    </div>
  );

  const productionDataFormatted = data.production.map(item => ({
    name: item.status,
    value: item._count.id
  }));

  return (
    <div className="p-4 md:p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">ANALYTICAL REPORTS</h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">Data real-time dari modul Finance, Produksi, dan Inventory.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm uppercase tracking-wider transition-all">
            <Calendar size={14} />
            Update: {new Date().toLocaleDateString('id-ID')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase tracking-wider transition-all">
            <Download size={14} />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          value={`${data.hr.totalStaff} Orang`} 
          isPositive={true}
          icon={<Users size={18}/>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlert items={data.inventory.criticalItems} />
        <ProductionChart data={productionDataFormatted} />
      </div>

      <ActivityLogsTable logs={data.activities} />
      
    </div>
  );
};

export default Report;