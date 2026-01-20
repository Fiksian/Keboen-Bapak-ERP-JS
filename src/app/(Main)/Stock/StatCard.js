import React from 'react';
import { Box, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, sub, icon, color }) => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
      <p className={`text-[10px] font-bold ${sub.includes('required') || sub.includes('procurement') ? 'text-red-500' : 'text-green-500'}`}>
        {sub}
      </p>
    </div>
    <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
  </div>
);

const StatCards = ({ data }) => {
  const calculateStatus = (qty) => {
    if (qty <= 0) return 'SOLD OUT';
    if (qty <= 10) return 'LIMITED';
    return 'READY';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Items" value={data.length.toString()} sub="Items in this tab" icon={<Box className="text-blue-500" />} color="bg-blue-50" />
      <StatCard title="Low Stock" value={data.filter(i => calculateStatus(i.stock) === 'LIMITED').length.toString()} sub="Action required" icon={<AlertTriangle className="text-orange-500" />} color="bg-orange-50" />
      <StatCard title="Out of Stock" value={data.filter(i => calculateStatus(i.stock) === 'SOLD OUT').length.toString()} sub="Need procurement" icon={<ShoppingCart className="text-red-500" />} color="bg-red-50" />
      <StatCard title="Ready Stock" value={data.filter(i => calculateStatus(i.stock) === 'READY').length.toString()} sub="Available now" icon={<TrendingUp className="text-green-500" />} color="bg-green-50" />
    </div>
  );
};

export default StatCards;