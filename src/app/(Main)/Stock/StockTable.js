'use client';

import React, { useState, memo, useMemo } from 'react';
import { Package, Database, Trash2, ChevronDown, Layers, Warehouse as WarehouseIcon, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Pagination from '@/app/(Main)/Components/Pagination';
import BatchDetailModal from './BatchDetailModal';

const StockTable = ({ data = [], onEdit, onRefresh, type = 'stock', warehouses = [] }) => {
  const { data: session } = useSession();
  const [unitPreferences, setUnitPreferences] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const [batchModal, setBatchModal] = useState({ open: false, item: null, warehouseId: null });
  const itemsPerPage = 6;

  const canDelete = ["SuperAdmin"].includes(session?.user?.role);

  // ─── Group items by name ──────────────────────────────────────────────────
  const groupedData = useMemo(() => {
    const groups = {};
    
    data.forEach(item => {
      const key = item.name.toUpperCase();
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          category: item.category,
          items: [],
          totalStock: 0,
        };
      }
      groups[key].items.push(item);
      groups[key].totalStock += item.stock;
    });

    return Object.values(groups);
  }, [data]);

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroupedData = groupedData.slice(indexOfFirstItem, indexOfLastItem);

  // Helper: Get warehouse name by ID
  const getWarehouseName = (warehouseId) => {
    if (!warehouseId) return "Unknown";
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh?.name || "Unknown";
  };

  const getExtendedConversion = (value, unit) => {
    const amount = parseFloat(value || 0);
    const u = unit?.toUpperCase() || 'UNIT';
    let baseInKg = amount;
    if (u === 'TON') baseInKg = amount * 1000;
    else if (u === 'GRAM' || u === 'GR') baseInKg = amount / 1000;
    else if (u === 'SACKS' || u === 'SAK') baseInKg = amount * 50;
    let baseInLiter = amount;
    if (u === 'ML') baseInLiter = amount / 1000;
    const options = { default: { val: amount, unit: u, label: 'Satuan Asli' } };
    if (['KG', 'TON', 'GRAM', 'GR', 'SACKS', 'SAK'].includes(u)) {
      options.kg = { val: baseInKg, unit: 'KG', label: 'Standar' };
      options.ton = { val: baseInKg / 1000, unit: 'TON', label: 'Besar' };
      if (baseInKg < 1) options.gram = { val: baseInKg * 1000, unit: 'GR', label: 'Kecil (GR)' };
    } else if (['LITER', 'L', 'ML'].includes(u)) {
      options.liter = { val: baseInLiter, unit: 'LITER', label: 'Standar' };
      options.ml = { val: baseInLiter * 1000, unit: 'ML', label: 'Kecil (ML)' };
    }
    return { options, baseInKg, baseInLiter };
  };

  const getDerivedStatus = (item) => {
    const { baseInKg, baseInLiter } = getExtendedConversion(item.stock, item.unit);
    const u = item.unit?.toUpperCase();
    let checkVal = baseInKg;
    if (['LITER', 'L', 'ML'].includes(u)) checkVal = baseInLiter;
    else if (!['KG', 'TON', 'GRAM', 'GR', 'SACKS', 'SAK'].includes(u)) checkVal = item.stock;
    if (checkVal <= 0) return 'EMPTY';
    if (checkVal <= 50) return 'LIMITED';
    return 'READY';
  };

  const getStatusStyle = (status) => ({
    READY: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    LIMITED: 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse',
    EMPTY: 'bg-rose-50 text-rose-600 border-rose-100',
  }[status] || 'bg-slate-50 text-slate-600 border-slate-100');

  const handleUnitChange = (itemId, selectedKey) =>
    setUnitPreferences(prev => ({ ...prev, [itemId]: selectedKey }));

  const formatNumber = (num) => {
    if (num === 0) return "0";
    if (num < 0.1 && num > 0) return num.toFixed(3);
    return parseFloat(num.toFixed(2)).toLocaleString('id-ID');
  };

  const deleteItem = async (id) => {
    if (!canDelete) return alert("Anda tidak memiliki akses untuk menghapus data.");
    if (!confirm("Hapus item secara permanen dari database?")) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const openBatchModal = (item) => {
    setBatchModal({ open: true, item, warehouseId: item.warehouseId || null });
  };

  const toggleExpand = (groupKey) => {
    setExpandedItems(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <>
      {/* Batch Detail Modal */}
      <BatchDetailModal
        isOpen={batchModal.open}
        item={batchModal.item}
        warehouseId={batchModal.warehouseId}
        onClose={() => setBatchModal({ open: false, item: null, warehouseId: null })}
      />

      <div className="w-full flex flex-col">
        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                <th className="px-4 py-6 w-12"></th>
                <th className="px-8 py-6">Produk / Material</th>
                <th className="px-6 py-6">Kategori</th>
                <th className="px-6 py-6 text-center">Total Stok</th>
                <th className="px-6 py-6 text-center">Lokasi</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentGroupedData.length > 0 ? currentGroupedData.map((group, idx) => {
                const groupKey = group.name.toUpperCase();
                const isExpanded = expandedItems[groupKey];
                const { options } = getExtendedConversion(group.totalStock, group.items[0]?.unit);
                const userPrefKey = unitPreferences[groupKey] || 'default';
                const displayData = options[userPrefKey] || options.default;
                
                // Hitung status dari total stok
                const { baseInKg } = getExtendedConversion(group.totalStock, group.items[0]?.unit);
                let statusTot = 'READY';
                if (baseInKg <= 0) statusTot = 'EMPTY';
                else if (baseInKg <= 50) statusTot = 'LIMITED';

                return (
                  <React.Fragment key={groupKey}>
                    {/* Main Row - Clickable anywhere */}
                    <tr 
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (group.items.length > 1) {
                          toggleExpand(groupKey);
                        }
                      }}
                    >
                      <td className="px-4 py-5 text-center">
                        {group.items.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(groupKey);
                            }}
                            className={`p-1 rounded transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600" />
                          </button>
                        )}
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                            statusTot === 'EMPTY'
                              ? 'bg-rose-50 text-rose-300 border-rose-100'
                              : 'bg-white text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 shadow-sm'
                          }`}>
                            {type === 'stock' ? <Package size={18} /> : <Database size={18} />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-slate-800 uppercase tracking-tight block truncate">{group.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                              {group.items.length} warehouse{group.items.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                          {group.category || "General"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-xl font-black italic tracking-tighter ${
                            statusTot === 'READY' ? 'text-indigo-600' :
                            statusTot === 'LIMITED' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {formatNumber(displayData.val)}
                          </span>
                          <div className="relative mt-1.5">
                            <select
                              value={userPrefKey}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUnitChange(groupKey, e.target.value);
                              }}
                              className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black px-4 py-1.5 pr-7 rounded-full cursor-pointer uppercase transition-all outline-none border border-transparent focus:border-slate-300"
                            >
                              {Object.entries(options).map(([key, opt]) => (
                                <option key={key} value={key}>{opt.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                          </div>
                        </div>
                      </td>

                      {/* Lokasi - Show multiple warehouses */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          {group.items.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg">
                              <WarehouseIcon size={12} className="text-blue-500 shrink-0" />
                              <span className="text-[9px] font-black text-blue-700 uppercase">
                                {getWarehouseName(item.warehouseId)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(statusTot)}`}>
                          {statusTot}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Tombol Batch FIFO - untuk single warehouse item */}
                          {group.items.length === 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBatchModal(group.items[0]);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-500 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95"
                            >
                              <Layers size={12} />
                              <span>Batch</span>
                            </button>
                          )}
                          
                          {canDelete && group.items.length > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(group.items[0].id);
                              }}
                              className="p-2 text-slate-300 hover:text-rose-600 transition-colors active:scale-90">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Rows - Detail per warehouse */}
                    {isExpanded && group.items.map((item) => {
                      const itemStatus = getDerivedStatus(item);
                      const { options: itemOptions } = getExtendedConversion(item.stock, item.unit);
                      const itemPrefKey = unitPreferences[item.id] || 'default';
                      const itemDisplay = itemOptions[itemPrefKey] || itemOptions.default;

                      return (
                        <tr key={item.id} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                          <td className="px-4 py-4"></td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3 ml-4">
                              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                              <span className="text-[10px] font-bold text-slate-600">Detail per Warehouse</span>
                            </div>
                          </td>
                          <td className="px-6 py-4"></td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-black text-slate-700 italic">{formatNumber(itemDisplay.val)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-200 rounded-xl">
                              <WarehouseIcon size={14} className="text-blue-600 shrink-0" />
                              <span className="text-[10px] font-black text-blue-800 uppercase">
                                {getWarehouseName(item.warehouseId)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusStyle(itemStatus)}`}>
                              {itemStatus}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBatchModal(item);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-500 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95"
                            >
                              <Layers size={12} />
                              <span>Batch</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="py-32 text-center text-slate-300 italic uppercase text-[10px] font-black tracking-[0.4em]">
                    Database Kosong
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden grid grid-cols-1 gap-4">
          {currentGroupedData.length > 0 ? currentGroupedData.map((group) => {
            const groupKey = group.name.toUpperCase();
            const isExpanded = expandedItems[groupKey];
            const { baseInKg } = getExtendedConversion(group.totalStock, group.items[0]?.unit);
            let statusTot = 'READY';
            if (baseInKg <= 0) statusTot = 'EMPTY';
            else if (baseInKg <= 50) statusTot = 'LIMITED';
            const { options } = getExtendedConversion(group.totalStock, group.items[0]?.unit);
            const userPrefKey = unitPreferences[groupKey] || 'default';
            const displayData = options[userPrefKey] || options.default;

            return (
              <div key={groupKey} className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Main Card - Clickable anywhere */}
                <div 
                  className="p-6 space-y-4 cursor-pointer hover:bg-indigo-50/20 transition-colors"
                  onClick={() => {
                    if (group.items.length > 1) {
                      toggleExpand(groupKey);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(statusTot)}`}>
                        {type === 'stock' ? <Package size={22} /> : <Database size={22} />}
                      </div>
                      <div className="flex-1">
                        <span className="font-black text-slate-800 uppercase text-[14px] tracking-tight block">{group.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase italic">
                          {group.items.length} warehouse{group.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border uppercase shrink-0 ${getStatusStyle(statusTot)}`}>
                      {statusTot}
                    </span>
                  </div>

                  <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter inline-block">
                    {group.category || "General"}
                  </span>

                  {/* Warehouse tags */}
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                        <WarehouseIcon size={12} className="text-blue-500" />
                        <span className="text-[9px] font-black text-blue-700 uppercase">
                          {getWarehouseName(item.warehouseId)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Total Stok</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black italic tracking-tighter ${statusTot === 'READY' ? 'text-indigo-600' : 'text-amber-500'}`}>
                          {formatNumber(displayData.val)}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{displayData.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons untuk single warehouse */}
                  {group.items.length === 1 ? (
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openBatchModal(group.items[0]);
                        }}
                        className="flex-1 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-indigo-500 hover:text-white transition-all"
                      >
                        <Layers size={14} /> Batch FIFO
                      </button>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(group.items[0].id);
                          }}
                          className="px-4 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-[11px] uppercase hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Expand button untuk multiple warehouse */
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(groupKey);
                      }}
                      className={`w-full py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-indigo-500 hover:text-white transition-all ${
                        isExpanded ? 'bg-indigo-500 text-white' : ''
                      }`}
                    >
                      <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      {isExpanded ? 'Sembunyikan' : 'Lihat'} Detail ({group.items.length})
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 space-y-3 p-4">
                    {group.items.map((item) => {
                      const itemStatus = getDerivedStatus(item);
                      const { options: itemOptions } = getExtendedConversion(item.stock, item.unit);
                      const itemPrefKey = unitPreferences[item.id] || 'default';
                      const itemDisplay = itemOptions[itemPrefKey] || itemOptions.default;

                      return (
                        <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl mb-3">
                            <WarehouseIcon size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black text-blue-700 uppercase">
                              {getWarehouseName(item.warehouseId)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Stok</p>
                              <p className={`text-lg font-black italic ${itemStatus === 'READY' ? 'text-indigo-600' : 'text-amber-500'}`}>
                                {formatNumber(itemDisplay.val)} {itemDisplay.unit}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border uppercase ${getStatusStyle(itemStatus)}`}>
                              {itemStatus}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openBatchModal(item)}
                              className="flex-1 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 hover:bg-indigo-500 hover:text-white flex items-center justify-center gap-1"
                            >
                              <Layers size={12} /> Batch
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center text-slate-300 italic uppercase text-[10px] font-black tracking-widest">
              Database Kosong
            </div>
          )}
        </div>

        {groupedData.length > 0 && (
          <div className="mt-8 flex justify-center lg:justify-end">
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
    </>
  );
};

export default memo(StockTable);