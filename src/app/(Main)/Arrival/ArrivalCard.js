'use client';

import React from 'react';
import { 
  PackageCheck, ChevronRight, Lock, Scale, 
  Building2, Hash, Zap
} from 'lucide-react';

const ArrivalCard = ({ arrival, isAuthorized, onOpen }) => {
  const weightUnits = ['kg', 'ton', 'gram', 'gr'];
  const isWeightBased = weightUnits.includes(arrival?.unit?.toLowerCase());

  return (
    <div 
      onClick={() => isAuthorized && onOpen(arrival)}
      className={`bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-50 transition-all group relative overflow-hidden ${
        isAuthorized 
          ? 'cursor-pointer hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10 active:scale-[0.97]' 
          : 'opacity-70 grayscale-[0.2] cursor-not-allowed'
      }`}
    >
      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[18px] flex items-center gap-1.5 border-l border-b ${
        isWeightBased 
          ? 'bg-orange-50 text-orange-600 border-orange-100' 
          : 'bg-blue-50 text-blue-600 border-blue-100'
      }`}>
        {isWeightBased ? (
          <>
            <Scale size={10} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase italic tracking-tighter">Scales Based</span>
          </>
        ) : (
          <>
            <Zap size={10} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase italic tracking-tighter">Direct Unit</span>
          </>
        )}
      </div>

      <div className="space-y-2.5 text-left min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
            <Hash size={8} strokeWidth={4} /> {arrival?.noPO?.split('/').pop() || 'N/A'}
          </span>
          <span className="text-[8px] font-bold text-gray-300 uppercase italic">Awaiting Receipt</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
            isAuthorized ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            <PackageCheck size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-gray-900 uppercase text-[13px] tracking-tight truncate leading-none mb-1">
              {arrival?.item || 'Unknown Item'}
            </h4>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Building2 size={10} />
              <span className="text-[9px] font-bold uppercase tracking-tight truncate max-w-[120px]">
                {arrival?.supplier || 'No Vendor'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-0.5">
          <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-xl font-black italic tracking-tighter flex items-center gap-1.5">
            {(parseFloat(arrival?.qty) || 0).toLocaleString('id-ID')}
            <span className="text-orange-400 text-[8px] uppercase not-italic">{arrival?.unit || 'UNIT'}</span>
          </span>
          {arrival?.category && (
             <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest border border-slate-100 px-2 py-1 rounded-lg">
              {arrival.category}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 ml-4">
        {isAuthorized ? (
          <div className="flex flex-col items-center gap-1">
            <div className="p-3 bg-orange-500 text-white rounded-[18px] shadow-lg shadow-orange-200 group-hover:rotate-[-10deg] group-hover:bg-orange-600 transition-all duration-300">
              <ChevronRight size={20} strokeWidth={4} />
            </div>
            <span className="text-[8px] font-black text-orange-600 uppercase italic tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              Receive
            </span>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 text-slate-300 rounded-2xl border border-slate-100">
            <Lock size={16} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrivalCard;