'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Database, Loader2, Package, Search, RefreshCw } from 'lucide-react';
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

  const fetchAllStocks = useCallback(async () => {
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
  }, []);

  useEffect(() => { 
    fetchAllStocks(); 
  }, [fetchAllStocks]);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredData = allData.filter(item => {
    const matchesTab = (item.type || 'stocks').toLowerCase() === activeTab.toLowerCase();
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesTab;

    const itemName = (item.name || item.item || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const unit = (item.unit || "").toLowerCase();
    
    const matchesSearch = 
      itemName.includes(query) || 
      category.includes(query) || 
      unit.includes(query);
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      <EditStock 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

      <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="text-left flex-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tighter">
                {activeTab === 'stocks' ? 'STOCK MANAGEMENT' : 'INTERNAL LOGISTICS'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest italic leading-none">
                  {allData.length} Items Total • Real-time Sync
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          <div className="w-full sm:w-72">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder={`Search by name or category...`} 
            />
          </div>
          
          <button 
            onClick={fetchAllStocks}
            disabled={loading}
            className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden transition-all">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300" size={20} />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-black uppercase tracking-widest text-[11px] italic">Synchronizing Records</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">Please wait a moment...</p>
            </div>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <StockTable 
              data={filteredData} 
              onEdit={handleEdit} 
              onRefresh={fetchAllStocks} 
              type={activeTab}
            />
          </div>
        ) : (
          <div className="p-24 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
              {searchQuery ? <Search size={32} className="text-slate-200" /> : <Database size={32} className="text-slate-200" />}
            </div>
            <div className="space-y-2">
              <p className="text-slate-800 font-black uppercase tracking-widest text-[11px] italic">
                {searchQuery ? "No Results Found" : "Empty Database"}
              </p>
              <p className="text-slate-400 text-[10px] font-medium max-w-[250px] mx-auto leading-relaxed">
                {searchQuery 
                  ? `We couldn't find anything matching "${searchQuery}". Try using different keywords.` 
                  : "It seems you haven't added any items yet. Add your first stock to see it here."}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInventory;