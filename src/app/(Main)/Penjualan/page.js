'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, Search, TrendingUp, ShoppingBag, 
    Users, DollarSign, MoreVertical,
    ChevronRight, Loader2, Trash2, CheckCircle, Printer,
    AlertCircle
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
            if (res.ok) {
                setSalesData(data);
            }
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
        const isConfirmed = confirm(`PERINGATAN: Hapus transaksi ${id} secara permanen?\nData akan hilang selamanya.`);
        if (isConfirmed) {
            try {
                const res = await fetch(`/api/penjualan?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchSales();
                    setActiveMenu(null);
                }
            } catch (error) {
                alert("Terjadi kesalahan koneksi");
            }
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        const confirmMsg = newStatus === 'CANCELLED' 
            ? `Batalkan pesanan ${id}? Stok akan otomatis dikembalikan ke gudang.`
            : `Selesaikan pesanan ${id}?`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/penjualan`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            
            if (res.ok) {
                fetchSales();
                setActiveMenu(null);
                setIsDetailModalOpen(false);
            } else {
                const err = await res.json();
                alert(err.message || "Gagal memperbarui status");
            }
        } catch (error) {
            console.error("Gagal update status:", error);
        }
    };

    const handlePrint = (item) => {
        alert(`Mencetak Invoice: ${item.id}`);
    };

    const handleOpenDetail = (sale) => {
        setSelectedSale(sale);
        setIsDetailModalOpen(true);
    };

    const totalRevenue = salesData
        .filter(item => item.status === 'COMPLETED')
        .reduce((acc, curr) => acc + curr.total, 0);
        
    const completedOrders = salesData.filter(item => item.status === 'COMPLETED').length;
    const pendingOrders = salesData.filter(item => item.status === 'PENDING').length;

    const stats = [
        { label: 'Revenue (Selesai)', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-blue-500' },
        { label: 'Pesanan Selesai', value: completedOrders.toString(), icon: CheckCircle, color: 'bg-[#8da070]' },
        { label: 'Pending Payment', value: pendingOrders.toString(), icon: AlertCircle, color: 'bg-orange-500' },
        { label: 'Total Transaksi', value: salesData.length.toString(), icon: ShoppingBag, color: 'bg-purple-500' },
    ];

    const filteredSales = salesData.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Manajemen Penjualan</h1>
                    <p className="text-sm text-gray-500 font-medium">Monitoring transaksi dan stok otomatis Keboen Bapak</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#8da070]/20"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Input Penjualan Baru</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.color} p-3 rounded-2xl text-white`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real Time</span>
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</h3>
                        <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari ID Invoice atau Pelanggan..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-[#8da070]/20 transition-all font-medium"
                        />
                    </div>
                    <button onClick={fetchSales} className="w-full md:w-auto px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">
                        Refresh Data
                    </button>
                </div>

                <div className="overflow-x-auto min-h-[450px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-3">
                            <Loader2 className="animate-spin text-[#8da070]" size={40} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Database...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Nilai</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSales.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-black text-sm text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{item.customer}</div>
                                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                {new Date(item.createdAt).toLocaleDateString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900 text-right">
                                            Rp {item.total.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                                item.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                                'bg-orange-100 text-orange-600'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 relative">
                                                <button 
                                                    onClick={() => handleOpenDetail(item)}
                                                    className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-[#8da070] transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenu(activeMenu === item.id ? null : item.id);
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${activeMenu === item.id ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {activeMenu === item.id && (
                                                        <div ref={menuRef} className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in duration-150">
                                                            {item.status === 'PENDING' && (
                                                                <button onClick={() => handleStatusUpdate(item.id, 'COMPLETED')} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-green-50 hover:text-green-600 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                    <CheckCircle size={16} /> Tandai Selesai
                                                                </button>
                                                            )}
                                                            
                                                            {item.status === 'PENDING' && (
                                                                <button onClick={() => handleStatusUpdate(item.id, 'CANCELLED')} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-red-50 hover:text-red-500 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                    <AlertCircle size={16} /> Batalkan Pesanan
                                                                </button>
                                                            )}

                                                            <button onClick={() => handlePrint(item)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                <Printer size={16} className="text-blue-500" /> Cetak Invoice
                                                            </button>
                                                            
                                                            <div className="h-px bg-gray-50 my-1 mx-2" />
                                                            
                                                            <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase tracking-wider transition-colors">
                                                                <Trash2 size={16} /> Hapus Transaksi
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
                    )}
                </div>
            </div>

            <SaleDetail 
                isOpen={isDetailModalOpen}
                sale={selectedSale}
                onClose={() => setIsDetailModalOpen(false)}
                onStatusUpdate={handleStatusUpdate}
            />

            <AddSale
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onRefresh={fetchSales} 
            />
        </div>
    );
};

export default SalesPage;