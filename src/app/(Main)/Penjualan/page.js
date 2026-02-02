'use client';

import React, { useState } from 'react';
import { 
    Plus, Search, Filter, 
    Download, TrendingUp, ShoppingBag, 
    Users, DollarSign, MoreVertical,
    ChevronRight
} from 'lucide-react';

const SalesPage = () => {
    const [salesData] = useState([
        { id: 'INV-001', customer: 'Budi Santoso', date: '2024-05-20', total: 1500000, status: 'Completed' },
        { id: 'INV-002', customer: 'Sari Rahayu', date: '2024-05-21', total: 750000, status: 'Pending' },
        { id: 'INV-003', customer: 'Toko Berkah', date: '2024-05-21', total: 4200000, status: 'Completed' },
        { id: 'INV-004', customer: 'Andi Wijaya', date: '2024-05-22', total: 320000, status: 'Cancelled' },
        { id: 'INV-005', customer: 'Koperasi Hijau', date: '2024-05-22', total: 1250000, status: 'Completed' },
    ]);

    const stats = [
        { label: 'Total Penjualan', value: 'Rp 12.5M', icon: DollarSign, color: 'bg-blue-500' },
        { label: 'Pesanan Baru', value: '48', icon: ShoppingBag, color: 'bg-[#8da070]' },
        { label: 'Pelanggan Aktif', value: '1,250', icon: Users, color: 'bg-purple-500' },
        { label: 'Pertumbuhan', value: '+12.5%', icon: TrendingUp, color: 'bg-orange-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Penjualan</h1>
                    <p className="text-sm text-gray-500 font-medium">Pantau dan kelola seluruh transaksi Keboen Bapak</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#8da070]/20">
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
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Data</span>
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</h3>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
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
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-[#8da070]/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                            <Filter size={18} />
                            Filter
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                            {salesData.map((item) => (
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
                                            item.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                                            item.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
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
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50/30 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400">Menampilkan 5 dari 120 transaksi</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all">Previous</button>
                        <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-900 hover:bg-gray-50 transition-all shadow-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPage;