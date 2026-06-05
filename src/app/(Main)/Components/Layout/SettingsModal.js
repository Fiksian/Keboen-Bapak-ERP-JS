"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Bell, Moon, Globe, Shield, 
  ChevronRight, Users2, ShieldAlert, Loader2
} from 'lucide-react';
import { usePermission } from '@/lib/usePermission';

const SettingsModal = ({ isOpen, onClose }) => {
    const router = useRouter();
    const { hasPermission, isSuperAdmin, loading, userRole } = usePermission();

    const canAccessRoleSettings = isSuperAdmin || hasPermission('staff');
    const canAccessSecurity = isSuperAdmin || hasPermission('staff');
    const canAccessNotification = true;

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-[#8da070] mb-4" size={40} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                        Memuat konfigurasi...
                    </p>
                </div>
            </div>
        );
    }

    const settingsOptions = [
        { 
            icon: <Bell size={20} />, 
            label: "Notifikasi", 
            desc: "Kelola peringatan pakan & cuaca", 
            active: true,
            canAccess: canAccessNotification,
            permissionId: "notifications"
        },
        { 
            icon: <Moon size={20} />, 
            label: "Mode Gelap", 
            desc: "Ubah tema tampilan", 
            active: false,
            canAccess: true,
            permissionId: "theme"
        },
        { 
            icon: <Globe size={20} />, 
            label: "Bahasa", 
            desc: "Pilih Bahasa Indonesia", 
            active: true,
            canAccess: true,
            permissionId: "language"
        },
        { 
            icon: <Shield size={20} />, 
            label: "Keamanan", 
            desc: "Ubah kata sandi akun", 
            active: false,
            canAccess: canAccessSecurity,
            permissionId: "security"
        },
    ];

    const handleGoToRoles = () => {
        if (!canAccessRoleSettings) {
            alert("Anda tidak memiliki izin untuk mengakses Manajemen Role");
            return;
        }
        onClose();
        router.push('/RoleSettings'); 
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-gray-50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Sistem</h3>
                            {isSuperAdmin && (
                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                     SUPERADMIN
                                </span>
                            )}
                            {userRole === 'Admin' && !isSuperAdmin && (
                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                     ADMIN
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Konfigurasi Dashboard</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-2">
                    {canAccessRoleSettings && (
                        <button 
                            onClick={handleGoToRoles}
                            className="w-full flex items-center justify-between p-4 mb-4 bg-[#8da070]/5 border-2 border-[#8da070]/20 rounded-2xl group hover:border-[#8da070] transition-all"
                        >
                            <div className="flex gap-4 items-center">
                                <div className="p-2.5 bg-[#8da070] text-white rounded-xl shadow-lg shadow-[#8da070]/20">
                                    <Users2 size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Manajemen Role</p>
                                    <p className="text-[10px] text-[#8da070] font-bold italic uppercase">Atur Hak Akses Database</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[#8da070] group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    {!canAccessRoleSettings && (
                        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <ShieldAlert size={14} className="text-amber-500" />
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                Role Anda ({userRole}) tidak memiliki akses ke Manajemen Role
                            </p>
                        </div>
                    )}

                    <p className="px-4 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Preferensi Pengguna</p>
                    
                    {settingsOptions.map((item, idx) => (
                        <div 
                            key={idx} 
                            className={`flex items-start justify-between p-4 rounded-2xl border transition-all group
                                ${item.canAccess 
                                    ? 'hover:bg-gray-50 cursor-pointer border-transparent hover:border-gray-100' 
                                    : 'opacity-50 cursor-not-allowed bg-gray-50/30 border-gray-50'
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-2 rounded-lg transition-colors ${
                                    item.canAccess 
                                        ? 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600' 
                                        : 'bg-gray-50 text-gray-300'
                                }`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                        {!item.canAccess && (
                                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 uppercase">
                                                Restricted
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium">{item.desc}</p>
                                    {!item.canAccess && (
                                        <p className="text-[8px] text-amber-500 font-bold mt-0.5">
                                            Hubungi Admin untuk akses
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative mt-1 transition-colors ${
                                item.active && item.canAccess ? 'bg-blue-500' : 'bg-gray-200'
                            }`}>
                                {item.canAccess && (
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                                        item.active ? 'left-6' : 'left-1'
                                    }`} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-[#8da070] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#7a8c60] transition-all shadow-lg shadow-[#8da070]/20"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;