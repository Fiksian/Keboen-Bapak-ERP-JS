'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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

  const fetchRequests = async () => {
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
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
        alert("Data PO berhasil dihapus.");
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
    setTimeout(() => { window.print(); }, 150);
  };

  const filteredRequests = requests.filter(req => {
    const query = searchQuery.toLowerCase();
    const noPO = (req.noPO || "").toLowerCase();
    const supplier = (req.supplier || "").toLowerCase();
    const item = (req.item || "").toLowerCase();
    const requester = (req.requestedBy || "").toLowerCase();

    return noPO.includes(query) || 
           supplier.includes(query) || 
           item.includes(query) ||
           requester.includes(query);
  });

  return (
    <div className="min-h-full">
      <PrintPO data={selectedPO} />

      <div className="p-6 bg-[#f8f9fa] space-y-8 text-gray-800 print:hidden text-left">
        <AddPurchasing isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={fetchRequests} />

        <PurchasingStats requests={requests} />

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center overflow-hidden">
          <div className="text-left shrink-0 mr-12">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">
              Procurement Ledger
            </h2>
            <p className="text-gray-400 text-[11px] mt-1 font-bold uppercase tracking-tight italic">
              PO Management System
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full flex-1 justify-between">
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-200 transition-all font-bold text-xs uppercase tracking-tighter italic cursor-pointer whitespace-nowrap w-full md:w-auto"
            >
              <Plus size={16} strokeWidth={3} />
              Create New PO
            </button>

            <div className="w-full max-w-md">
              <SearchInput 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Cari Barang" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden text-left">
          <div className="p-8 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-600 text-lg uppercase tracking-tighter italic">Purchasing Order</h3>
              {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
            </div>
          </div>

          <PurchasingTable 
            data={filteredRequests} 
            onStatusUpdate={handleStatusUpdate} 
            onDelete={deletePurchasing} 
            onPrint={handlePrint} 
          />

          {!loading && filteredRequests.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">
                {searchQuery ? `No matches found for "${searchQuery}"` : "Database is empty."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchasing;