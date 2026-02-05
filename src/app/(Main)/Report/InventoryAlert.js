import React from 'react';

const InventoryAlert = ({ items = [] }) => (
  <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-full">
    <div className="flex justify-between items-center mb-8">
      <h3 className="font-bold text-gray-700 uppercase tracking-tight text-sm">Peringatan Stok Rendah</h3>
      <span className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black rounded-lg uppercase">Critical</span>
    </div>
    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
      {items.length > 0 ? (
        items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-100 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-700 uppercase">{item.name}</span>
              <span className="text-[10px] text-slate-600 font-bold">{item.type}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-red-500">{item.stock} {item.unit}</span>
              <p className="text-[12px] text-amber-500 font-medium italic text-nowrap">Segera Restock!</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10">
            <p className="text-gray-400 font-medium italic text-sm">Semua stok terpantau aman.</p>
        </div>
      )}
    </div>
  </div>
);

export default InventoryAlert;