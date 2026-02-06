import React from 'react';
import { Search, Calendar as CalendarIcon, X } from 'lucide-react';

const HistoryFilters = ({ 
  filter, setFilter, startDate, setStartDate, 
  endDate, setEndDate, searchTerm, setSearchTerm, resetDateFilter 
}) => {
  return (
    <div className="bg-white p-3 md:p-4 rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-3 md:gap-4 items-center">
      
      {/* 1. Tab Filter: Scrollable di HP kecil agar tidak maksa baris baru */}
      <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full xl:w-auto overflow-x-auto no-scrollbar touch-pan-x">
        {['ALL', 'INCOMING', 'OUTGOING'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-1 xl:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all whitespace-nowrap active:scale-95 ${
              filter === type 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 2. Date Picker: Dibuat Grid 2 kolom di HP agar tidak gepeng */}
      <div className="w-full xl:w-auto bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between md:justify-start gap-1">
          <div className="flex items-center flex-1 px-1 md:px-2 gap-1 md:gap-2 overflow-hidden">
            <CalendarIcon size={14} className="text-gray-300 shrink-0" />
            
            <div className="flex items-center flex-1 justify-around">
                <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[10px] md:text-[13px] font-black uppercase outline-none text-gray-500 w-full max-w-[90px] md:max-w-none cursor-pointer"
                />
                
                <span className="text-gray-300 font-bold px-1 text-[9px] md:text-[10px]">TO</span>
                
                <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[10px] md:text-[13px] font-black uppercase outline-none text-gray-500 w-full max-w-[90px] md:max-w-none cursor-pointer"
                />
            </div>
          </div>

          {(startDate || endDate) && (
            <button 
              onClick={resetDateFilter} 
              className="p-1.5 bg-gray-200/50 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
              title="Reset Date"
            >
              <X size={12} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Search Input: Full width di mobile */}
      <div className="relative group w-full xl:flex-1">
        <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" 
            size={16} 
        />
        <input 
          type="text" 
          placeholder="Cari transaksi..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-10 py-3.5 md:py-3 bg-gray-50 border border-transparent rounded-2xl text-[11px] md:text-xs font-bold focus:bg-white focus:border-blue-100 outline-none transition-all w-full shadow-inner placeholder:text-gray-300 placeholder:italic"
        />
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500"
            >
                <X size={14} />
            </button>
        )}
      </div>
    </div>
  );
};

export default HistoryFilters;