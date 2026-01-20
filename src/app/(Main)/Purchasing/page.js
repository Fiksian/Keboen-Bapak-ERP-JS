'use client'

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Wallet, Clock, 
  CheckCircle2, Plus, Loader2, RotateCcw, PackageCheck, Tag, Layers,
  Trash2
} from 'lucide-react';
import AddPurchasing from './AddPurchasing';

const Purchasing = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      if (res.ok) {
        fetchRequests();
      } else {
        alert("Gagal memperbarui status.");
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const deletePurchasing = async (id) => {
    if (!confirm("Hapus pengajuan ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/purchasing/${id}`, { method: 'DELETE' });

      if (res.ok) {
        alert("Item berhasil dihapus.");
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Gagal menghapus"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Koneksi gagal.");
    }
  };

  // --- LOGIKA STATISTIK DINAMIS ---
  const totalRequests = requests?.length || 0;
  const totalApproved = requests?.filter(r => r?.status === 'APPROVED').length || 0;
  const totalPending = requests?.filter(r => r?.status === 'PENDING').length || 0;
  
  const totalCostValue = requests?.reduce((acc, curr) => {
    if (curr?.status !== 'APPROVED') return acc;
    const qtyNum = parseFloat(curr.qty.split(' ')[0]) || 0;
    const unitPrice = parseInt(curr.amount) || 0;
    return acc + (qtyNum * unitPrice);
  }, 0) || 0;

  const purchasingStats = [
    { title: "TOTAL REQUEST", value: totalRequests.toString(), trend: "Semua pengajuan", icon: <ShoppingCart className="text-blue-500" size={20} />, bgIcon: "bg-blue-50" },
    { title: "APPROVED COST", value: totalCostValue.toLocaleString('id-ID'), trend: "Estimasi total biaya", icon: <Wallet className="text-purple-500" size={20} />, bgIcon: "bg-purple-50" },
    { title: "PENDING", value: totalPending.toString(), trend: "Butuh atensi", icon: <Clock className="text-orange-500" size={20} />, bgIcon: "bg-orange-50" },
    { title: "APPROVED", value: totalApproved.toString(), trend: "Siap diterima di gudang", icon: <CheckCircle2 className="text-green-500" size={20} />, bgIcon: "bg-green-50" }
  ];

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8 animate-in fade-in duration-500 text-gray-800">
      
      <AddPurchasing isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={fetchRequests} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {purchasingStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-start group hover:shadow-md transition-all">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                {stat.title.includes('COST') ? `Rp ${stat.value}` : stat.value}
              </h3>
              <p className={`text-[10px] font-bold ${stat.value !== '0' && stat.title === 'PENDING' ? 'text-orange-500' : 'text-green-500'}`}>
                {stat.trend}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bgIcon} transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Hero Banner */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">PROCUREMENT CONTROL</h2>
          <p className="text-gray-400 text-sm mt-1 font-medium italic">Manajemen persetujuan belanja sebelum barang masuk ke inventory.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-bold text-sm cursor-pointer">
          <Plus size={18} strokeWidth={3} />
          Create Request
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-gray-50">
          <h3 className="font-bold text-gray-700 text-lg uppercase tracking-tighter">Inventory Procurement Log</h3>
          {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">Item & Category</th>
                <th className="px-6 py-6 text-center">Type</th>
                <th className="px-6 py-6 text-center">Unit Price</th>
                <th className="px-6 py-6 text-center">Total Estimated</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Approval Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.length > 0 ? requests.map((req) => {
                const qtyNum = parseFloat(req.qty.split(' ')[0]) || 0;
                const unitPrice = parseInt(req.amount) || 0;
                const totalRow = qtyNum * unitPrice;

                return (
                  <tr key={req.id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 uppercase">{req.item}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">{req.qty}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">By: {req.requestedBy}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 mx-auto w-fit border ${
                        req.type === 'STOCKS' ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-purple-600 border-purple-100 bg-purple-50'
                      }`}>
                        {req.type === 'STOCKS' ? <Tag size={10}/> : <Layers size={10}/>}
                        {req.type || 'STOCKS'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm text-gray-800 font-bold text-center">
                      Rp {unitPrice.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800">Rp {totalRow.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] text-gray-400 font-bold italic">{new Date(req.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${
                        req.status === 'PENDING' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                        req.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-red-50 text-red-500 border-red-100'
                      }`}>
                        {req.isReceived ? "IN WAREHOUSE" : req.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        
                        {req.isReceived ? (
                          <div className="flex items-center gap-1 text-blue-600 font-black text-[10px] bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                            <PackageCheck size={14} />
                            DITERIMA GUDANG
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {req.status === 'APPROVED' ? (
                              <button 
                                onClick={() => handleStatusUpdate(req.id, 'PENDING')}
                                className="flex items-center gap-2 px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all cursor-pointer text-[10px] font-black border border-orange-100"
                                title="Kembalikan ke Pending"
                              >
                                <RotateCcw size={14} />
                                REVOKE
                              </button>
                            ) : (
                              <>
                                {req.status !== 'REJECTED' && (
                                  <button 
                                    onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-sm"
                                  >
                                    APPROVE
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleStatusUpdate(req.id, req.status === 'PENDING' ? 'REJECTED' : 'PENDING')}
                                  className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all cursor-pointer border ${
                                    req.status === 'PENDING' ? 'bg-white text-red-500 border-red-100 hover:bg-red-50' : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}
                                >
                                  {req.status === 'PENDING' ? 'REJECT' : 'UNDO REJECT'}
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* TOMBOL DELETE TETAP DI LUAR */}
                        {!req.isReceived && (
                          <button 
                            onClick={() => deletePurchasing(req.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">No procurement records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;