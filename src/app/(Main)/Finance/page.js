'use client';

import React, { useState } from 'react';
import { 
    Wallet, ArrowUpCircle, ArrowDownCircle, 
    Plus, Search, Calendar, 
    FileText, PieChart, MoreVertical,
    TrendingUp, TrendingDown, Receipt
} from 'lucide-react';

const FinancePage = () => {
    // Data dummy transaksi keuangan
    const [transactions] = useState([
        { id: 'TRX-101', category: 'Operasional', desc: 'Bayar Listrik Kandang A', date: '2024-05-20', amount: -1250000, type: 'expense' },
        { id: 'TRX-102', category: 'Penjualan', desc: 'Pelunasan Invoice INV-001', date: '2024-05-21', amount: 4500000, type: 'income' },
        { id: 'TRX-103', category: 'Gaji', desc: 'Gaji Staff Kebun - Mei', date: '2024-05-21', amount: -8000000, type: 'expense' },
        { id: 'TRX-104', category: 'Logistik', desc: 'Bensin Kendaraan Operasional', date: '2024-05-22', amount: -350000, type: 'expense' },
        { id: 'TRX-105', category: 'Lainnya', desc: 'Penjualan Pupuk Organik', date: '2024-05-22', amount: 850000, type: 'income' },
    ]);

    const summary = [
        { label: 'Total Saldo', value: 'Rp 45.200.000', icon: Wallet, color: 'text-gray-900', bg: 'bg-gray-100' },
        { label: 'Pemasukan (Mei)', value: 'Rp 12.800.000', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Pengeluaran (Mei)', value: 'Rp 9.600.000', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Keuangan & Kas</h1>
                    <p className="text-sm text-gray-500 font-medium">Pantau arus kas masuk dan keluar operasional</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95">
                        <FileText size={18} />
                        <span>Laporan PDF</span>
                    </button>
                    <button className="flex items-center gap-2 bg-[#8da070] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#7a8c61] transition-all active:scale-95 shadow-lg shadow-[#8da070]/20">
                        <Plus size={20} strokeWidth={3} />
                        <span>Catat Transaksi</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {summary.map((item, index) => (
                    <div key={index} className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className={`${item.bg} ${item.color} p-4 rounded-2xl`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
                                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="font-black text-gray-900 uppercase text-xs tracking-widest">Riwayat Transaksi Terakhir</h2>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" placeholder="Cari transaksi..." className="pl-11 pr-4 py-2 bg-gray-50 rounded-xl border-none text-xs font-medium focus:ring-2 focus:ring-[#8da070]/20 w-full" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500">
                            <Calendar size={16} />
                            Mei 2024
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.map((trx) => (
                                <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${trx.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {trx.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{trx.category}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{trx.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                        {trx.desc}
                                        <p className="text-[10px] font-medium text-gray-300 mt-1">{trx.id}</p>
                                    </td>
                                    <td className={`px-8 py-5 text-sm font-black text-right ${trx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {trx.type === 'income' ? '+' : '-'} Rp {Math.abs(trx.amount).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button className="p-2 hover:bg-white rounded-xl text-gray-300 hover:text-gray-600 transition-all shadow-sm border border-transparent hover:border-gray-100">
                                            <Receipt size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancePage;