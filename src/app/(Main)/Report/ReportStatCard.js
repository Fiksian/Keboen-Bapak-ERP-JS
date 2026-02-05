import React from 'react';

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
      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 italic">Live from database</p>
    </div>
  </div>
);

export default ReportStatCard;