'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
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
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Catat Transaksi</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Input Arus Kas Baru</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 border border-red-100">
                            <AlertCircle size={18} />
                            <p className="text-xs font-bold uppercase">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tipe</label>
                                <select 
                                    className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="EXPENSE">PENGELUARAN (OUT)</option>
                                    <option value="INCOME">PEMASUKAN (IN)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Metode</label>
                                <select 
                                    className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20"
                                    value={formData.method}
                                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                                >
                                    <option value="CASH">TUNAI / CASH</option>
                                    <option value="TRANSFER">TRANSFER BANK</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Kategori</label>
                            <select 
                                className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Operasional">Operasional</option>
                                <option value="Gaji">Gaji / Upah</option>
                                <option value="Pakan">Pakan Ternak</option>
                                <option value="Penjualan">Penjualan</option>
                                <option value="Lainnya">Lain-lain</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Jumlah (Rp)</label>
                            <input 
                                type="number"
                                required
                                placeholder="0"
                                className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3 text-lg font-black focus:ring-2 focus:ring-[#8da070]/20 placeholder:text-slate-400"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Keterangan</label>
                            <textarea 
                                rows="3"
                                className="w-full text-slate-600 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#8da070]/20"
                                placeholder="Contoh: Pembelian bibit jagung..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#8da070] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#7a8c61] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan Transaksi
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTransactionModal;