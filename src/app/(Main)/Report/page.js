'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Download, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Calendar, Loader2,
  AlertTriangle, History, Users
} from 'lucide-react';

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

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Analytics...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center bg-red-50 rounded-3xl border border-red-100 m-6">
      <AlertTriangle className="mx-auto text-red-500 mb-2" />
      <p className="text-red-600 font-bold">{error}</p>
    </div>
  );

  const productionData = data.production.map(item => ({
    name: item.status,
    value: item._count.id
  }));

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            ANALYTICAL REPORTS
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Data real-time dari modul Finance, Produksi, dan Inventory.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Calendar size={16} />
            Update: {new Date().toLocaleDateString('id-ID')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-700">Peringatan Stok Rendah</h3>
            <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black rounded-lg uppercase">Critical</span>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {data.inventory.criticalItems.length > 0 ? (
              data.inventory.criticalItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-700 uppercase">{item.name}</span>
                    <span className="text-[10px] text-slate-600 font-bold">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-red-500">{item.stock} {item.unit}</span>
                    <p className="text-[12px] text-amber-500 font-medium italic text-nowrap">Segera Restock!</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-10">Semua stok terpantau aman.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-8">Status Produksi (Batch)</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="h-[250px] w-full md:w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productionData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 w-full flex-1">
              {productionData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-800">{item.value} Batch</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-3">
            <History size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-700 uppercase tracking-tight">Recent System Logs</h3>
          </div>
          <Link href="/History" className="text-blue-600 text-xs font-bold hover:underline">Lihat Semua Audit</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-5">Activity</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5 text-center">User</th>
                <th className="px-6 py-5 text-center">Date</th>
                <th className="px-8 py-5 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.activities.map((log, idx) => (
                <tr key={idx} className="group hover:bg-blue-50/20 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 tracking-tight">{log.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{log.item}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase">
                        {log.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700 font-bold text-center italic">{log.user}</td>
                  <td className="px-6 py-5 text-xs text-gray-400 font-medium text-center">
                    {new Date(log.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-8 py-5 text-right text-[11px] text-gray-500 font-medium max-w-[200px] truncate">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportStatCard = ({ title, value, isPositive, icon }) => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[140px] hover:shadow-xl hover:shadow-gray-200/40 transition-all group">
    <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{title}</p>
        <div className={`p-2 rounded-xl transition-colors ${isPositive ? 'bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white' : 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white'}`}>
            {icon}
        </div>
    </div>
    <div className="mt-4">
      <h3 className="text-xl font-black text-gray-800 tracking-tight">{value}</h3>
      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Live from database</p>
    </div>
  </div>
);

export default Report;