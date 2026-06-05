'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Package, RefreshCw, Plus, Edit3, 
  Warehouse, LayoutGrid, ChevronDown, ShieldAlert, Loader2 
} from 'lucide-react';
import StockTable from './StockTable';
import EditStock from './EditStock';
import SearchInput from '@/app/(Main)/Components/SeachInput';
import AddStockModal from './AddStock';
import { usePermission } from '@/lib/usePermission';
import withPermission from '@/lib/withPermission';

const StockInventoryContent = () => {
  const { data: session } = useSession();
  const { hasPermission, isSuperAdmin, loading: permissionLoading, userRole } = usePermission();
  
  const [activeWarehouse, setActiveWarehouse] = useState('ALL');
  const [allData, setAllData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const canAccessStock = isSuperAdmin || hasPermission('warehouse');
  const canAddStock = isSuperAdmin || hasPermission('warehouse'); 
  const canEditStock = isSuperAdmin || hasPermission('warehouse');
  const canDeleteStock = isSuperAdmin || hasPermission('warehouse');

  const fetchData = useCallback(async () => {
    if (!canAccessStock) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [stockRes, warehouseRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/warehouse')
      ]);

      if (!stockRes.ok || !warehouseRes.ok) throw new Error('Gagal mengambil data');

      const [stockData, warehouseData] = await Promise.all([
        stockRes.json(),
        warehouseRes.json()
      ]);

      setAllData(stockData);
      setWarehouses(warehouseData);
    } catch (error) {
      console.error("Error Fetching:", error.message);
    } finally {
      setLoading(false);
    }
  }, [canAccessStock]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleEdit = (item) => {
    if (!canEditStock) {
      alert("Anda tidak memiliki izin untuk mengedit stok");
      return;
    }
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const filteredData = allData.filter(item => {
    const matchesWarehouse = activeWarehouse === 'ALL' || item.warehouseId === activeWarehouse;
    const query = searchQuery.toLowerCase().trim();
    const itemName = (item.name || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const matchesSearch = !query || itemName.includes(query) || category.includes(query);
    return matchesWarehouse && matchesSearch;
  });

  const currentWarehouseName = activeWarehouse === 'ALL' 
    ? 'All Warehouses' 
    : warehouses.find(w => w.id === activeWarehouse)?.name || 'Unknown Warehouse';

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!canAccessStock) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] p-8 text-center max-w-md shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase italic mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-500">
            Anda tidak memiliki izin untuk mengakses modul <span className="font-bold text-red-500">Stock Inventory</span>.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">
              Role Anda: <span className="font-mono font-bold text-gray-600">{userRole || 'Tidak terdeteksi'}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">
            Hubungi Administrator untuk mendapatkan akses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8f9fa] min-h-screen space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8 text-left">
      
      <EditStock 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedItem(null);
        }} 
        fetchAllStocks={fetchData}
        itemData={selectedItem}
      />

      {canAddStock && (
        <AddStockModal 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          onAdd={fetchData} 
          warehouses={warehouses}
        />
      )}

      <div className="bg-white rounded-[24px] md:rounded-[40px] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="text-left flex-1">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[20px]">
              <Package size={28} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
                Stock Inventory
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] italic">
                  {filteredData.length} Records • {currentWarehouseName}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isSuperAdmin && (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                     SUPERADMIN
                  </span>
                )}
                {userRole === 'Admin' && !isSuperAdmin && (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                     ADMIN
                  </span>
                )}
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                  Stock: {canEditStock ? 'Read/Write' : 'Read Only'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
          <div className="relative w-full sm:w-64 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 z-10 pointer-events-none">
              {activeWarehouse === 'ALL' ? <LayoutGrid size={18} /> : <Warehouse size={18} />}
            </div>
            <select 
              value={activeWarehouse}
              onChange={(e) => setActiveWarehouse(e.target.value)}
              className="w-full pl-11 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-[20px] text-[11px] font-black uppercase tracking-widest appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer outline-none text-gray-700"
            >
              <option value="ALL">ALL WAREHOUSES</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-500 transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>

          <div className="w-full sm:w-72">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search items..." 
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {canAddStock && (
              <button 
                onClick={() => setIsAddOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-[20px] text-[11px] font-black uppercase italic transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Plus size={16} strokeWidth={3} /> <span className="hidden md:inline">Add</span>
              </button>
            )}
            
            {!canAddStock && canAccessStock && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-[20px] text-[10px] font-bold text-gray-500">
                <ShieldAlert size={14} />
                Read Only
              </div>
            )}
            
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-4 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[20px] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden transition-all">
        {loading ? (
          <div className="p-32 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="w-20 h-20 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-200" size={24} />
            </div>
            <p className="text-slate-800 font-black uppercase tracking-[0.3em] text-[10px] italic">Synchronizing Warehouse Data</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <StockTable 
              data={filteredData} 
              warehouses={warehouses}
              onEdit={canEditStock ? handleEdit : undefined}
              onRefresh={fetchData} 
              isAdmin={canEditStock || canDeleteStock}
              canEdit={canEditStock}
              canDelete={canDeleteStock}
            />
          </div>
        ) : (
          <div className="p-32 text-center flex flex-col items-center">
             <div className="p-6 bg-slate-50 rounded-[32px] mb-6">
                <Warehouse size={48} className="text-slate-200" />
             </div>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] italic">
              No Items stored in {currentWarehouseName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withPermission(StockInventoryContent, 'warehouse');