'use client'

import React, { useState, useEffect } from 'react';
import { Database, Loader2, History, Package, Box } from 'lucide-react';
import StatCards from './StatCard';
import StockTable from './StockTable';
import EditStock from './EditStock';
import SearchInput from '@/app/(Main)/Components/SeachInput'; 

const StockInventory = () => {
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [allData, setAllData] = useState([]);
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

  useEffect(() => { 
    fetchAllStocks(); 
  }, []);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredData = allData.filter(item => {
    const matchesTab = item.type?.toLowerCase() === activeTab.toLowerCase();
    const query = searchQuery.toLowerCase();
    const itemName = (item.name || item.item || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const matchesSearch = itemName.includes(query) || category.includes(query);
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      <EditStock 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-gray-200">
        <div className="flex overflow-x-auto no-scrollbar gap-6 md:gap-8 scroll-smooth">
          {[
            { id: 'stocks', label: 'Finished Goods', icon: <Package size={14} /> },
            { id: 'inventory', label: 'Bahan & Alat', icon: <Box size={14} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }} 
              className={`pb-4 text-[10px] md:text-sm font-black transition-all relative capitalize tracking-widest flex items-center gap-2 shrink-0 ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 cursor-pointer hover:text-gray-600'
              }`}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.3)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <StatCards data={filteredData} />

      <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="text-left">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tighter md:tracking-tight">
            {activeTab === 'stocks' ? 'STOCK MANAGEMENT' : 'INTERNAL LOGISTICS'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest italic leading-none">
              Real-time DB Sync Active
            </p>
          </div>
        </div>
        <div className="pb-4 w-full xl:w-72">
          <SearchInput 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder={`Search ${activeTab === 'stocks' ? 'products...' : 'logistics...'}`} 
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-16 md:p-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300" size={16} />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] md:text-[10px] italic">Accessing database records...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <StockTable 
            data={filteredData} 
            onEdit={handleEdit} 
            onRefresh={fetchAllStocks} 
            type={activeTab === 'stocks' ? 'stock' : 'inventory'}
          />
        ) : (
          <div className="p-16 md:p-24 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
              <Database size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] md:text-[10px] italic max-w-[200px]">
              {searchQuery ? `No results for "${searchQuery}"` : "Database is currently empty."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInventory;