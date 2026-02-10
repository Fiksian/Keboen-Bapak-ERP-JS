'use client'

import React, { useState } from 'react';
import { Settings2, UserCircle, Menu, X } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

const Header = ({ user, onLogout, isMobileMenuOpen, toggleMobileMenu }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const userName = user?.name
    const userRole = user?.role

    return (
        <header className="sticky top-0 z-60 bg-[#8da070] text-white px-4 md:px-8 py-3.5 flex items-center justify-between shadow-md h-16 md:h-20">
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={toggleMobileMenu}
                    className="md:hidden p-2 -ml-2 hover:bg-white/20 rounded-xl transition-all active:scale-90 flex items-center justify-center"
                    aria-label="Toggle Menu"
                >
                    {isMobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
                </button>

                <div className="flex items-center space-x-3 group cursor-pointer select-none">
                    <div className="bg-white/20 p-1.5 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-sm">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-100 rounded-lg flex items-center justify-center shadow-inner">
                            <span className="text-[10px] md:text-xs text-green-800 font-black tracking-tighter">KB</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h1 className="font-black text-sm md:text-xl tracking-tight uppercase italic leading-none transition-all duration-300 group-hover:text-yellow-100">
                            Keboen Bapak
                        </h1>
                        <span className="hidden sm:block text-[8px] font-bold text-white/60 uppercase tracking-[2px] mt-1">Management System</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-4">
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90 flex items-center gap-2 group border border-transparent hover:border-white/10"
                    title="System Settings"
                >
                    <Settings2 className="w-5 h-5 md:w-6 md:h-6 text-white/90 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Settings</span>
                </button>

                <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>

                <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-2 p-1 md:pl-1 md:pr-3 hover:bg-white/20 rounded-xl transition-all active:scale-90 group border border-transparent hover:border-white/10"
                >
                    <div className="relative">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/20 group-hover:border-yellow-200 transition-colors">
                            <UserCircle className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:text-yellow-100" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-[3px] border-[#8da070] rounded-full shadow-sm"></div>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-start leading-tight text-left">
                        <span className="text-[10px] font-black uppercase tracking-wider group-hover:text-yellow-100 transition-colors">
                            {userName}
                        </span>
                        <span className="text-[8px] text-white/60 font-black uppercase italic tracking-widest leading-none">
                            {userRole}
                        </span>
                    </div>
                </button>
            </div>

            <ProfileModal 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                onLogout={onLogout}
                user={user}
            />
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
            />
        </header>
    );
};

export default Header;