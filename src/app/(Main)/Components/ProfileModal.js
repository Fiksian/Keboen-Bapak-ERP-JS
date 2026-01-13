'use client'; // Pastikan ada directive ini karena menggunakan router

import React from 'react';
import { X, LogOut, User, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

const ProfileModal = ({ isOpen, onClose }) => {
    const router = useRouter(); // Inisialisasi router

    if (!isOpen) return null;

    const handleLogout = () => {
        console.log("User logged out");

        router.push('/'); 
        
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="relative h-24 bg-[#8da070]">
                    <button onClick={onClose} className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-1">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="px-6 pb-6 text-center">
                    <div className="relative -mt-12 mb-4 inline-block">
                        <div className="w-24 h-24 bg-gray-200 border-4 border-white rounded-full flex items-center justify-center text-[#8da070]">
                            <User size={48} />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900">Admin Keboen</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">Manager Operasional</p>

                    <div className="space-y-3 text-left mb-8">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <Mail size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-700 font-bold">admin@keboenbapak.com</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <ShieldCheck size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-700 font-bold">Verified Account</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleLogout} // Panggil fungsi handleLogout
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors border border-red-100"
                    >
                        <LogOut size={18} />
                        Keluar Aplikasi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;