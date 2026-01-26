'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Search, Table, Calendar, ArrowRight, Trash2, Info } from 'lucide-react';
import AddProduction from './AddProduction';

const ProductionManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // MENGGUNAKAN STATE SAJA (Data akan reset jika halaman di-refresh atau pindah rute)
  const [productionList, setProductionList] = useState([
    { id: '1', date: '2025-01-02', item: 'KONSENTRAT CUSTOM', produksi: 3500, tertimbang: 3500, kandang: 0 },
    { id: '2', date: '2025-01-02', item: 'CBF 41 SILASE 10%', produksi: 8000, tertimbang: 8000, kandang: 0 },
  ]);

  // Fungsi simpan data baru (Hanya ke state, tidak ke LocalStorage)
  const handleSaveProduction = (formData) => {
    const newEntry = {
      id: crypto.randomUUID(),
      date: formData.date,
      item: formData.productName,
      produksi: Number(formData.targetQty),
      tertimbang: Number(formData.tertimbangQty),
      kandang: Number(formData.kandangQty),
      ingredients: formData.ingredients
    };

    setProductionList([newEntry, ...productionList]);
    setIsModalOpen(false);
  };

  // Fungsi hapus data
  const handleDelete = (id) => {
    if(confirm("Hapus log produksi ini dari sesi sekarang?")) {
      const filtered = productionList.filter(item => item.id !== id);
      setProductionList(filtered);
    }
  };

  // Logika Filter Pencarian
  const filteredData = productionList.filter(log => 
    log.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* Session Alert Banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-3 flex items-center gap-3">
        <Info size={16} className="text-amber-600" />
        <p className="text-[10px] font-bold text-amber-700 uppercase italic tracking-wider">
          Mode Sesi Aktif: Data akan terhapus otomatis jika halaman ditutup atau di-refresh.
        </p>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="text-left shrink-0">
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Production Log</h2>
          <p className="text-gray-400 text-[11px] mt-1 font-bold uppercase tracking-tight italic">Temporary Session Tracking</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full flex-1 justify-end">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-200 transition-all font-bold text-xs uppercase tracking-tighter italic cursor-pointer whitespace-nowrap w-full md:w-auto"
          >
            <Plus size={16} strokeWidth={3} /> Add Production
          </button>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search in this session..."
              className="w-full text-slate-600 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold outline-none focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
          <Table size={18} className="text-blue-600" />
          <h3 className="font-black text-gray-700 uppercase italic text-sm tracking-widest">Riwayat Sesi Saat Ini</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-nowrap">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Product Item</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Produksi (Kg)</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Tertimbang (Kg)</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Kandang (Kg)</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50">
                  <td className="p-5 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-300" />
                    <span className="text-sm font-bold text-gray-600">{log.date}</span>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-black text-gray-800 uppercase italic tracking-tighter">{log.item}</span>
                  </td>
                  <td className="p-5 text-center font-black text-blue-600">{log.produksi.toLocaleString()}</td>
                  <td className="p-5 text-center font-black text-green-600">{log.tertimbang.toLocaleString()}</td>
                  <td className="p-5 text-center font-bold text-gray-400">{log.kandang}</td>
                  <td className="p-5 text-right space-x-2">
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="text-gray-300 hover:text-blue-600 transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest text-xs">
                    No production data found in this session...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddProduction 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProduction} 
      />
    </div>
  );
};

export default ProductionManager;