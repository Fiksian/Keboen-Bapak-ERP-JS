'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, Tag } from 'lucide-react';

const AddSalesModal = ({ isOpen, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [stocks, setStocks] = useState([]);
    
    const [formData, setFormData] = useState({
        customerId: '',
        items: [{ name: '', quantity: 1, price: 0, unit: '' }] 
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [resContacts, resStocks] = await Promise.all([
                fetch('/api/contacts?type=CUSTOMER'),
                fetch('/api/stock')
            ]);
            const dataContacts = await resContacts.json();
            const dataStocks = await resStocks.json();
            setContacts(dataContacts);
            setStocks(dataStocks);
        } catch (err) {
            console.error("Gagal memuat data referensi:", err);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, price: 0, unit: '' }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'name') {
            const selectedStock = stocks.find(s => s.name === value);
            if (selectedStock) {
                newItems[index].price = parseFloat(selectedStock.price) || 0;
                newItems[index].unit = selectedStock.unit || 'Unit';
            }
        }
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/penjualan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    totalAmount: calculateTotal()
                })
            });

            if (res.ok) {
                onRefresh();
                onClose();
            } else {
                const error = await res.json();
                alert(error.message || "Gagal menyimpan transaksi");
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">INPUT PENJUALAN</h2>
                        <p className="text-[10px] font-bold text-[#8da070] uppercase tracking-widest">Keboen Bapak Management System</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Pelanggan</label>
                            <select 
                                required
                                className="w-full text-slate-700 px-4 py-3 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20"
                                value={formData.customerId}
                                onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                            >
                                <option value="">Pilih Customer...</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Produk & Satuan</label>
                        </div>
                        
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-2xl relative group">
                                <div className="col-span-12 md:col-span-5">
                                    <select 
                                        required
                                        className="w-full text-slate-700 bg-transparent border-none text-sm font-bold focus:ring-0"
                                        value={item.name}
                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                    >
                                        <option value="">Pilih Produk...</option>
                                        {stocks.map(s => (
                                            <option key={s.id} value={s.name}>{s.name} (Stok: {s.stock} {s.unit})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-4 md:col-span-2 flex items-center bg-white/50 rounded-xl px-2">
                                    <input 
                                        type="number" 
                                        placeholder="Qty"
                                        min="1"
                                        className="w-full text-slate-700 bg-transparent border-none text-sm font-black focus:ring-0 text-center"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>

                                <div className="col-span-4 md:col-span-2">
                                    <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8da070]/10 text-[#8da070] rounded-xl">
                                        <Tag size={12} />
                                        <span className="text-[11px] font-black uppercase tracking-tighter">
                                            {item.unit || '---'}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-span-4 md:col-span-2">
                                    <input 
                                        type="number" 
                                        placeholder="Harga"
                                        className="w-full text-slate-700 bg-transparent border-none text-sm font-black focus:ring-0 text-right"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    />
                                </div>

                                <div className="absolute -right-2 md:relative md:right-0 md:col-span-1 flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-2 text-[#8da070] text-[10px] font-black uppercase tracking-[0.2em] p-3 hover:bg-[#8da070]/5 rounded-2xl transition-all border-2 border-dashed border-[#8da070]/20 w-full justify-center"
                        >
                            <Plus size={14} strokeWidth={3} />
                            Tambah Baris Produk
                        </button>
                    </div>

                    <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="bg-gray-50 px-6 py-3 rounded-2xl w-full md:w-auto">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimasi Tagihan</p>
                            <p className="text-2xl font-black text-gray-900">Rp {calculateTotal().toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 md:flex-none px-8 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                disabled={loading || formData.items.length === 0}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 bg-[#8da070] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#7a8c61] shadow-xl shadow-[#8da070]/30 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Simpan Transaksi
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSalesModal;