'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { 
    Plus, Search, FileText, Loader2, RefreshCw, 
    ArrowUpCircle, ArrowDownCircle, Receipt, Eye, Trash2 
} from 'lucide-react';
import AddFinance from '@/app/(Main)/Finance/AddFinance';
import FinanceDetail from '@/app/(Main)/Finance/FinanceDetail';
import FinanceStats from './FinanceStats';
import Pagination from '@/app/(Main)/Components/Pagination';

const FinancePage = () => {
    const [data, setData] = useState({ transactions: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const handleDelete = async (id) => {
        if (!confirm('Hapus transaksi secara permanen?')) return;
        try {
            const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
            if (res.ok) { fetchFinanceData(); setActiveMenu(null); }
        } catch (error) { alert("Gagal menghapus"); }
    };

    const filteredTransactions = data.transactions.filter(trx => 
        trx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.trxNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="text-left">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Keuangan & Kas</h1>
                    <p className="text-sm text-gray-500 font-medium italic">Pantau arus kas masuk dan keluar operasional</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest">
                        <FileText size={16} /> Laporan PDF
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#8da070] text-white px-6 py-3 rounded-2xl font-black hover:bg-[#7a8c61] transition-all shadow-lg shadow-[#8da070]/20 text-[10px] uppercase tracking-widest">
                        <Plus size={18} strokeWidth={3} /> Catat Trx
                    </button>
                </div>
            </div>

            <FinanceStats summary={data.summary} />

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-10 flex flex-col">
                <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-black text-gray-900 uppercase text-xs tracking-widest italic">Riwayat Transaksi</h2>
                        <button onClick={fetchFinanceData} className="p-2 text-gray-400 hover:text-[#8da070] transition-colors">
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari trx no, kategori..." 
                            className="pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black w-full focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner" 
                            value={searchTerm} 
                            onChange={handleSearchChange} 
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-[#8da070]" size={32} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat data Keuangan...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Kategori & Tanggal</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Keterangan</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-right">Jumlah</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 block md:table-row-group">
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((trx) => {
                                        const isIncome = trx.type === 'INCOME';
                                        return (
                                            <tr key={trx.id} className="hover:bg-gray-50/30 transition-colors group block md:table-row border-b md:border-none">
                                                <td className="px-6 md:px-8 py-5 block md:table-cell">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            {isIncome ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 leading-none mb-1">{trx.category}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                                {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 md:px-8 py-2 md:py-5 text-sm font-bold text-gray-600 block md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span className="md:hidden text-[9px] uppercase text-gray-400 font-black">Keterangan:</span>
                                                        <span className="truncate max-w-[200px]">{trx.description || '-'}</span>
                                                        <p className="text-[11px] text-[#8da070] font-black mt-1 uppercase italic tracking-tighter">{trx.trxNo}</p>
                                                    </div>
                                                </td>

                                                <td className={`px-6 md:px-8 py-2 md:py-5 text-sm font-black text-left md:text-right block md:table-cell ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                    <div className="flex flex-col md:block">
                                                        <span className="md:hidden text-[9px] uppercase text-gray-400 font-black">Jumlah:</span>
                                                        {isIncome ? '+' : '-'} Rp {Math.abs(trx.amount).toLocaleString('id-ID')}
                                                    </div>
                                                </td>

                                                <td className="px-6 md:px-8 py-5 text-center relative block md:table-cell">
                                                    <div className="flex items-center justify-between md:justify-center gap-2 relative">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setActiveMenu(activeMenu === trx.id ? null : trx.id); 
                                                            }}
                                                            className={`p-2 w-full md:w-auto flex justify-center items-center rounded-xl transition-all border ${activeMenu === trx.id ? 'bg-[#8da070] text-white' : 'bg-white text-gray-400 shadow-sm border-gray-100 hover:border-[#8da070]'}`}
                                                        >
                                                            <Receipt size={18} />
                                                            <span className="md:hidden ml-2 font-black text-[10px] uppercase">Opsi Transaksi</span>
                                                        </button>

                                                        {activeMenu === trx.id && (
                                                            <div ref={menuRef} className="absolute right-6 md:right-12 top-0 md:top-1/2 -translate-y-1/2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
                                                                <button 
                                                                    onClick={() => { setSelectedTrx(trx); setIsDetailOpen(true); setActiveMenu(null); }} 
                                                                    className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50 flex items-center gap-3 uppercase tracking-wider"
                                                                >
                                                                    <Eye size={16} className="text-blue-500" /> Detail
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(trx.id)} 
                                                                    className="w-full text-left px-4 py-2.5 text-[11px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase tracking-wider"
                                                                >
                                                                    <Trash2 size={16} /> Hapus
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-32 text-center font-black text-gray-300 uppercase tracking-[0.3em] text-[10px] italic">
                                            Database Kosong / Tidak Ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredTransactions.length > 0 && (
                    <div className="border-t border-gray-50">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                setActiveMenu(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                )}
            </div>

            <AddFinance isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchFinanceData} />
            <FinanceDetail isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} trx={selectedTrx} />
        </div>
    );
};

export default memo(FinancePage);