import React from 'react';

const ReportStatCard = ({ title, value, isPositive, icon }) => {
  const isLongValue = value?.length > 15;

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[120px] md:min-h-[140px] hover:shadow-xl hover:shadow-gray-200/40 transition-all group relative overflow-hidden">
      
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-[2] pointer-events-none`}>
        {icon}
      </div>

      <div className="flex justify-between items-start relative z-10">
        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none italic">
          {title}
        </p>
        <div className={`p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
          isPositive 
            ? 'bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white group-hover:rotate-12' 
            : 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:-rotate-12'
        }`}>
          {React.cloneElement(icon, { size: 16 })}
        </div>
      </div>

      <div className="mt-3 md:mt-4 relative z-10">
        <h3 className={`font-black text-gray-800 tracking-tighter leading-none break-all sm:break-normal ${
          isLongValue ? 'text-sm md:text-xl' : 'text-base md:text-2xl'
        }`}>
          {value}
        </h3>
        
        <div className="flex items-center gap-1.5 mt-1.5 md:mt-2">
          <div className={`w-1 h-1 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase italic tracking-tighter">
            Live Analytics
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportStatCard;