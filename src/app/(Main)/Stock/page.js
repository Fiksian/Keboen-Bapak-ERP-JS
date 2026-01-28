'use client'

import React, { useState, useEffect } from 'react';
import { Database, Loader2, History } from 'lucide-react';
import ArrivalMonitor from './ArrivalMonitor';
import StatCards from './StatCard';
import StockTable from './StockTable';
import InventoryTable from './InventoryTable';
import EditStock from './EditStock';
import StockHistory from './StockHistory';
import SearchInput from '@/app/(Main)/Components/SeachInput'; 

const StockInventory = () => {
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [allData, setAllData] = useState([]);
  const [pendingArrivals, setPendingArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');

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

 
  const currentData = allData.filter(item => {
    const matchesTab = item.type?.toUpperCase() === activeTab.toUpperCase();
    const query = searchQuery.toLowerCase();
    const itemName = (item.name || item.item || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    
    const matchesSearch = itemName.includes(query) || category.includes(query);
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500">
      
      <EditStock 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

      <StockHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />

      <ArrivalMonitor 
        arrivals={pendingArrivals} 
        onRefresh={() => { fetchAllStocks(); fetchPendingArrivals(); }} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex gap-8">
          {['stocks', 'inventory'].map((tab) => (
            <button 
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery('');
              }} 
              className={`pb-4 text-sm font-bold transition-all relative capitalize ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 cursor-pointer hover:text-gray-600'}`}
            >
              {tab === 'stocks' ? 'Stocks' : 'Inventory (Bahan & Alat)'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="pb-4">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder={`Cari ${activeTab === 'stocks' ? 'nama produk...' : 'bahan & alat...'}`} 
          />
        </div>
      </div>

      <StatCards data={currentData} />

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            {activeTab === 'stocks' ? 'STOCKS' : 'INTERNAL'}
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic text-left">Status stok berubah otomatis sesuai kuantitas riil.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl border border-gray-200 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm group cursor-pointer"
          >
            <History size={16} className="text-blue-600 group-hover:rotate-[-45deg] transition-transform" />
            Log Penerimaan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">Synchronizing Stock Levels...</p>
          </div>
        ) : currentData.length > 0 ? (
          activeTab === 'stocks' ? (
            <StockTable data={currentData} onEdit={handleEdit} onRefresh={fetchAllStocks} />
          ) : (
            <InventoryTable data={currentData} onEdit={handleEdit} onRefresh={fetchAllStocks} />
          )
        ) : (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <Database size={40} className="text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">
              {searchQuery ? `Hasil pencarian "${searchQuery}" tidak ditemukan` : "Belum ada data di database."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInventory;