'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Database, Package, Search, RefreshCw, Plus, Lock, Edit3 } from 'lucide-react';
import StockTable from './StockTable';
import EditStock from './EditStock';
import SearchInput from '@/app/(Main)/Components/SeachInput';
import AddStockModal from './AddStock'; 

const StockInventory = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'ADMIN';

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
    setIsEditOpen(true);
  };

  const filteredData = allData.filter(item => {
    const matchesTab = (item.type || 'stocks').toLowerCase() === activeTab.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesTab;

    const itemName = (item.name || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    
    return matchesTab && (itemName.includes(query) || category.includes(query));
  });

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      
      <EditStock 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedItem(null);
        }} 
        fetchAllStocks={fetchAllStocks}
        itemData={selectedItem}
      />

      {isAdmin && (
        <AddStockModal 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          onAdd={fetchAllStocks} 
        />
      )}

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
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest italic leading-none">
                  {allData.length} Items Total • {isAdmin ? 'Full Access' : 'Staff Mode (Edit Only)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          {isAdmin ? (
            <button 
              onClick={() => setIsAddOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase italic transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> Add Stock
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase italic border border-amber-100">
              <Edit3 size={14} /> Admin Access
            </div>
          )}

          <div className="w-full sm:w-72">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search data..." 
            />
          </div>
          
          <button 
            onClick={fetchAllStocks}
            disabled={loading}
            className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden transition-all">
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-800 font-black uppercase tracking-widest text-[11px] italic">Synchronizing Records</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <StockTable 
              data={filteredData} 
              onEdit={handleEdit}
              onRefresh={fetchAllStocks} 
              type={activeTab}
              isAdmin={isAdmin} 
            />
          </div>
        ) : (
          <div className="p-24 text-center">
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest italic">No Records Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockInventory;