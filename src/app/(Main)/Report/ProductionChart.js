import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ProductionChart = ({ data = [] }) => {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-full">
      <h3 className="font-bold text-gray-700 mb-8 uppercase tracking-tight text-sm">Status Produksi (Batch)</h3>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="h-[250px] w-full md:w-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4 w-full flex-1">
          {data.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
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
  );
};

export default ProductionChart;