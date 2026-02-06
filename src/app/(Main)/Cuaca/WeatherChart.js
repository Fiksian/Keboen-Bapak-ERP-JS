import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer } from 'lucide-react';

const WeatherChart = ({ data }) => {
  return (
    <div className="bg-white rounded-[28px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h3 className="font-black text-gray-800 uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2">
          <Thermometer size={14} className="text-blue-600" /> Temperature Trend (24H)
        </h3>
      </div>
      <div className="h-[200px] md:h-[280px] w-full -ml-4 md:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold', fill: '#94a3b8'}} interval={3} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 'bold', fill: '#cbd5e1'}} domain={['dataMin - 2', 'dataMax + 2']} hide={typeof window !== 'undefined' && window.innerWidth < 768} />
            <Tooltip 
              cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}} 
            />
            <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeatherChart;