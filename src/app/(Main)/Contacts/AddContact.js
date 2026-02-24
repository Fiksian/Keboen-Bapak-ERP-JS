'use client';

import React, { useState } from 'react';
import { X, User, Building2, Save, Loader2, Mail, Phone, MapPin, CreditCard, Briefcase } from 'lucide-react';

const AddContact = ({ isOpen, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [isCompany, setIsCompany] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',      
        companyName: '',
        nik: '',
        type: 'CUSTOMER',
        email: '',
        phone: '',
        address: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isCompany && !formData.nik) {
            alert("NIK wajib diisi untuk pendaftaran perorangan");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setFormData({ name: '', companyName: '', nik: '', type: 'CUSTOMER', email: '', phone: '', address: '' });
                setIsCompany(false);
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm transition-all overflow-y-auto text-left">
            <div className="absolute inset-0 hidden sm:block" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div>
                        <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Tambah Kontak</h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Database Relasi Keboen Bapak</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-red-500 border border-transparent hover:border-gray-100">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 overflow-y-auto">
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Kategori Relasi</label>
                        <div className="flex p-1.5 bg-gray-100 rounded-2xl gap-1">
                            {['CUSTOMER', 'SUPPLIER'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${
                                        formData.type === t 
                                        ? 'bg-white text-[#8da070] shadow-sm' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Jenis Entitas</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    className="w-4 h-4 accent-[#8da070]" 
                                    checked={!isCompany} 
                                    onChange={() => {
                                        setIsCompany(false);
                                        setFormData({...formData, companyName: ''});
                                    }}
                                />
                                <span className={`text-xs font-bold ${!isCompany ? 'text-gray-900' : 'text-gray-400'}`}>Perorangan</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    className="w-4 h-4 accent-[#8da070]" 
                                    checked={isCompany} 
                                    onChange={() => setIsCompany(true)}
                                />
                                <span className={`text-xs font-bold ${isCompany ? 'text-gray-900' : 'text-gray-400'}`}>Instansi / PT</span>
                            </label>
                        </div>
                    </div>

                    {isCompany && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Nama Instansi/Perusahaan</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Contoh: PT. Alam Makmur"
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">
                                {isCompany ? 'Nama PIC (Person in Charge)' : 'Nama Lengkap'}
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Masukkan nama..."
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">
                                NIK (KTP) {!isCompany && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    required={!isCompany}
                                    type="text"
                                    maxLength={16}
                                    placeholder={!isCompany ? "Wajib 16 digit..." : "Opsional..."}
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner"
                                    value={formData.nik}
                                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="email"
                                    placeholder="email@contoh.com"
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner"
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
                                    className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all shadow-inner"
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
                                rows="2"
                                placeholder="Tuliskan alamat..."
                                className="w-full text-slate-700 pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-[#8da070]/20 transition-all resize-none shadow-inner"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                        <button type="button" onClick={onClose} className="w-full sm:flex-1 px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-[#8da070] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#7a8c61] shadow-lg shadow-[#8da070]/20 transition-all disabled:opacity-50"
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