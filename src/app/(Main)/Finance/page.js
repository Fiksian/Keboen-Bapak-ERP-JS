'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    Wallet, ArrowUpCircle, ArrowDownCircle, 
    Plus, Search, Calendar, 
    FileText, Loader2,
    TrendingUp, TrendingDown, Receipt,
    Eye, Printer, Trash2
} from 'lucide-react';
import AddFinance from '@/app/(Main)/Finance/AddFinance';
import FinanceDetail from '@/app/(Main)/Finance/FinanceDetail';

const FinancePage = () => {
    const [data, setData] = useState({ transactions: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance');
            const result = await res.json();
            if (res.ok) setData(result);
        } catch (error) {
            console.error("FAILED_TO_FETCH_FINANCE:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenDetail = (trx) => {
        setSelectedTrx(trx);
        setIsDetailOpen(true);
        setActiveMenu(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus transaksi secara permanen?')) return;
        try {
            const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchFinanceData();
                setActiveMenu(null);
            }
        } catch (error) {
            alert("Gagal menghapus");
        }
    };

    const filteredTransactions = data.transactions.filter(trx => 
        trx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.trxNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Keuangan & Kas</h1>
                    <p className="text-sm text-gray-500 font-medium">Pantau arus kas masuk dan keluar operasional</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all text-xs uppercase"><FileText size={18} /><span>Laporan PDF</span></button>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#8da070] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#7a8c61] transition-all shadow-lg shadow-[#8da070]/20 text-xs uppercase"><Plus size={20} strokeWidth={3} /><span>Catat Transaksi</span></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Saldo', value: data.summary.totalBalance, icon: Wallet, color: 'text-gray-900', bg: 'bg-gray-100' },
                    { label: 'Pemasukan', value: data.summary.totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pengeluaran', value: data.summary.totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' }
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                        <div className="flex items-center gap-4">
                            <div className={`${item.bg} ${item.color} p-4 rounded-2xl`}><item.icon size={24} /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
                                <p className={`text-xl font-black ${item.color}`}>Rp {item.value?.toLocaleString('id-ID') || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="font-black text-gray-900 uppercase text-xs tracking-widest italic">Riwayat Transaksi</h2>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Cari transaksi..." className="pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl border-none text-xs font-bold w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="animate-spin text-[#8da070]" size={32} /><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat data...</p></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori & Tanggal</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${trx.type === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {trx.type === 'INCOME' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{trx.category}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(trx.date).toLocaleDateString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                            {trx.description || '-'}
                                            <p className="text-[11px] text-[#8da070] font-black mt-1 uppercase italic tracking-tighter">{trx.trxNo}</p>
                                        </td>
                                        <td className={`px-8 py-5 text-sm font-black text-right ${trx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {trx.type === 'INCOME' ? '+' : '-'} Rp {Math.abs(trx.amount).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-8 py-5 text-center relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === trx.id ? null : trx.id); }}
                                                className={`p-2 rounded-xl transition-all border ${activeMenu === trx.id ? 'bg-[#8da070] text-white' : 'bg-white text-gray-400 shadow-sm border-gray-100'}`}
                                            >
                                                <Receipt size={18} />
                                            </button>

                                            {activeMenu === trx.id && (
                                                <div ref={menuRef} className="absolute right-12 top-1/2 -translate-y-1/2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
                                                    <button onClick={() => handleOpenDetail(trx)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50 flex items-center gap-3 uppercase tracking-wider"><Eye size={16} className="text-blue-500" /> Detail</button>
                                                    <button onClick={() => handleDelete(trx.id)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase tracking-wider"><Trash2 size={16} /> Hapus</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AddFinance 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchFinanceData} />
            
            <FinanceDetail 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
                trx={selectedTrx} 
            />
        </div>
    );
};

export default FinancePage;