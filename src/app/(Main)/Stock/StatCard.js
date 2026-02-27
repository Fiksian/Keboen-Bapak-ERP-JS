'use client'

import React from 'react';
import { Box, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, sub, icon, color }) => {
  const isUrgent = sub.includes('required') || sub.includes('procurement');

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all active:scale-[0.98] md:active:scale-100 overflow-hidden">
      <div className="space-y-3 md:space-y-4 min-w-0 flex-1 flex flex-col overflow-hidden">
        
        <div className="w-full overflow-hidden">
          <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap group-hover:animate-marquee transition-all duration-1000">
            {title}
          </p>
        </div>

        <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tighter md:tracking-tight">
          {value}
        </h3>

        <div className="flex items-center gap-1.5 w-full">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isUrgent ? 'bg-red-500' : 'bg-green-500'}`} />
          
          <div className="min-w-0 flex-1 overflow-hidden relative">
            <p className={`text-[9px] md:text-[10px] font-bold uppercase italic tracking-tight whitespace-nowrap block w-max group-hover:animate-marquee-sub transition-all ${isUrgent ? 'text-red-500' : 'text-green-600'}`}>
              {sub}
            </p>
          </div>
        </div>
      </div>
      
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${color} transition-transform group-hover:scale-110 shrink-0 ml-4`}>
        {React.cloneElement(icon, { className: `${icon.props.className} w-5 h-5 md:w-6 md:h-6` })}
      </div>
    </div>
  );
};

const StatCards = ({ data }) => {
  const calculateStatus = (qty) => {
    const stockQty = parseFloat(qty) || 0;
    if (stockQty <= 0) return 'SOLD OUT';
    if (stockQty <= 10) return 'LIMITED';
    return 'READY';
  };

  const getStats = () => {
    return {
      total: data.length.toString(),
      low: data.filter(i => calculateStatus(i.stock) === 'LIMITED').length.toString(),
      out: data.filter(i => calculateStatus(i.stock) === 'SOLD OUT').length.toString(),
      ready: data.filter(i => calculateStatus(i.stock) === 'READY').length.toString()
    };
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <StatCard 
        title="Total Items Stock" 
        value={stats.total} 
        sub="Total Item listed" 
        icon={<Box className="text-blue-500" />} 
        color="bg-blue-50" 
      />
      <StatCard 
        title="Low Stock Alert" 
        value={stats.low} 
        sub="Low Stock" 
        icon={<AlertTriangle className="text-orange-500" />} 
        color="bg-orange-50" 
      />
      <StatCard 
        title="Out of Stock" 
        value={stats.out} 
        sub="Empty Stock" 
        icon={<ShoppingCart className="text-red-500" />} 
        color="bg-red-50" 
      />
      <StatCard 
        title="Ready Stock" 
        value={stats.ready} 
        sub="Stock available" 
        icon={<TrendingUp className="text-green-500" />} 
        color="bg-green-50" 
      />
    </div>
  );
};

export default StatCards;