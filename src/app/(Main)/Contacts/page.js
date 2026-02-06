'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import AddContact from './AddContact';
import ContactFilter from './ContactFilter';
import ContactCard from './ContactCard';

const ContactsPage = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/contacts?type=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("FAILED_TO_FETCH_CONTACTS:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (confirm(`Hapus permanen kontak "${name}"?`)) {
            try {
                const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
                if (res.ok) fetchContacts();
            } catch (error) {
                alert("Kesalahan koneksi saat menghapus");
            }
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [activeTab]);

    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-left">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Buku Kontak</h1>
                    <p className="text-sm text-gray-500 font-medium italic">Kelola data Pelanggan dan Vendor dalam satu tempat</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-[#8da070] hover:bg-[#7a8c61] text-white px-6 py-4 md:py-3 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-[#8da070]/20 text-[10px] md:text-xs uppercase tracking-widest">
                    <UserPlus size={18} strokeWidth={3} />
                    <span>Tambah Kontak</span>
                </button>
            </div>

            <ContactFilter
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-[#8da070]" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Menghubungkan Database...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                            <ContactCard 
                                key={contact.id} 
                                contact={contact} 
                                onDelete={handleDelete} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-white rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-6">
                            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest italic">Tidak ada kontak yang sesuai kriteria</p>
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-[#8da070] text-xs font-black uppercase hover:underline">Reset Filter</button>
                        </div>
                    )}
                </div>
            )}

            <AddContact isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchContacts} />
        </div>
    );
};

export default ContactsPage;