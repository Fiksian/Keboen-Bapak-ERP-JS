'use client'

import React, { useState, useEffect } from 'react';
import { Factory, Plus, MoreVertical, Loader2, CheckCircle2, XCircle, AlertCircle, Calendar, Hash, Target } from 'lucide-react';
import AddProduction from './AddProduction';

const ProductionModule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productionOrders, setProductionOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight italic uppercase">
            <Factory className="text-indigo-600 shrink-0" strokeWidth={2.5} size={24} /> 
            Manufacturing Log
          </h1>
          <p className="text-slate-500 text-[11px] md:text-sm font-medium italic">Kontrol batch produksi dan monitoring output real-time.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 md:py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> NEW ORDER
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 italic">Batch ID</th>
                <th className="px-6 py-4 italic">Product Name</th>
                <th className="px-6 py-4 text-center italic">Target Qty</th>
                <th className="px-6 py-4 italic text-center">Status</th>
                <th className="px-8 py-4 text-right italic">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 block md:table-row-group">
              {isLoading ? (
                <tr className="block md:table-row">
                  <td colSpan="5" className="px-6 py-20 text-center block md:table-cell">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] italic">
                      <Loader2 className="animate-spin text-indigo-500" size={32} /> LOADING DATABASE...
                    </div>
                  </td>
                </tr>
              ) : productionOrders.length > 0 ? (
                productionOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group block md:table-row p-5 md:p-0">
                    
                    <td className="md:px-8 md:py-5 block md:table-cell mb-2 md:mb-0">
                      <div className="flex justify-between items-center md:block">
                        <span className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Batch ID</span>
                        <div className="flex items-center gap-2 bg-indigo-50 md:bg-transparent px-2 py-1 md:p-0 rounded-lg">
                           <Hash size={12} className="text-indigo-400 md:hidden" />
                           <span className="font-mono text-xs text-indigo-600 font-black">{order.noBatch}</span>
                        </div>
                      </div>
                    </td>

                    <td className="md:px-6 md:py-5 block md:table-cell mb-4 md:mb-0">
                      <div className="flex justify-between items-end md:block">
                        <div>
                          <div className="font-black text-slate-700 uppercase text-sm italic tracking-tight leading-none">{order.productName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`md:hidden px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>

                    <td className="md:px-6 md:py-5 block md:table-cell text-center mb-4 md:mb-0">
                      <div className="flex justify-between items-center md:flex-col md:justify-center border-t border-dashed border-slate-100 md:border-none pt-3 md:pt-0">
                        <span className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                          <Target size={10} /> Target Produksi
                        </span>
                        <div>
                          <span className="font-black text-slate-800 text-sm md:text-base">{order.targetQty}</span>
                          <span className="ml-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest">{order.targetUnit || 'UNIT'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 hidden md:table-cell text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="md:px-8 md:py-5 block md:table-cell text-right border-t md:border-none pt-4 md:pt-0">
                      <div className="flex justify-between items-center md:justify-end gap-3">
                        <span className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Kontrol Produksi</span>
                        
                        {order.status === 'IN_PROGRESS' ? (
                          <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED', order.targetQty)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-2 bg-emerald-50 md:bg-white text-emerald-500 hover:bg-emerald-100 md:hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100 active:scale-95"
                            >
                              <CheckCircle2 size={18} />
                              <span className="md:hidden text-[10px] font-black uppercase tracking-wider">Finish</span>
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 md:p-2 bg-rose-50 md:bg-white text-rose-500 hover:bg-rose-100 md:hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-100 active:scale-95"
                            >
                              <XCircle size={18} />
                              <span className="md:hidden text-[10px] font-black uppercase tracking-wider">Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Archived</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="block md:table-row">
                  <td colSpan="5" className="px-6 py-20 text-center block md:table-cell">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Factory size={48} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Belum ada antrian produksi</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddProduction isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
};

export default ProductionModule;