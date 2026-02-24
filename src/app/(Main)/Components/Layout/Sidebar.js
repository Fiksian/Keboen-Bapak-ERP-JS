"use client";

import React from 'react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 
import { 
  LayoutDashboard, User, CheckSquare, Package, 
  ShoppingCart, CloudSun, BarChart3, Bell, Settings, ChevronRight, PanelLeftClose,
  PanelLeftOpen, Warehouse,
  Clock,
  Store,
  User2,
  CircleDollarSign,
  X,
  Calendar
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar, userRole, isOpenMobile, onCloseMobile }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/Dashboard', roles: ['Admin', 'Staff', 'Manager', 'Supervisor', 'Test'] },
    { name: 'Cuaca', icon: <CloudSun size={18} />, path: '/Cuaca', roles: ['Admin', 'Test'] },
    { name: 'Report', icon: <BarChart3 size={18} />, path: '/Report', roles: ['Admin'] },
    { name: 'Staff', icon: <User size={18} />, path: '/Staff', roles: ['Admin'] },
    { name: 'Contacts', icon: <User2 size={18} />, path: '/Contacts', roles: ['Admin', 'Test', 'Staff'] },
    { name: 'Tasks', icon: <CheckSquare size={18} />, path: '/Tasks', roles: ['Admin'] },
    { name: 'Kandang', icon: <Warehouse size={18} />, path: '/Kandang', roles: [] },
    { name: 'Produksi', icon: <Settings size={18} />, path: '/Produksi', roles: ['Admin','Test'] },
    { name: 'Arrival', icon: <Clock size={18} />, path: '/Arrival', roles: ['Admin', 'Test'] },
    { name: 'Warehouse', icon: <Package size={18} />, path: '/Stock', roles: ['Admin', 'Test'] },
    { name: 'Purchasing', icon: <ShoppingCart size={18} />, path: '/Purchasing', roles: ['Admin', 'Test'] },
    { name: 'Penjualan', icon: <Store size={18} />, path: '/Penjualan', roles: ['Admin',] },
    { name: 'Finance', icon: <CircleDollarSign size={18} />, path: '/Finance', roles: ['Admin'] },
    { name: 'History', icon: <Calendar size={18} />, path: '/History', roles: ['Admin', 'Manager', 'Supervisor', 'Test'] },
  ];

  return (
    <>
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 md:hidden transition-opacity duration-300 z-45 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r flex flex-col h-full shadow-2xl md:shadow-md transition-all duration-300 z-50
        ${isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full w-72'} 
        md:relative md:translate-x-0 
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        
        <div className="flex items-center justify-between px-6 py-5 md:hidden border-b bg-gray-50/50">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8da070] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">KB</span>
              </div>
              <span className="font-bold text-gray-800 tracking-tight">Navigasi</span>
           </div>
           <button 
             onClick={onCloseMobile} 
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
           >
              <X size={20} />
           </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200">
          {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;

            const isActive = pathname === item.path;

            return (
              <Link 
                key={item.name}
                href={item.path}
                onClick={() => { if(window.innerWidth < 1024) onCloseMobile(); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 my-0.5 cursor-pointer transition-all ${
                  isActive 
                    ? 'text-[#8da070] bg-[#8da070]/5 border-l-4 border-[#8da070] font-bold shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-[#8da070]' : 'text-gray-400'} transition-colors`}>
                    {item.icon}
                  </span>
                  {(isOpenMobile || !isCollapsed) && (
                    <span className="text-[14px] whitespace-nowrap tracking-wide">{item.name}</span>
                  )}
                </div>
                {(isOpenMobile || !isCollapsed) && (
                  <ChevronRight size={14} className={`transition-transform ${isActive ? 'text-[#8da070] rotate-90' : 'text-gray-300'}`} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2 bg-white shrink-0">
          <Link 
            href="/Settings"
            onClick={() => { if(window.innerWidth < 1024) onCloseMobile(); }}
            className="group w-full flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer text-gray-500 hover:bg-[#8da070]/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-gray-400 group-hover:text-[#8da070] transition-colors" />
              {(isOpenMobile || !isCollapsed) && (
                <span className="text-[13px] font-semibold group-hover:text-[#8da070]">Getting Started</span>
              )}
            </div>
          </Link>
          
          <button 
            className="hidden md:flex w-full group mt-2 px-4 py-4 border-t hover:bg-gray-50 transition-all items-center justify-start gap-3 text-gray-400" 
            onClick={toggleSidebar}
          >
              {isCollapsed ? (
                <>
                  <PanelLeftOpen size={18} className="group-hover:text-[#8da070]" />
                </>
              ) : (
                <>
                  <PanelLeftClose size={18} className="group-hover:text-[#8da070]" />
                  <span className="text-xs font-bold uppercase tracking-widest group-hover:text-[#8da070]">Minimize</span>
                </>
              )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;