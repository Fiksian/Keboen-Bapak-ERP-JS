'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, BookOpen, Filter, RefreshCcw } from 'lucide-react';
import AddPurchasing from './AddPurchasing';
import PrintPO from '@/app/(Main)/Components/Purchasing/PrintPo';
import PurchasingStats from './PurchasingStats';
import PurchasingTable from './PurchasingTable';
import SearchInput from '@/app/(Main)/Components/SeachInput'; 

const Purchasing = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchasing');
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/purchasing/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchRequests();
      else alert("Gagal memperbarui status.");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const deletePurchasing = async (id) => {
    if (!confirm("Hapus pengajuan PO ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/purchasing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Gagal menghapus"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handlePrint = (po) => {
    const dataWithReceipt = {
      ...po,
      suratJalan: po.receipts?.[0]?.suratJalan,
      vehicleNo: po.receipts?.[0]?.vehicleNo,
    };
    setSelectedPO(dataWithReceipt);
    setTimeout(() => { 
      window.print(); 
      setSelectedPO(null);
    }, 200);
  };

  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    return (
      (req.noPO || "").toLowerCase().includes(query) || 
      (req.supplier || "").toLowerCase().includes(query) || 
      (req.item || "").toLowerCase().includes(query) ||
      (req.requestedBy || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {selectedPO && <PrintPO data={selectedPO} />}

      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 text-gray-800 print:hidden">
        
        <AddPurchasing 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAdd={fetchRequests} 
        />

        <PurchasingStats requests={requests} />

        <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 transition-all overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 hidden sm:flex">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
                  Procurement Ledger
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-gray-400 text-[10px] md:text-[11px] font-bold uppercase tracking-widest italic">
                    Real-time PO Tracking System
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:min-w-[300px]">
                <SearchInput 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Find PO, Supplier, or Items..." 
                />
              </div>

              <button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center justify-center gap-2.5 px-6 py-4 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 transition-all font-black text-[11px] uppercase tracking-widest italic active:scale-95 group"
              >
                <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                <span>Create New PO</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all">
          
          <div className="p-5 md:p-7 flex flex-row justify-between items-center border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                <Filter size={14} className="text-blue-500" />
                <h3 className="font-black text-slate-600 text-[11px] md:text-xs uppercase tracking-tighter italic">
                  PO Entries
                </h3>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase">
                  <Loader2 className="animate-spin" size={14} />
                  <span className="hidden sm:inline">Syncing...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                onClick={fetchRequests}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors md:hidden"
               >
                 <RefreshCcw size={16} />
               </button>
               <div className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                {filteredRequests.length} Records
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto custom-scrollbar">
            <PurchasingTable 
              data={filteredRequests} 
              onStatusUpdate={handleStatusUpdate} 
              onDelete={deletePurchasing} 
              onPrint={handlePrint} 
            />
          </div>

          {!loading && filteredRequests.length === 0 && (
            <div className="p-16 md:p-32 text-center flex flex-col items-center justify-center bg-white">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl opacity-50" />
                <div className="relative bg-gray-50 p-8 rounded-full border border-gray-100">
                  <BookOpen size={48} className="text-gray-200" />
                </div>
              </div>
              <h4 className="text-gray-800 font-black uppercase italic text-sm mb-2">No Records Found</h4>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] max-w-[240px] leading-relaxed">
                {searchQuery 
                  ? `Search for "${searchQuery}" returned zero results.` 
                  : "Start by creating your first purchase order entry."
                }
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-blue-600 font-black text-[10px] uppercase underline underline-offset-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchasing;