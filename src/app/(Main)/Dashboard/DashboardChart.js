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
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-6 text-sm font-bold">
          <button className="text-blue-600 border-b-2 border-blue-600 pb-1">Senin</button>
          <button className="text-gray-400 hover:text-gray-600">Selasa</button>
          <button className="text-gray-400 hover:text-gray-600">Rabu</button>
          <button className="text-gray-400 hover:text-gray-600">Kamis</button>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> 
            <span className="text-gray-600">Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> 
            <span className="text-gray-600">Payments</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="traffic" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6 }} 
            />
            <Line 
              type="monotone" 
              dataKey="payments" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChart;