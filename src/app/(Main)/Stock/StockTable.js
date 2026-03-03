'use client';

import React, { useState, memo } from 'react';
import { Package, Database, Trash2, Edit3, ChevronDown, Layers } from 'lucide-react';
import Pagination from '@/app/(Main)/Components/Pagination';

const StockTable = ({ data = [], onEdit, onRefresh, type = 'stock' }) => {
  const [unitPreferences, setUnitPreferences] = useState({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  const getExtendedConversion = (value, unit) => {
    const amount = parseFloat(value || 0);
    const u = unit?.toUpperCase() || 'UNIT';
    
    const options = {
      default: { val: amount, unit: u, label: 'Asli' }
    };

    if (['KG', 'TON', 'GRAM', 'GR'].includes(u)) {
      const baseInKg = u === 'TON' ? amount * 1000 : (u === 'GRAM' || u === 'GR' ? amount / 1000 : amount);
      options.kg = { val: baseInKg, unit: 'KG', label: 'Standar (KG)' };
      options.ton = { val: baseInKg / 1000, unit: 'TON', label: 'Besar (TON)' };
      options.gram = { val: baseInKg * 1000, unit: 'GRAM', label: 'Kecil (GR)' };
    } 
    else if (['LITER', 'L', 'ML'].includes(u)) {
      const baseInLiter = (u === 'ML') ? amount / 1000 : amount;
      options.liter = { val: baseInLiter, unit: 'LITER', label: 'Standar (L)' };
      options.ml = { val: baseInLiter * 1000, unit: 'ML', label: 'Kecil (ML)' };
    }
    else if (u === 'SACKS') {
      options.kg = { val: amount * 50, unit: 'KG', label: 'Estimasi (KG)' };
    }

    return options;
  };

  const getDerivedStatus = (item) => {
    const opts = getExtendedConversion(item.stock, item.unit);
    const checkVal = opts.kg ? opts.kg.val : opts.default.val;
    if (checkVal <= 0) return 'EMPTY';
    if (checkVal <= 10) return 'LIMITED'; 
    return 'READY';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'READY': return 'bg-green-50 text-green-600 border-green-100';
      case 'LIMITED': return 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse';
      case 'EMPTY': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const handleUnitChange = (itemId, selectedKey) => {
    setUnitPreferences(prev => ({ ...prev, [itemId]: selectedKey }));
  };

  const formatNumber = (num) => {
    if (num === 0) return "0";
    if (num < 0.01 && num > 0) return num.toFixed(4);
    return parseFloat(num.toFixed(2)).toLocaleString('id-ID');
  };

  const deleteItem = async (id) => {
    if (!confirm("Hapus item secara permanen?")) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="hidden lg:block overflow-x-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
              <th className="px-8 py-6">Produk / Material</th>
              <th className="px-6 py-6">Kategori</th>
              <th className="px-6 py-6 text-center">Stok Tersedia</th>
              <th className="px-6 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentData.length > 0 ? currentData.map((item) => {
              const conversionOptions = getExtendedConversion(item.stock, item.unit);
              const currentStatus = getDerivedStatus(item);
              const userPrefKey = unitPreferences[item.id] || 'default';
              const displayData = conversionOptions[userPrefKey] || conversionOptions.default;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        currentStatus === 'EMPTY' ? 'bg-red-50 text-red-300' : 'bg-white text-slate-400 group-hover:text-indigo-500 shadow-sm'
                      }`}>
                        {type === 'stock' ? <Package size={18} /> : <Database size={18} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-800 uppercase tracking-tight truncate">{item.name || item.item}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase italic truncate">Base: {item.unit}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-500 font-black uppercase tracking-tighter">
                    {item.category || "General"}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-xl font-black italic tracking-tighter ${currentStatus === 'READY' ? 'text-indigo-600' : currentStatus === 'LIMITED' ? 'text-orange-500' : 'text-rose-500'}`}>
                        {formatNumber(displayData.val)}
                      </span>
                      <div className="relative mt-2">
                        <select 
                          value={userPrefKey}
                          onChange={(e) => handleUnitChange(item.id, e.target.value)}
                          className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-black px-4 py-1 pr-6 rounded-full cursor-pointer uppercase transition-all outline-none"
                        >
                          {Object.entries(conversionOptions).map(([key, opt]) => (
                            <option key={key} value={key}>{opt.label} ({opt.unit})</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusStyle(currentStatus)}`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(item)} className="px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-2">
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" className="py-24 text-center text-slate-300 italic uppercase text-[10px] font-black tracking-[0.3em]">Data Kosong</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden grid grid-cols-1 gap-4">
        {currentData.length > 0 ? currentData.map((item) => {
          const conversionOptions = getExtendedConversion(item.stock, item.unit);
          const currentStatus = getDerivedStatus(item);
          const userPrefKey = unitPreferences[item.id] || 'default';
          const displayData = conversionOptions[userPrefKey] || conversionOptions.default;

          return (
            <div key={item.id} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(currentStatus)}`}>
                    {type === 'stock' ? <Package size={20} /> : <Database size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 uppercase text-[13px] tracking-tight">{item.name || item.item}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase italic tracking-wider">Cat: {item.category || "General"}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[8px] font-black border uppercase ${getStatusStyle(currentStatus)}`}>
                  {currentStatus}
                </span>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-4 flex justify-between items-center border border-slate-100/50">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Stock</span>
                  <span className={`text-2xl font-black italic leading-none tracking-tighter ${currentStatus === 'READY' ? 'text-indigo-600' : 'text-orange-500'}`}>
                    {formatNumber(displayData.val)}
                  </span>
                </div>
                
                <div className="relative">
                  <select 
                    value={userPrefKey}
                    onChange={(e) => handleUnitChange(item.id, e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-slate-500 text-[9px] font-black px-4 py-2 pr-8 rounded-xl cursor-pointer uppercase shadow-sm outline-none"
                  >
                    {Object.entries(conversionOptions).map(([key, opt]) => (
                      <option key={key} value={key}>{opt.unit}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => onEdit(item)} className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-200">
                  <Edit3 size={14} /> Edit Item
                </button>
                <button onClick={() => deleteItem(item.id)} className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl active:scale-95 border border-rose-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center text-slate-300 italic uppercase text-[10px] font-black tracking-widest">Database Kosong</div>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default memo(StockTable);