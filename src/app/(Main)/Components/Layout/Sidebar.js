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
  X
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar, userRole, isOpenMobile, onCloseMobile }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/Dashboard', roles: ['Admin', 'Staff', 'Manager', 'Supervisor', 'Test'] },
    { name: 'Cuaca', icon: <CloudSun size={18} />, path: '/Cuaca', roles: ['Admin', 'Staff', 'Manager', 'Supervisor', 'Test'] },
    { name: 'Report', icon: <BarChart3 size={18} />, path: '/Report', roles: ['Admin', 'Manager', 'Test'] },
    { name: 'Staff', icon: <User size={18} />, path: '/Staff', roles: ['Admin'] },
    { name: 'Contacts', icon: <User2 size={18} />, path: '/Contacts', roles: ['Admin', 'Test', 'Staff'] },
    { name: 'Tasks', icon: <CheckSquare size={18} />, path: '/Tasks', roles: ['Admin'] },
    { name: 'Kandang', icon: <Warehouse size={18} />, path: '/Kandang', roles: ['Admin', 'Staff', 'Supervisor'] },
    { name: 'Produksi', icon: <Settings size={18} />, path: '/Produksi', roles: ['Admin', 'Staff', 'Manager','Supervisor', 'Test'] },
    { name: 'Warehouse', icon: <Package size={18} />, path: '/Stock', roles: ['Admin', 'Manager', 'Staff', 'Supervisor', 'Test'] },
    { name: 'Purchasing', icon: <ShoppingCart size={18} />, path: '/Purchasing', roles: ['Admin', 'Manager', 'Staff','Supervisor', 'Test'] },
    { name: 'Penjualan', icon: <Store size={18} />, path: '/Penjualan', roles: ['Admin', 'Manager', 'Staff','Supervisor', 'Test'] },
    { name: 'Finance', icon: <CircleDollarSign size={18} />, path: '/Finance', roles: ['Admin', 'Manager','Test'] },
    { name: 'Notifications', icon: <Bell size={18} />, path: '/Notifications', roles: ['Admin', 'Manager', 'Supervisor'] },
    { name: 'History', icon: <Clock size={18} />, path: '/History', roles: ['Admin', 'Manager', 'Supervisor', 'Test'] },
  ];

  return (
    <>
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[110] bg-white border-r flex flex-col h-full shadow-md transition-all duration-300
        ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
        md:relative md:translate-x-0 
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        
        <div className="flex items-center justify-between px-4 py-4 md:hidden border-b">
           <span className="font-bold text-gray-700">Menu Navigasi</span>
           <button onClick={onCloseMobile} className="p-1 text-gray-500">
              <X size={20} />
           </button>
        </div>

        <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;

            const isActive = pathname === item.path;

            return (
              <Link 
                key={item.name}
                href={item.path}
                onClick={() => { if(window.innerWidth < 768) onCloseMobile(); }}
                className={`w-full flex items-center justify-between px-4 py-4 cursor-pointer transition-colors hover:shadow-md hover:shadow-green-300 ${
                  isActive 
                    ? 'text-green-700/80 bg-blue-50/40 border-l-4 border-green-500/80 font-semibold ' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-green-700' : 'text-gray-600'}>
                    {item.icon}
                  </span>
                  {(isOpenMobile || !isCollapsed) && (
                    <span className="text-[13px] whitespace-nowrap">{item.name}</span>
                  )}
                </div>
                {(isOpenMobile || !isCollapsed) && (
                  <ChevronRight size={14} className={isActive ? 'text-green-700/50' : 'text-gray-400'} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t pb-4 bg-white shrink-0">
          <Link 
            href="/Settings"
            onClick={() => { if(window.innerWidth < 768) onCloseMobile(); }}
            className="group w-full flex items-center justify-between px-4 py-4 cursor-pointer text-gray-500 hover:bg-gray-50 transition-colors hover:shadow-md hover:shadow-green-300"
          >
            <div className="flex items-center gap-3 group-hover:text-green-600/80 ">
              <Settings size={18} className="text-gray-600 group-hover:text-green-600/80" />
              {(isOpenMobile || !isCollapsed) && <span className="text-[13px] font-medium">Getting Started</span>}
            </div>
            {(isOpenMobile || !isCollapsed) && <ChevronRight size={14} className="text-gray-600 group-hover:text-green-600/80" />}
          </Link>
          
          <div 
            className="hidden md:flex group px-4 py-4 border-t hover:bg-blue-50 transition-colors cursor-pointer hover:shadow-md hover:shadow-green-300 items-center justify-start" 
            onClick={toggleSidebar}
          >
              {isCollapsed ? (
                <PanelLeftOpen size={18} className="text-gray-600 group-hover:text-green-600/80" />
              ) : (
                <PanelLeftClose size={18} className="text-gray-600 group-hover:text-green-600/80" />
              )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;