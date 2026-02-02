'use client';

import React, { useState } from 'react';
import { X, User, Building2, Save, Loader2, Mail, Phone, MapPin } from 'lucide-react';

const AddContactModal = ({ isOpen, onClose, onRefresh }) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Tambah Kontak Baru</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Database Relasi Keboen Bapak</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Kategori Kontak</label>
                        <div className="flex p-1 bg-gray-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'CUSTOMER' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
                                    formData.type === 'CUSTOMER' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-600'
                                }`}
                            >
                                <User size={16} />
                                CUSTOMER
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'SUPPLIER' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
                                    formData.type === 'SUPPLIER' ? 'bg-white text-[#8da070] shadow-sm' : 'text-gray-600'
                                }`}
                            >
                                <Building2 size={16} />
                                SUPPLIER
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap / Perusahaan</label>
                        <input
                            required
                            type="text"
                            placeholder="Masukkan nama..."
                            className="w-full text-slate-600 px-5 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="email"
                                    placeholder="Alamat email..."
                                    className="w-full text-slate-600 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Telepon</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Contoh: 0812..."
                                    className="w-full text-slate-600 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-gray-300" size={16} />
                            <textarea
                                rows="3"
                                placeholder="Tuliskan alamat lengkap di sini..."
                                className="w-full text-slate-600 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all resize-none"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-[#8da070] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#7a8c61] shadow-lg shadow-[#8da070]/20 transition-all disabled:opacity-50 active:scale-95"
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

export default AddContactModal;