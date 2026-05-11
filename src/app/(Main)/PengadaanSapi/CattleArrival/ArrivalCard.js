'use client';

import React from 'react';
import {
  Beef, ChevronRight, Lock, Scale, Globe,
  Hash, DollarSign, AlertTriangle
} from 'lucide-react';

const fmtRp  = (v) => `Rp ${(parseFloat(v) || 0).toLocaleString('id-ID')}`;
const fmtUSD = (v) => `$ ${(parseFloat(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const CattleArrivalCard = ({ arrival, isAuthorized, onOpen }) => {
  return (
    <div
      onClick={() => isAuthorized && onOpen(arrival)}
      className={`bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-gray-50 transition-all group relative overflow-hidden ${
        isAuthorized
          ? 'cursor-pointer hover:border-[#8da070]/50 hover:shadow-2xl hover:shadow-[#8da070]/10 active:scale-[0.97]'
          : 'opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Badge status atas kanan */}
      <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-[18px] bg-[#8da070]/10 border-l border-b border-[#8da070]/20 flex items-center gap-1.5">
        <Scale size={9} className="text-[#8da070]" strokeWidth={3} />
        <span className="text-[8px] font-black text-[#8da070] uppercase italic tracking-tighter">Live Stock</span>
      </div>

      <div className="space-y-2.5 text-left min-w-0 flex-1">
        {/* PO badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
            <Hash size={8} strokeWidth={4} /> {arrival?.noPO?.split('/').pop() || 'N/A'}
          </span>
          <span className="text-[8px] font-bold text-gray-300 uppercase italic">Awaiting Arrival</span>
        </div>

        {/* Nama vendor + icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 shadow-sm transition-transform group-hover:scale-110 ${isAuthorized ? 'bg-[#8da070] text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Beef size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-gray-900 uppercase text-[13px] tracking-tight truncate leading-none mb-1">
              {arrival?.vendorName || 'Unknown Vendor'}
            </h4>
          </div>
        </div>

        {/* Kuantitas + HPP */}
        <div className="flex items-center gap-2 pl-0.5">
          <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-xl font-black italic tracking-tighter flex items-center gap-1.5">
            {(parseInt(arrival?.headCount) || 0).toLocaleString('id-ID')}
            <span className="text-[#8da070] text-[8px] uppercase not-italic">Ekor</span>
          </span>
          <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
            <DollarSign size={9} /> {fmtUSD(arrival?.pricePerHeadUSD)}/ekor
          </span>
        </div>

        {/* HPP IDR */}
        {arrival?.hppAwalPerEkor > 0 && (
          <p className="text-[8px] font-bold text-[#8da070] flex items-center gap-1 pl-0.5">
            HPP: {fmtRp(arrival.hppAwalPerEkor)}/ekor · Total: {fmtRp(arrival.hppTotal)}
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="shrink-0 ml-4">
        {isAuthorized ? (
          <div className="flex flex-col items-center gap-1">
            <div className="p-3 bg-[#8da070] text-white rounded-[18px] shadow-lg shadow-[#8da070]/20 group-hover:rotate-[-10deg] group-hover:bg-[#7a8c61] transition-all duration-300">
              <ChevronRight size={20} strokeWidth={4} />
            </div>
            <span className="text-[8px] font-black text-[#8da070] uppercase italic tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
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

export default CattleArrivalCard;
