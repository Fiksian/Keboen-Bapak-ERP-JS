'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';
import AddFinance from '@/app/(Main)/Finance/AddFinance';
import FinanceDetail from '@/app/(Main)/Finance/FinanceDetail';
import FinanceStats from './FinanceStats';
import FinanceTable from './FinanceTable';

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

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="text-left">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Keuangan & Kas</h1>
                    <p className="text-sm text-gray-500 font-medium italic">Pantau arus kas masuk dan keluar operasional</p>
                </div>
                <div className="flex flex-col xs:flex-row gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl font-black hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest"><FileText size={16} /> Laporan PDF</button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#8da070] text-white px-6 py-3 rounded-2xl font-black hover:bg-[#7a8c61] transition-all shadow-lg shadow-[#8da070]/20 text-[10px] uppercase tracking-widest"><Plus size={18} strokeWidth={3} /> Catat Trx</button>
                </div>
            </div>

            <FinanceStats summary={data.summary} />

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-10">
                <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="font-black text-gray-900 uppercase text-xs tracking-widest italic text-center lg:text-left">Riwayat Transaksi</h2>
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Cari trx no, kategori..." className="pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border-none text-[11px] font-black w-full focus:ring-2 focus:ring-[#8da070]/20 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="animate-spin text-[#8da070]" size={32} /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Memuat data Keuangan...</p></div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 hidden md:table-header-group">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori & Tanggal</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 block md:table-row-group">
                                {filteredTransactions.map((trx) => (
                                    <FinanceTable
                                        key={trx.id} 
                                        trx={trx} 
                                        activeMenu={activeMenu} 
                                        setActiveMenu={setActiveMenu} 
                                        onOpenDetail={(t) => { setSelectedTrx(t); setIsDetailOpen(true); setActiveMenu(null); }}
                                        onDelete={handleDelete}
                                        menuRef={menuRef}
                                    />
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr><td colSpan="4" className="py-20 text-center font-black text-gray-300 uppercase tracking-[0.3em] text-xs">Data Kosong</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AddFinance isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchFinanceData} />
            <FinanceDetail isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} trx={selectedTrx} />
        </div>
    );
};

export default FinancePage;