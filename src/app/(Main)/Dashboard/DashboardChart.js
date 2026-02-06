'use client'

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardChart = () => {
  const data = [
    { time: '09:22', traffic: 30, payments: 40 },
    { time: '10:22', traffic: 45, payments: 20 },
    { time: '11:22', traffic: 35, payments: 55 },
    { time: '12:22', traffic: 60, payments: 30 },
    { time: '13:22', traffic: 40, payments: 75 },
    { time: '14:22', traffic: 55, payments: 45 },
    { time: '15:22', traffic: 50, payments: 35 },
  ];

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        
        <div className="flex gap-4 md:gap-6 text-[12px] md:text-sm font-bold overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
          <button className="text-blue-600 border-b-2 border-blue-600 pb-1 whitespace-nowrap">Senin</button>
          <button className="text-gray-400 hover:text-gray-600 whitespace-nowrap">Selasa</button>
          <button className="text-gray-400 hover:text-gray-600 whitespace-nowrap">Rabu</button>
          <button className="text-gray-400 hover:text-gray-600 whitespace-nowrap">Kamis</button>
        </div>

        <div className="flex gap-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest self-end sm:self-auto">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500"></div> 
            <span className="text-gray-600">Traffic</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div> 
            <span className="text-gray-600">Payments</span>
          </div>
        </div>
      </div>

      <div className="h-[250px] md:h-[300px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 9, fill: '#9ca3af', fontWeight: 'bold'}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 9, fill: '#9ca3af', fontWeight: 'bold'}}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="traffic" 
              stroke="#3b82f6" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 5, strokeWidth: 0 }} 
            />
            <Line 
              type="monotone" 
              dataKey="payments" 
              stroke="#22c55e" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 5, strokeWidth: 0 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChart;