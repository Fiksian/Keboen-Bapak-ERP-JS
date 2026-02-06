'use client';

import React, { useState } from 'react';
import { X, User, Building2, Save, Loader2, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

const AddContact = ({ isOpen, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'CUSTOMER',
        email: '',
        phone: '',
        address: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setFormData({ name: '', type: 'CUSTOMER', email: '', phone: '', address: '' });
                onRefresh();
                onClose();
            } else {
                const error = await res.json();
                alert(error.message || "Gagal menyimpan kontak");
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-all overflow-y-auto">
            <div className="absolute inset-0 hidden sm:block" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 text-left">
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Tambah Kontak</h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Database Relasi Keboen Bapak</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-gray-100 active:scale-90"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 overflow-y-auto text-left">
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Kategori Kontak</label>
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'CUSTOMER' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 ${
                                    formData.type === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <User size={16} />
                                CUSTOMER
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'SUPPLIER' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 ${
                                    formData.type === 'SUPPLIER' ? 'bg-white text-[#8da070] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Building2 size={16} />
                                SUPPLIER
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Nama Lengkap / Instansi</label>
                        <input
                            required
                            type="text"
                            placeholder="Masukkan nama..."
                            className="w-full text-slate-700 px-5 py-3.5 md:py-4 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all placeholder:text-gray-300 shadow-inner"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="email"
                                    placeholder="Alamat email..."
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all placeholder:text-gray-300 shadow-inner"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">No. Telepon</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="0812..."
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all placeholder:text-gray-300 shadow-inner"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Alamat Lengkap</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-gray-300" size={16} />
                            <textarea
                                rows="3"
                                placeholder="Tuliskan alamat lengkap..."
                                className="w-full text-slate-700 pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all resize-none placeholder:text-gray-300 shadow-inner"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] shadow-lg shadow-[#8da070]/20 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan Kontak
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContact;