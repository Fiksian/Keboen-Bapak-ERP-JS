'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const AddFinance= ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        category: 'Operasional',
        description: '',
        amount: '',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        method: 'CASH'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/finance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Gagal menyimpan transaksi');

            onSuccess();
            onClose();
            setFormData({
                category: 'Operasional',
                description: '',
                amount: '',
                type: 'EXPENSE',
                date: new Date().toISOString().split('T')[0],
                method: 'CASH'
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm transition-all overflow-y-auto">
            <div className="absolute inset-0 hidden sm:block" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[90vh] flex flex-col">
                
                <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Catat Transaksi</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Input Arus Kas Baru</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                    >
                        <X size={20} className="text-gray-400" strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto">
                    {error && (
                        <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 border border-red-100 animate-pulse">
                            <AlertCircle size={18} />
                            <p className="text-[10px] font-black uppercase">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Tipe</label>
                            <div className="relative">
                                <select 
                                    className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 appearance-none cursor-pointer"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="EXPENSE">PENGELUARAN (OUT)</option>
                                    <option value="INCOME">PEMASUKAN (IN)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Metode</label>
                            <div className="relative">
                                <select 
                                    className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 appearance-none cursor-pointer"
                                    value={formData.method}
                                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                                >
                                    <option value="CASH">TUNAI / CASH</option>
                                    <option value="TRANSFER">TRANSFER BANK</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Kategori</label>
                        <div className="relative">
                            <select 
                                className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Operasional">Operasional</option>
                                <option value="Gaji">Gaji / Upah</option>
                                <option value="Pakan">Pakan Ternak</option>
                                <option value="Penjualan">Penjualan</option>
                                <option value="Lainnya">Lain-lain</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Jumlah (Rp)</label>
                        <input 
                            type="number"
                            required
                            placeholder="0"
                            className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-5 py-4 text-xl font-black focus:ring-2 focus:ring-[#8da070]/20 placeholder:text-slate-300"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Keterangan</label>
                        <textarea 
                            rows="3"
                            className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#8da070]/20 resize-none"
                            placeholder="Contoh: Pembelian bibit jagung..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 pb-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#8da070] text-white py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#7a8c61] transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-[#8da070]/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan Transaksi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFinance;