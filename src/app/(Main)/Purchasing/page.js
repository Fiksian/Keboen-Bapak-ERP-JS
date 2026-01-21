'use client'

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Wallet, Clock, 
  Plus, Loader2, RotateCcw, PackageCheck, 
  Trash2, Building2, Hash, CalendarDays, User, ShieldCheck, Truck, Printer
} from 'lucide-react';
import AddPurchasing from './AddPurchasing';
import PrintPO from '@/app/(Main)/Components/Purchasing/PrintPo';

const Purchasing = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

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
      alert("Koneksi gagal.");
    }
  };

  const handlePrint = (po) => {
    setSelectedPO(po);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const totalRequests = requests?.length || 0;
  const totalApproved = requests?.filter(r => r?.status === 'APPROVED' && !r.isReceived).length || 0;
  const totalPending = requests?.filter(r => r?.status === 'PENDING').length || 0;
  const totalReceived = requests?.filter(r => r?.isReceived).length || 0;
  
  const totalCostValue = requests?.reduce((acc, curr) => {
    if (curr?.status !== 'APPROVED') return acc;
    const qtyNum = parseFloat(curr.qty?.split(' ')[0]) || 0;
    const unitPrice = parseInt(curr.amount) || 0;
    return acc + (qtyNum * unitPrice);
  }, 0) || 0;

  const purchasingStats = [
    { title: "TOTAL PO", value: totalRequests.toString(), trend: "Semua pengajuan", icon: <ShoppingCart className="text-blue-500" size={20} />, bgIcon: "bg-blue-50" },
    { title: "APPROVED VALUE", value: totalCostValue.toLocaleString('id-ID'), trend: "Nilai PO disetujui", icon: <Wallet className="text-purple-500" size={20} />, bgIcon: "bg-purple-50" },
    { title: "WAITING", value: totalPending.toString(), trend: "Butuh persetujuan", icon: <Clock className="text-orange-500" size={20} />, bgIcon: "bg-orange-50" },
    { title: "RECEIVED", value: totalReceived.toString(), trend: "Sudah di gudang", icon: <PackageCheck className="text-green-500" size={20} />, bgIcon: "bg-green-50" }
  ];

  return (
    <div className="min-h-full">
      {/* 1. AREA CETAK: Hanya muncul saat diprint */}
      <PrintPO data={selectedPO} />

      {/* 2. AREA UI: Disembunyikan total saat diprint */}
      <div className="p-6 bg-[#f8f9fa] space-y-8 text-gray-800 print:hidden">
        
        <AddPurchasing isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={fetchRequests} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {purchasingStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-start group hover:shadow-md transition-all">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                  {stat.title.includes('VALUE') ? `Rp ${stat.value}` : stat.value}
                </h3>
                <p className={`text-[10px] font-bold ${stat.value !== '0' && stat.title === 'WAITING' ? 'text-orange-500' : 'text-green-500'}`}>
                  {stat.trend}
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bgIcon}`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Hero Banner */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Procurement Ledger</h2>
            <p className="text-gray-400 text-sm mt-1 font-medium italic">Manajemen pengadaan barang berdasarkan Purchase Order (PO).</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-200 transition-all font-bold text-sm uppercase tracking-tighter italic">
            <Plus size={18} strokeWidth={3} />
            Create New Purchase Order
          </button>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
            <h3 className="font-bold text-gray-700 text-lg uppercase tracking-tighter italic">PO Tracking System</h3>
            {loading && <Loader2 className="animate-spin text-blue-600" size={20} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-6">PO & Timeline</th>
                  <th className="px-6 py-6">Item Specification</th>
                  <th className="px-6 py-6 text-center">Stakeholders Traceability</th>
                  <th className="px-6 py-6 text-center">Subtotal</th>
                  <th className="px-8 py-6 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.length > 0 ? requests.map((req) => {
                  const qtyNum = parseFloat(req.qty?.split(' ')[0]) || 0;
                  const unitPrice = parseInt(req.amount) || 0;
                  const totalRow = qtyNum * unitPrice;
                  const dateCreated = new Date(req.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  });

                  return (
                    <tr key={req.id} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-black text-blue-600 text-[11px] italic tracking-tight uppercase bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                            <Hash size={12} /> {req.noPO || "TANPA-REF"}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-gray-800 text-[11px] uppercase mt-0.5">
                            <Building2 size={12} className="text-gray-400" /> {req.supplier || "Supplier Umum"}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold italic mt-1">
                            <CalendarDays size={11} /> {dateCreated}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-800 uppercase text-xs">{req.item}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-black">{req.qty}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                              req.type === 'STOCKS' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-purple-600 border-purple-100 bg-purple-50'
                            }`}>
                              {req.type || 'STOCKS'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                            <User size={10} className="text-blue-500" />
                            <span className="uppercase truncate">REQ: {req.requestedBy}</span>
                          </div>
                          {req.status !== 'PENDING' && (
                            <div className={`flex items-center gap-2 text-[9px] font-bold px-2 py-1 rounded-lg border ${
                              req.status === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                            }`}>
                              <ShieldCheck size={10} />
                              <span className="uppercase truncate">
                                {req.status === 'APPROVED' ? 'ACC: ' : 'REJ: '}
                                {req.approvedBy || "Admin"}
                              </span>
                            </div>
                          )}
                          {req.isReceived && (
                            <div className="flex items-center gap-2 text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg shadow-sm">
                              <Truck size={10} />
                              <span className="uppercase truncate italic">REC: {req.receivedBy || "Gudang"}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-6 text-center">
                        <span className="text-xs font-black text-gray-800 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          Rp {totalRow.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {req.status === 'APPROVED' && (
                            <button 
                              onClick={() => handlePrint(req)}
                              className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 cursor-pointer"
                              title="Print PO/STTB"
                            >
                              <Printer size={18} />
                            </button>
                          )}

                          {req.isReceived ? (
                            <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase italic">
                              <PackageCheck size={14} /> IN WAREHOUSE
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {req.status === 'APPROVED' ? (
                                <button 
                                  onClick={() => handleStatusUpdate(req.id, 'PENDING')}
                                  className="px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all text-[9px] font-black border border-orange-100 uppercase italic cursor-pointer"
                                >
                                  <RotateCcw size={13} /> REVOKE
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black rounded-xl transition-all shadow-sm uppercase italic"
                                  >
                                    APPROVE
                                  </button>
                                  <button 
                                    onClick={() => handleStatusUpdate(req.id, req.status === 'REJECTED' ? 'PENDING' : 'REJECTED')}
                                    className={`px-4 py-2 text-[9px] font-black rounded-xl transition-all border uppercase italic cursor-pointer ${
                                      req.status === 'REJECTED' ? 'bg-gray-100 text-gray-600' : 'bg-white text-red-500 border-red-100 hover:bg-red-50'
                                    }`}
                                  >
                                    {req.status === 'REJECTED' ? 'UNDO' : 'REJECT'}
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => deletePurchasing(req.id)}
                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">No procurement records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;