'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Search, ShoppingBag, 
    DollarSign, MoreVertical,
    ChevronRight, Loader2, Trash2, CheckCircle, Printer,
    AlertCircle, RefreshCw
} from 'lucide-react';
import AddSale from '@/app/(Main)/Penjualan/AddSale';
import SaleDetail from '@/app/(Main)/Penjualan/SaleDetail';

const SalesPage = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const menuRef = useRef(null);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/penjualan');
            const data = await res.json();
            if (res.ok) setSalesData(data);
        } catch (error) {
            console.error("Gagal mengambil data penjualan:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id) => {
        if (confirm(`Hapus permanen transaksi ${id}?`)) {
            try {
                const res = await fetch(`/api/penjualan?id=${id}`, { method: 'DELETE' });
                if (res.ok) { fetchSales(); setActiveMenu(null); }
            } catch (error) { alert("Kesalahan koneksi"); }
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!confirm(`Update status pesanan ${id}?`)) return;
        try {
            const res = await fetch(`/api/penjualan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (res.ok) { fetchSales(); setActiveMenu(null); setIsDetailModalOpen(false); }
        } catch (error) { console.error("Update error:", error); }
    };

    const handleOpenDetail = (sale) => {
        setSelectedSale(sale);
        setIsDetailModalOpen(true);
    };

    const totalRevenue = salesData
        .filter(item => item.status === 'COMPLETED')
        .reduce((acc, curr) => acc + curr.total, 0);
        
    const stats = [
        { label: 'Revenue', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-blue-500' },
        { label: 'Selesai', value: salesData.filter(i => i.status === 'COMPLETED').length.toString(), icon: CheckCircle, color: 'bg-[#8da070]' },
        { label: 'Pending', value: salesData.filter(i => i.status === 'PENDING').length.toString(), icon: AlertCircle, color: 'bg-orange-500' },
        { label: 'Total', value: salesData.length.toString(), icon: ShoppingBag, color: 'bg-purple-500' },
    ];

    const filteredSales = salesData.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-3 md:p-8 font-sans">
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase italic">Manajemen Penjualan</h1>
                    <p className="text-[11px] md:text-sm text-gray-500 font-medium italic">Monitoring transaksi & stok Keboen Bapak</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#8da070] text-white px-6 py-4 md:py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#8da070]/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Input Penjualan</span>
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2 md:mb-4">
                            <div className={`${stat.color} p-2 md:p-3 rounded-xl md:rounded-2xl text-white`}>
                                <stat.icon size={16} md={20} />
                            </div>
                        </div>
                        <h3 className="text-gray-400 text-[9px] md:text-xs font-black uppercase tracking-wider">{stat.label}</h3>
                        <p className="text-sm md:text-xl font-black text-gray-900 mt-0.5 truncate">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[24px] md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari invoice atau pelanggan..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[12px] md:text-sm focus:ring-2 focus:ring-[#8da070]/20 font-bold placeholder:font-medium"
                        />
                    </div>
                    <button onClick={fetchSales} className="hidden md:flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-[#8da070]" size={32} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Syncing Data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="hidden md:table-header-group bg-gray-50/50">
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">ID Invoice</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Pelanggan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Opsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 block md:table-row-group">
                                    {filteredSales.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/30 transition-colors block md:table-row p-4 md:p-0">
                                            <td className="md:px-6 md:py-4 block md:table-cell mb-2 md:mb-0">
                                                <div className="flex justify-between items-center md:block">
                                                    <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest italic">ID Invoice</span>
                                                    <span className="font-black text-xs md:text-sm text-blue-600 md:text-gray-900 bg-blue-50 md:bg-transparent px-2 py-1 md:p-0 rounded-lg">{item.id}</span>
                                                </div>
                                            </td>

                                            <td className="md:px-6 md:py-4 block md:table-cell mb-4 md:mb-0">
                                                <div className="flex justify-between items-end md:block">
                                                    <div className="flex flex-col">
                                                        <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest italic mb-1">Customer</span>
                                                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{item.customer}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase italic">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                    <span className={`md:hidden px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                                                        item.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                        item.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-orange-50 text-orange-600 border-orange-100'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Total Nilai */}
                                            <td className="md:px-6 md:py-4 block md:table-cell md:text-right mb-4 md:mb-0">
                                                <div className="flex justify-between items-center md:block border-t border-dashed border-gray-100 md:border-none pt-3 md:pt-0">
                                                    <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Total Nilai</span>
                                                    <span className="text-sm font-black text-gray-900 italic">Rp {item.total.toLocaleString('id-ID')}</span>
                                                </div>
                                            </td>

                                            {/* Status (Desktop only) */}
                                            <td className="px-6 py-4 hidden md:table-cell text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                                    item.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                                    'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="md:px-6 md:py-4 block md:table-cell border-t md:border-none pt-4 md:pt-0">
                                                <div className="flex items-center justify-between md:justify-center gap-2 relative">
                                                    <button 
                                                        onClick={() => handleOpenDetail(item)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:p-2 bg-gray-50 md:bg-transparent rounded-xl text-gray-600 md:text-gray-400 hover:text-[#8da070] text-[10px] font-black uppercase tracking-widest md:normal-case md:tracking-normal transition-all"
                                                    >
                                                        <ChevronRight size={18} className="hidden md:block" />
                                                        <span className="md:hidden">Detail Transaksi</span>
                                                    </button>
                                                    
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenu(activeMenu === item.id ? null : item.id);
                                                            }}
                                                            className={`p-3 md:p-2 rounded-xl border border-gray-100 md:border-none transition-all ${activeMenu === item.id ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {activeMenu === item.id && (
                                                            <div ref={menuRef} className="absolute right-0 bottom-full mb-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in slide-in-from-bottom-2 duration-150">
                                                                {item.status === 'PENDING' && (
                                                                    <button onClick={() => handleStatusUpdate(item.id, 'COMPLETED')} className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-600 hover:bg-green-50 hover:text-green-600 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                        <CheckCircle size={16} className="text-green-500" /> Selesaikan
                                                                    </button>
                                                                )}
                                                                <button className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-600 hover:bg-gray-50 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                    <Printer size={16} className="text-blue-500" /> Print Invoice
                                                                </button>
                                                                <div className="h-px bg-gray-50 my-1 mx-2" />
                                                                <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                    <Trash2 size={16} /> Hapus Data
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <SaleDetail isOpen={isDetailModalOpen} sale={selectedSale} onClose={() => setIsDetailModalOpen(false)} onStatusUpdate={handleStatusUpdate} />
            <AddSale isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onRefresh={fetchSales} />
        </div>
    );
};

export default SalesPage;