'use client';

import React, { useState, useEffect } from 'react';
import { 
    X, LogOut, User, Mail, 
    ShieldCheck, Loader2, Briefcase, 
    ChevronRight, Settings, AtSign 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from "next-auth/react";

const ProfileModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Mengambil data terbaru dari DB
            const res = await fetch('/api/staff/me');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleLogout = async () => {
        await signOut({ 
            callbackUrl: '/Login',
            redirect: true 
        });
    };

    const handleEditProfile = () => {
        onClose();
        router.push('/Staff'); 
    };

    return (
        <div onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                
                {/* Header Banner */}
                <div className="relative h-28 bg-[#8da070]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <button 
                        onClick={onClose} 
                        className="absolute right-4 top-4 text-white hover:bg-black/10 rounded-full p-2 transition-all active:scale-90 z-10"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="px-8 pb-8 text-center">
                    {/* Avatar Section */}
                    <div className="relative -mt-14 mb-4 inline-block">
                        <div className="w-28 h-28 bg-gray-50 border-[6px] border-white rounded-[2rem] shadow-xl flex items-center justify-center text-[#8da070] overflow-hidden">
                            <User size={56} strokeWidth={1.5} />
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="animate-spin text-[#8da070]" size={32} />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing Data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Name, Title & Username */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                                    {profile ? `${profile.firstName} ${profile.lastName}` : "User Name"}
                                </h3>
                                
                                <div className="flex flex-col items-center gap-2 mt-2">
                                    {/* Designation Badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8da070]/10 text-[#8da070] rounded-full">
                                        <Briefcase size={12} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            {profile?.designation || "New Member"}
                                        </span>
                                    </div>
                                    
                                    {/* USERNAME DISPLAY */}
                                    <div className="flex items-center gap-1 text-gray-400 font-bold text-xs lowercase italic">
                                        <AtSign size={12} />
                                        <span>{profile?.username || profile?.email?.split('@')[0] || 'username'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info List */}
                            <div className="space-y-2 text-left mb-8">
                                <div className="group flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#8da070]/20 hover:bg-white transition-all">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <Mail size={18} className="text-gray-400 group-hover:text-[#8da070] transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Email Address</span>
                                        <span className="text-sm text-gray-700 font-bold truncate max-w-[180px]">
                                            {profile?.email || session?.user?.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="group flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#8da070]/20 hover:bg-white transition-all">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <ShieldCheck size={18} className="text-gray-400 group-hover:text-[#8da070] transition-colors" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Access Level</span>
                                        <span className="text-sm text-gray-700 font-bold">
                                            {profile?.role || "Staff"} Administrator
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleEditProfile}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 group shadow-lg shadow-gray-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                                        <span>Manage Profile</span>
                                    </div>
                                    <ChevronRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 py-4 text-red-500 hover:text-red-700 font-black uppercase text-xs tracking-widest transition-colors active:scale-95"
                                >
                                    <LogOut size={16} />
                                    Sign Out Account
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;