import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const InventoryAlert = ({ items = [] }) => (
  <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
      <div className="flex items-center gap-2 text-left">
        <div className="p-2 bg-red-50 rounded-lg md:hidden">
          <AlertCircle size={16} className="text-red-500" />
        </div>
        <h3 className="font-black text-gray-700 uppercase tracking-tighter md:tracking-tight text-xs md:text-sm italic md:not-italic">
          Stok Kritis
        </h3>
      </div>
      <span className="px-3 py-1 bg-red-50 text-red-500 text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-widest animate-pulse">
        Critical
      </span>
    </div>

    <div className="space-y-3 md:space-y-4 max-h-[350px] md:max-h-[400px] overflow-y-auto custom-scrollbar pr-1 md:pr-2 flex-1">
      {items.length > 0 ? (
        items.map((item, idx) => (
          <div 
            key={idx} 
            className="flex justify-between items-center p-3.5 md:p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/10 transition-all group"
          >
            <div className="flex flex-col text-left gap-0.5 min-w-0 mr-3">
              <span className="text-[11px] md:text-sm font-black text-gray-800 uppercase truncate leading-tight tracking-tight">
                {item.name}
              </span>
              <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {item.type}
              </span>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs md:text-sm font-black text-red-600 italic">
                  {item.stock} <span className="text-[10px] opacity-70 uppercase not-italic">{item.unit}</span>
                </span>
              </div>
              <p className="text-[8px] md:text-[10px] text-amber-600 font-black italic uppercase tracking-tighter mt-0.5 opacity-80 group-hover:opacity-100">
                Segera Restock!
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="p-4 bg-green-50 rounded-full mb-4">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <p className="text-gray-400 font-black italic uppercase tracking-[0.15em] text-[10px]">
                Inventory Secure
            </p>
            <p className="text-gray-300 text-[9px] font-bold mt-1">
                Semua stok terpantau stabil.
            </p>
        </div>
      )}
    </div>
  </div>
);

export default InventoryAlert;