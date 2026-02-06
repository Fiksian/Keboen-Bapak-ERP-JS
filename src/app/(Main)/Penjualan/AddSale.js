'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, Tag, ShoppingCart } from 'lucide-react';

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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                
                <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#8da070] p-2 rounded-xl text-white hidden sm:block">
                            <ShoppingCart size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight uppercase italic">Input Penjualan</h2>
                            <p className="text-[9px] font-bold text-[#8da070] uppercase tracking-[0.2em]">Keboen Bapak System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white border border-gray-100 rounded-xl transition-all active:scale-90 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8da070]"></span>
                                Pilih Pelanggan
                            </label>
                            <select 
                                required
                                className="w-full text-slate-700 px-4 py-4 md:py-3 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#8da070]/20 focus:bg-white focus:ring-0 text-sm font-bold transition-all appearance-none"
                                value={formData.customerId}
                                onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                            >
                                <option value="">Cari nama customer...</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Belanjaan</label>
                            <span className="text-[10px] font-black text-[#8da070] bg-[#8da070]/10 px-2 py-0.5 rounded-lg">
                                {formData.items.length} Item
                            </span>
                        </div>
                        
                        <div className="space-y-3">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 p-4 md:p-3 rounded-[24px] relative border border-gray-100">
                                    <div className="flex-1">
                                        <select 
                                            required
                                            className="w-full text-slate-700 bg-white md:bg-transparent border-none text-sm font-black focus:ring-0 rounded-xl md:rounded-none px-3 py-2 md:p-0"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                        >
                                            <option value="">Pilih Produk...</option>
                                            {stocks.map(s => (
                                                <option key={s.id} value={s.name}>{s.name} (Stok: {s.stock} {s.unit})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="flex-1 md:w-20 bg-white rounded-xl border border-gray-100 overflow-hidden flex items-center">
                                            <input 
                                                type="number" 
                                                placeholder="Qty"
                                                min="1"
                                                className="w-full text-slate-700 bg-transparent border-none text-sm font-black focus:ring-0 text-center py-2"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#8da070]/10 text-[#8da070] rounded-xl shrink-0">
                                            <Tag size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">
                                                {item.unit || '---'}
                                            </span>
                                        </div>

                                        <div className="flex-[1.5] md:w-32 bg-white rounded-xl border border-gray-100 flex items-center px-3">
                                            <span className="text-[10px] font-bold text-gray-400 mr-1">Rp</span>
                                            <input 
                                                type="number" 
                                                placeholder="Harga"
                                                className="w-full text-slate-700 bg-transparent border-none text-sm font-black focus:ring-0 text-right py-2"
                                                value={item.price}
                                                onChange={(e) => updateItem(index, 'price', e.target.value)}
                                            />
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-2 text-[#8da070] text-[10px] font-black uppercase tracking-[0.2em] py-4 bg-gray-50 hover:bg-[#8da070]/5 rounded-[24px] transition-all border-2 border-dashed border-[#8da070]/20 w-full justify-center active:scale-95"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Tambah Baris
                        </button>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="bg-gray-900 p-6 rounded-[24px] shadow-lg shadow-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Tagihan</p>
                            <div className="flex justify-between items-end">
                                <p className="text-3xl font-black text-white italic tracking-tighter">
                                    <span className="text-sm font-normal text-gray-500 mr-2 not-italic">Rp</span>
                                    {calculateTotal().toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="order-2 sm:order-1 flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit"
                                disabled={loading || formData.items.length === 0}
                                className="order-1 sm:order-2 flex-[2] flex items-center justify-center gap-2 px-10 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] shadow-xl shadow-[#8da070]/30 transition-all disabled:opacity-50 active:scale-95"
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