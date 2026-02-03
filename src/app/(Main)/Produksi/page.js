'use client'

import React, { useState, useEffect } from 'react';
import { Factory, Plus, MoreVertical, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import AddProduction from './AddProduction';

const ProductionModule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productionOrders, setProductionOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); 

  const fetchProductions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/production');
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data produksi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductions();
  }, []);

  const handleSubmit = async (dataFromModal) => {
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataFromModal),
      });

      if (response.ok) {
        await fetchProductions();
        setIsModalOpen(false);
      } else {
        const err = await response.json();
        alert(`Error: ${err.message}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const handleUpdateStatus = async (id, status, actualQty = null) => {
    const confirmMsg = status === 'COMPLETED' 
      ? "Selesaikan produksi dan tambahkan hasil ke stok?" 
      : "Batalkan produksi ini? (Stok bahan baku akan dikembalikan)";
    
    if (!confirm(confirmMsg)) return;

    try {
      const response = await fetch('/api/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status, 
          actualQty: actualQty || undefined,
          notes: status === 'CANCELLED' ? "Dibatalkan oleh user" : "Selesai tepat waktu"
        }),
      });

      if (response.ok) {
        await fetchProductions();
        setActiveMenu(null);
      } else {
        const err = await response.json();
        alert(err.message);
      }
    } catch (error) {
      alert("Gagal memperbarui status.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Factory className="text-indigo-600" strokeWidth={2.5} /> MANUFACTURING LOG
          </h1>
          <p className="text-slate-500 text-sm font-medium">Sistem kendali batch produksi dan monitoring output.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-indigo-100"
        >
          <Plus size={20} strokeWidth={3} /> NEW ORDER
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Batch ID</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4 text-center">Target Qty</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center">
                  <div className="flex justify-center items-center gap-3 text-slate-400 font-bold italic">
                    <Loader2 className="animate-spin text-indigo-500" size={24} /> LOADING DATA...
                  </div>
                </td>
              </tr>
            ) : productionOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5 font-mono text-xs text-indigo-600 font-bold">{order.noBatch}</td>
                <td className="px-6 py-5">
                  <div className="font-bold text-slate-700 uppercase text-sm italic">{order.productName}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="font-black text-slate-600">{order.targetQty}</div>
                  <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{order.targetUnit || 'UNIT'}</div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right relative">
                  {order.status === 'IN_PROGRESS' && (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED', order.targetQty)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors shadow-sm border border-emerald-100"
                        title="Complete Production"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shadow-sm border border-rose-100"
                        title="Cancel/Problem"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                  {order.status !== 'IN_PROGRESS' && (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter italic">Locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddProduction isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
};

export default ProductionModule;