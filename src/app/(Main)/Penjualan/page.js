'use client';

import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, 
    Download, TrendingUp, ShoppingBag, 
    Users, DollarSign, MoreVertical,
    ChevronRight, Loader2
} from 'lucide-react';

const SalesPage = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
    }, []);

    const totalRevenue = salesData.reduce((acc, curr) => acc + curr.total, 0);
    const completedOrders = salesData.filter(item => item.status === 'COMPLETED').length;

    const stats = [
        { label: 'Total Penjualan', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-blue-500' },
        { label: 'Pesanan Selesai', value: completedOrders.toString(), icon: ShoppingBag, color: 'bg-[#8da070]' },
        { label: 'Total Transaksi', value: salesData.length.toString(), icon: Users, color: 'bg-purple-500' },
        { label: 'Rata-rata Order', value: `Rp ${(totalRevenue / (salesData.length || 1)).toLocaleString('id-ID')}`, icon: TrendingUp, color: 'bg-orange-500' },
    ];

    const filteredSales = salesData.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight text-uppercase">Manajemen Penjualan</h1>
                    <p className="text-sm text-gray-500 font-medium">Pantau dan kelola seluruh transaksi Keboen Bapak</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#8da070]/20">
                    <Plus size={20} strokeWidth={3} />
                    <span>Input Penjualan Baru</span>
                </button>
            </div>

            {/* Stats Grid */}
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
                            placeholder="Cari invoice atau pelanggan..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-[#8da070]/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={fetchSales} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                            Refresh
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-[#8da070]" size={40} />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Memuat Data...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Nilai</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSales.length > 0 ? (
                                    filteredSales.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-gray-900">{item.id}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.customer}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">{item.date}</td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-900">
                                                Rp {item.total.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                                                    item.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 hover:text-[#8da070] transition-all">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                    <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-gray-400 hover:text-gray-600 transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">
                                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Tidak ada data penjualan</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 bg-gray-50/30 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400">Menampilkan {filteredSales.length} transaksi</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all shadow-sm">Previous</button>
                        <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-900 hover:bg-gray-50 transition-all shadow-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPage;