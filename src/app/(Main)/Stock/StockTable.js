'use client';

import React, { useState, memo } from 'react';
import { Package, Database, Trash2, ChevronDown, Layers, Warehouse as WarehouseIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Pagination from '@/app/(Main)/Components/Pagination';
import BatchDetailModal from './BatchDetailModal';

const StockTable = ({ data = [], onEdit, onRefresh, type = 'stock', warehouses = [] }) => {
  const { data: session } = useSession();
  const [unitPreferences, setUnitPreferences] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [batchModal, setBatchModal] = useState({ open: false, item: null, warehouseId: null });
  const itemsPerPage = 6;

  const canDelete = ["SuperAdmin"].includes(session?.user?.role);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

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
                <th className="px-8 py-6">Produk / Material</th>
                <th className="px-6 py-6">Kategori</th>
                <th className="px-6 py-6 text-center">Warehouse</th>
                <th className="px-6 py-6 text-center">Stok Tersedia</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-6 py-6 text-center">Batch FIFO</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.length > 0 ? currentData.map((item) => {
                const { options } = getExtendedConversion(item.stock, item.unit);
                const currentStatus = getDerivedStatus(item);
                const userPrefKey = unitPreferences[item.id] || 'default';
                const displayData = options[userPrefKey] || options.default;
                const warehouseName = getWarehouseName(item.warehouseId);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                          currentStatus === 'EMPTY'
                            ? 'bg-rose-50 text-rose-300 border-rose-100'
                            : 'bg-white text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 shadow-sm'
                        }`}>
                          {type === 'stock' ? <Package size={18} /> : <Database size={18} />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-slate-800 uppercase tracking-tight block truncate">{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                            DB: {formatNumber(item.stock)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                        {item.category || "General"}
                      </span>
                    </td>

                    {/* ── WAREHOUSE COLUMN ─────────────────────────────── */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                        <WarehouseIcon size={14} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">
                          {warehouseName}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-xl font-black italic tracking-tighter ${
                          currentStatus === 'READY' ? 'text-indigo-600' :
                          currentStatus === 'LIMITED' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {formatNumber(displayData.val)}
                        </span>
                        <div className="relative mt-1.5">
                          <select
                            value={userPrefKey}
                            onChange={(e) => handleUnitChange(item.id, e.target.value)}
                            className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black px-4 py-1.5 pr-7 rounded-full cursor-pointer uppercase transition-all outline-none border border-transparent focus:border-slate-300"
                          >
                            {Object.entries(options).map(([key, opt]) => (
                              <option key={key} value={key}>{opt.label} ({opt.unit})</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(currentStatus)}`}>
                        {currentStatus}
                      </span>
                    </td>

                    {/* ── Batch FIFO column ──────────────────────────────── */}
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openBatchModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-500 rounded-xl text-[9px] font-black uppercase transition-all active:scale-95 group/btn"
                      >
                        <Layers size={12} className="shrink-0" />
                        <span>Lihat Batch</span>
                      </button>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {canDelete && (
                          <button onClick={() => deleteItem(item.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors active:scale-90">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
          {currentData.length > 0 ? currentData.map((item) => {
            const { options } = getExtendedConversion(item.stock, item.unit);
            const currentStatus = getDerivedStatus(item);
            const userPrefKey = unitPreferences[item.id] || 'default';
            const displayData = options[userPrefKey] || options.default;
            const warehouseName = getWarehouseName(item.warehouseId);

            return (
              <div key={item.id} className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(currentStatus)}`}>
                      {type === 'stock' ? <Package size={22} /> : <Database size={22} />}
                    </div>
                    <div className="flex-1">
                      <span className="font-black text-slate-800 uppercase text-[14px] tracking-tight block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase italic">Base: {item.stock} {item.unit}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border uppercase shrink-0 ${getStatusStyle(currentStatus)}`}>
                    {currentStatus}
                  </span>
                </div>

                {/* ── WAREHOUSE INFO (Mobile) ──────────────────────────── */}
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  <WarehouseIcon size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Lokasi Penyimpanan</p>
                    <p className="text-[12px] font-black text-blue-900">{warehouseName}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">Stok Saat Ini</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black italic tracking-tighter ${currentStatus === 'READY' ? 'text-indigo-600' : 'text-amber-500'}`}>
                        {formatNumber(displayData.val)}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{displayData.unit}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={userPrefKey}
                      onChange={(e) => handleUnitChange(item.id, e.target.value)}
                      className="appearance-none bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-4 py-2.5 pr-9 rounded-xl cursor-pointer uppercase shadow-sm outline-none"
                    >
                      {Object.entries(options).map(([key, opt]) => (
                        <option key={key} value={key}>{opt.unit}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* Batch detail button */}
                  <button
                    onClick={() => openBatchModal(item)}
                    className="flex-1 py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <Layers size={16} /> Lihat Batch FIFO
                  </button>
                  {canDelete && (
                    <button onClick={() => deleteItem(item.id)}
                      className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-90">
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center text-slate-300 italic uppercase text-[10px] font-black tracking-widest">
              Database Kosong
            </div>
          )}
        </div>

        {data.length > 0 && (
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