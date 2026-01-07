import React from 'react';
import { Button } from 'react';
import { UserCircle } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-[#8da070] text-white px-4 py-3 flex items-center justify-between shadow-sm">
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

            <div className="flex items-center space-x-6">
                <button className="hover:scale-120 transition-transform duration-300">
                    <UserCircle className="w-8 h-8 text-gray-400 hover:text-gray-800 bg-white rounded-full" size={30}/>
                </button>
            </div>
        </header>
    );
};

export default Header;
