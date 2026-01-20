'use client'

import React, { useState, useEffect } from 'react';
import { Database, Loader2 } from 'lucide-react';
import ArrivalMonitor from './ArrivalMonitor';
import StatCards from './StatCard';
import StockTable from './StockTable';
import InventoryTable from './InventoryTable';
import EditStock from './EditStock';

const StockInventory = () => {
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      <EditStock 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

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
            className={`pb-4 text-sm font-bold transition-all relative capitalize ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 cursor-pointer'}`}
          >
            {tab === 'stocks' ? 'Stocks (Siap Jual)' : 'Inventory (Bahan & Alat)'}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      <StatCards data={currentData} />

      {/* Header Banner */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            {activeTab === 'stocks' ? 'DAFTAR PRODUK JUAL' : 'LOGISTIK INTERNAL'}
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">Status stok berubah otomatis sesuai kuantitas riil.</p>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 font-bold text-xs uppercase tracking-widest">
          <Database size={16} /> Integrated Database
        </div>
      </div>

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