'use client';

import React, { useState } from 'react';
import { 
    UserPlus, Search, Filter, 
    Mail, Phone, MapPin, 
    Building2, User, ChevronRight,
    MoreHorizontal, Globe, ArrowUpRight
} from 'lucide-react';

const ContactsPage = () => {
    const [activeTab, setActiveTab] = useState('all');

    const [contacts] = useState([
        { id: 1, name: 'PT. Pakan Ternak Jaya', type: 'Supplier', contactPerson: 'Hendra Wahyudi', email: 'sales@pakanjaya.com', phone: '021-555666', address: 'Bekasi, Jawa Barat' },
        { id: 2, name: 'Budi Santoso', type: 'Customer', contactPerson: 'Budi Santoso', email: 'budi.san@gmail.com', phone: '0812-3334-444', address: 'Bandung, Jawa Barat' },
        { id: 3, name: 'CV. Bibit Unggul', type: 'Supplier', contactPerson: 'Sari Rahayu', email: 'info@bibitunggul.co.id', phone: '022-777888', address: 'Subang, Jawa Barat' },
        { id: 4, name: 'Restoran Keboen Enak', type: 'Customer', contactPerson: 'Andi Wijaya', email: 'procurement@keboenenak.com', phone: '0811-9990-111', address: 'Jakarta Selatan' },
        { id: 5, name: 'Toko Berkah Tani', type: 'Customer', contactPerson: 'Hj. Aminah', email: 'berkahtani@outlook.com', phone: '0856-2221-333', address: 'Cianjur, Jawa Barat' },
    ]);

    const filteredContacts = activeTab === 'all' 
        ? contacts 
        : contacts.filter(c => c.type.toLowerCase() === activeTab.toLowerCase());

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Buku Kontak</h1>
                    <p className="text-sm text-gray-500 font-medium">Kelola data Pelanggan dan Vendor dalam satu tempat</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#8da070]/20">
                    <UserPlus size={20} strokeWidth={3} />
                    <span>Tambah Kontak</span>
                </button>
            </div>

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
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 lg:bg-transparent rounded-2xl border-none text-sm focus:ring-2 focus:ring-[#8da070]/20 font-medium transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredContacts.map((contact) => (
                    <div key={contact.id} className="group bg-white rounded-4xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-[#8da070]/20 transition-all duration-300 relative overflow-hidden">
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
                ))}
            </div>
        </div>
    );
};

export default ContactsPage;