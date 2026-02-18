'use client'

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ProductionChart = ({ data = [] }) => {
  const [mounted, setMounted] = useState(false);

  const STATUS_COLORS = {
    'SCHEDULLING': '#6366f1', // Indigo
    'IN_PROGRESS': '#f59e0b', // Amber/Yellow
    'COMPLETED': '#10b981',   // Emerald/Green
    'CANCELLED': '#ef4444',   // Red
    'UNKNOWN': '#9ca3af'      // Gray
  };

  const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = Array.isArray(data) 
    ? data
        .filter(item => item && item.status)
        .map(item => ({
          name: item.status.replace('_', ' '),
          value: item.count || 0,
          rawStatus: item.status
        }))
    : [];

  if (!mounted) return <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-3xl" />;

  const totalBatch = chartData.reduce((a, b) => a + (b.value || 0), 0);

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
        <h3 className="font-black text-gray-700 uppercase tracking-tighter md:tracking-tight text-xs md:text-sm italic md:not-italic">
          Status Produksi <span className="text-blue-500 font-black">(Batch)</span>
        </h3>
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-center gap-6 md:gap-8 flex-1">
        <div className="h-[200px] w-[200px] md:h-[250px] md:w-[250px] relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={typeof window !== 'undefined' && window.innerWidth < 768 ? 55 : 65}
                outerRadius={typeof window !== 'undefined' && window.innerWidth < 768 ? 75 : 85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.rawStatus] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}
                itemStyle={{ color: '#1f2937' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total</span>
            <span className="text-xl md:text-2xl font-black text-gray-800 italic">
              {totalBatch}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 md:gap-3 w-full flex-1">
          {chartData.length > 0 ? chartData.map((item, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center p-3 md:p-4 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full shadow-sm" 
                  style={{ backgroundColor: STATUS_COLORS[item.rawStatus] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                ></div>
                <span className="text-[10px] md:text-xs font-black text-gray-500 group-hover:text-gray-800 uppercase tracking-tighter transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs md:text-sm font-black text-gray-800 italic">{item.value}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">Bth</span>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <span className="text-[10px] font-black uppercase italic tracking-widest">Data Kosong</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionChart;