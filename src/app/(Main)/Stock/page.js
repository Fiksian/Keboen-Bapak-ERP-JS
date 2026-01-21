'use client'

import React, { useState, useEffect } from 'react';
import { Database, Loader2, History } from 'lucide-react';
import ArrivalMonitor from './ArrivalMonitor';
import StatCards from './StatCard';
import StockTable from './StockTable';
import InventoryTable from './InventoryTable';
import EditStock from './EditStock';
import StockHistory from './StockHistory';

const StockInventory = () => {
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // State untuk History Panel
  const [selectedItem, setSelectedItem] = useState(null);
  const [allData, setAllData] = useState([]);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setAllData(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingArrivals = async () => {
    try {
      const res = await fetch('/api/stock/pending');
      if (res.ok) setPendingArrivals(await res.json());
    } catch (error) {
      console.error("Gagal mengambil data antrean:", error);
    }
  };

  useEffect(() => { 
    fetchAllStocks(); 
    fetchPendingArrivals();
  }, []);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const currentData = allData.filter(item => 
    item.type?.toUpperCase() === activeTab.toUpperCase()
  );

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Modal Edit Stok */}
      <EditStock 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

      {/* 2. Slide-over History Penerimaan */}
      <StockHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      {/* 3. Monitor Barang Masuk (In-Transit) */}
      <ArrivalMonitor 
        arrivals={pendingArrivals} 
        onRefresh={() => { fetchAllStocks(); fetchPendingArrivals(); }} 
      />

      {/* Tab Switcher */}
      <div className="flex gap-8 border-b border-gray-200">
        {['stocks', 'inventory'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`pb-4 text-sm font-bold transition-all relative capitalize ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 cursor-pointer hover:text-gray-600'}`}
          >
            {tab === 'stocks' ? 'Stocks (Siap Jual)' : 'Inventory (Bahan & Alat)'}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Statistik Ringkas */}
      <StatCards data={currentData} />

      {/* Header Banner & Tombol Riwayat */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            {activeTab === 'stocks' ? 'DAFTAR PRODUK JUAL' : 'LOGISTIK INTERNAL'}
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">Status stok berubah otomatis sesuai kuantitas riil.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* TOMBOL HISTORY */}
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm group"
          >
            <History size={18} className="text-blue-600 group-hover:rotate-[-45deg] transition-transform" />
            Receipt History
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Synchronizing Stock Levels...</p>
          </div>
        ) : activeTab === 'stocks' ? (
          <StockTable data={currentData} onEdit={handleEdit} onRefresh={fetchAllStocks} />
        ) : (
          <InventoryTable data={currentData} onEdit={handleEdit} onRefresh={fetchAllStocks} />
        )}
      </div>
    </div>
  );
};

export default StockInventory;