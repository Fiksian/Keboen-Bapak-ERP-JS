'use client';

import React, { useState, useEffect } from 'react';
import { 
    UserPlus, Search, Filter, 
    Mail, Phone, MapPin, 
    Building2, User, ChevronRight,
    MoreHorizontal, Globe, ArrowUpRight,
    Loader2
} from 'lucide-react';

const ContactsPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Fungsi untuk mengambil data dari API
    const fetchContacts = async () => {
        try {
            setLoading(true);
            // Kita mengirimkan activeTab sebagai query parameter 'type'
            const res = await fetch(`/api/contacts?type=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Gagal mengambil data kontak:", error);
        } finally {
            setLoading(false);
        }
    };

    // Jalankan fetch setiap kali tab berubah
    useEffect(() => {
        fetchContacts();
    }, [activeTab]);

    // Filter data di sisi client untuk pencarian nama/email
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            {/* Header Section */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Buku Kontak</h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola data Pelanggan dan Vendor dalam satu tempat</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#8da070]/20">
                    <UserPlus size={20} strokeWidth={3} />
                    <span>Tambah Kontak</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 p-2 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex p-1 bg-gray-50 rounded-2xl w-full lg:w-auto">
                    {['all', 'customer', 'supplier'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-white text-[#8da070] shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="relative w-full lg:w-96 px-2 lg:px-0">
                    <Search className="absolute left-6 lg:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari nama, email, atau kota..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 lg:bg-transparent rounded-2xl border-none text-sm focus:ring-2 focus:ring-[#8da070]/20 font-medium transition-all"
                    />
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-[#8da070]" size={48} />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Menghubungkan Database...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                            <div key={contact.id} className="group bg-white rounded-4xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#8da070]/20 transition-all duration-300 relative overflow-hidden">
                                {/* Type Badge */}
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-[0.2em] ${
                                    contact.type === 'Customer' ? 'bg-blue-50 text-blue-500' : 'bg-[#8da070]/10 text-[#8da070]'
                                }`}>
                                    {contact.type}
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#8da070]/10 group-hover:text-[#8da070] transition-colors">
                                        {contact.type === 'Supplier' ? <Building2 size={32} /> : <User size={32} />}
                                    </div>
                                    <div className="pr-16">
                                        <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{contact.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                                            PIC: <span className="text-gray-600">{contact.contactPerson}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                        <Mail size={16} className="text-gray-300" />
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                                        <Phone size={16} className="text-gray-300" />
                                        <span>{contact.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium leading-relaxed">
                                        <MapPin size={16} className="text-gray-300 shrink-0" />
                                        <span>{contact.address}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 border-t border-gray-50 pt-6">
                                    <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all active:scale-95">
                                        <ArrowUpRight size={14} />
                                        Lihat Detail
                                    </button>
                                    <button className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-white rounded-4xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Tidak ada kontak ditemukan</p>
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-[#8da070] text-xs font-bold hover:underline"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContactsPage;