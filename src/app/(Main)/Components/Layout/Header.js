'use client'

import React, { useState } from 'react';
import { Settings, UserCircle } from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

const Header = ({ onLogout }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-[#8da070] text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 group cursor-pointer">

                <div className="bg-white/20 p-1 rounded-md transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <div className="w-8 h-8 bg-yellow-200 rounded-sm flex items-center justify-center shadow-inner">
                        <span className="text-xs text-green-800 font-bold animate-pulse">KB</span>
                    </div>
                </div>

                <h1 className="font-bold text-lg tracking-wide transition-all duration-300 group-hover:translate-x-1 group-hover:text-yellow-100">
                    Keboen Bapak
                </h1>
            </div>

            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="p-1 hover:bg-white/20 rounded-full transition-all active:scale-90"
                >
                    <UserCircle className="w-8 h-8 text-white" />
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 hover:bg-white/20 rounded-full transition-all active:scale-90"
                >
                    <Settings className="w-8 h-8 text-white" />
                </button>
            </div>

            {/* Modal Components */}
            <ProfileModal 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                onLogout={onLogout}
            />
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
            />
        </header>
    );
};

export default Header;