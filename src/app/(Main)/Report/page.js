'use client'

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  FileText, Download, Filter, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown 
} from 'lucide-react';

const Report = () => {
  // Data Dummy: Pertumbuhan Berat Badan Sapi (Bulanan)
  const growthData = [
    { month: 'Jan', weight: 450 },
    { month: 'Feb', weight: 480 },
    { month: 'Mar', weight: 510 },
    { month: 'Apr', weight: 505 },
    { month: 'Mei', weight: 540 },
    { month: 'Jun', weight: 580 },
  ];

  // Data Dummy: Distribusi Biaya Operasional
  const expenseData = [
    { name: 'Pakan', value: 55 },
    { name: 'Kesehatan', value: 20 },
    { name: 'Gaji Staff', value: 15 },
    { name: 'Lainnya', value: 10 },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            ANALYTICAL REPORTS
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Pantau performa dan efisiensi operasional peternakan Anda.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Calendar size={16} />
            Jan 2026 - Jun 2026
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportStatCard 
          title="Revenue Growth" 
          value="Rp 128.5M" 
          percentage="+12.5%" 
          isUp={true} 
        />
        <ReportStatCard 
          title="Avg. Weight Gain" 
          value="0.85 kg/day" 
          percentage="+2.4%" 
          isUp={true} 
        />
        <ReportStatCard 
          title="Feed Efficiency" 
          value="6.2 FCR" 
          percentage="-1.2%" 
          isUp={false} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Growth Analytics */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-700">Analisa Pertumbuhan Berat Badan (Rata-rata)</h3>
            <button className="text-gray-400 hover:text-gray-600"><Filter size={18} /></button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense Distribution */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-8">Distribusi Biaya Operasional</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="h-[250px] w-full md:w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 w-full flex-1">
              {expenseData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-gray-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-sm font-bold text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Generated Reports Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Laporan Terbaru</h3>
          <button className="text-blue-600 text-xs font-bold hover:underline">Lihat Semua</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-5">Nama Laporan</th>
                <th className="px-6 py-5">Kategori</th>
                <th className="px-6 py-5 text-center">Tanggal Dibuat</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: "Laporan Produksi Susu Juni 2026", cat: "Operasional", date: "01/07/2026", status: "Ready" },
                { name: "Analisa Kesehatan Kandang A", cat: "Kesehatan", date: "28/06/2026", status: "Ready" },
                { name: "Rekapitulasi Pakan Kuartal 2", cat: "Logistik", date: "25/06/2026", status: "Archived" }
              ].map((report, idx) => (
                <tr key={idx} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-8 py-5 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileText size={18} /></div>
                    <span className="text-sm font-bold text-gray-800">{report.name}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500 font-medium">{report.cat}</td>
                  <td className="px-6 py-5 text-sm text-gray-400 font-medium text-center">{report.date}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${report.status === 'Ready' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Download size={18} /></button>
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

// Sub-komponen Kartu Statistik Report
const ReportStatCard = ({ title, value, percentage, isUp }) => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-3">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    <div className="flex justify-between items-end">
      <h3 className="text-2xl font-black text-gray-800">{value}</h3>
      <div className={`flex items-center gap-1 text-[11px] font-black ${isUp ? 'text-green-500' : 'text-red-500'}`}>
        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {percentage}
      </div>
    </div>
  </div>
);

export default Report;