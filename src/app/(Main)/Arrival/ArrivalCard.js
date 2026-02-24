'use client';

import React from 'react';
import { PackageCheck, ChevronRight, Lock, Scale } from 'lucide-react';

const ArrivalCard = ({ arrival, isAuthorized, onOpen }) => {
  const isWeightBased = arrival?.unit?.toLowerCase() === 'kg';

  return (
    <div 
      onClick={() => isAuthorized && onOpen(arrival)}
      className={`bg-white p-4 md:p-5 rounded-[20px] md:rounded-[24px] flex justify-between items-center shadow-sm border border-transparent transition-all group relative overflow-hidden ${
        isAuthorized 
          ? 'cursor-pointer hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 active:scale-[0.98]' 
          : 'opacity-75 grayscale-[0.5]'
      }`}
    >
      {isWeightBased && (
        <div className="absolute -top-1 -right-1 p-2 bg-orange-50 rounded-bl-xl text-orange-400">
          <Scale size={10} strokeWidth={3} />
        </div>
      )}

      <div className="space-y-1.5 text-left min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg shrink-0 ${isAuthorized ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
            <PackageCheck size={14} />
          </div>
          <p className="font-black text-gray-800 uppercase text-[11px] md:text-xs tracking-tight truncate leading-none">
            {arrival?.item || 'Unknown Item'}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-hidden pl-0.5">
          <span className="text-[8px] md:text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-black uppercase whitespace-nowrap tracking-tighter">
            {(parseFloat(arrival?.qty) || 0).toLocaleString('id-ID')} {arrival?.unit || 'UNIT'}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
          <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate italic">
            {arrival?.supplier || 'No Vendor'}
          </span>
        </div>
      </div>

      <div className="shrink-0 ml-2">
        {isAuthorized ? (
          <div className="flex items-center gap-1 text-orange-600 font-black text-[10px] uppercase italic transition-all duration-300 group-hover:translate-x-1 group-hover:text-orange-500">
            <span className="hidden md:inline-block tracking-tighter">Proses</span>
            <div className="p-1.5 bg-orange-500 text-white rounded-full shadow-lg shadow-orange-200 group-hover:rotate-[-10deg] transition-transform">
                <ChevronRight size={14} strokeWidth={4} />
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 text-slate-300 rounded-xl border border-slate-100">
            <Lock size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrivalCard;