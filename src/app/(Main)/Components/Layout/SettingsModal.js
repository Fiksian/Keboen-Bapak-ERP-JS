import React from 'react';
import { X, Bell, Moon, Globe, Shield } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const settingsOptions = [
        { icon: <Bell size={20} />, label: "Notifikasi", desc: "Kelola peringatan pakan & cuaca", active: true },
        { icon: <Moon size={20} />, label: "Mode Gelap", desc: "Ubah tema tampilan", active: false },
        { icon: <Globe size={20} />, label: "Bahasa", desc: "Pilih Bahasa Indonesia", active: true },
        { icon: <Shield size={20} />, label: "Keamanan", desc: "Ubah kata sandi akun", active: false },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Pengaturan Sistem</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Konfigurasi Dashboard</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {settingsOptions.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 transition-all group">
                            <div className="flex gap-4">
                                <div className="p-2 bg-gray-100 text-gray-500 group-hover:bg-[#8da070] group-hover:text-white rounded-lg transition-colors">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.desc}</p>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${item.active ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-[#8da070] text-white font-bold rounded-lg hover:bg-[#7a8c60] transition-colors shadow-md"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;