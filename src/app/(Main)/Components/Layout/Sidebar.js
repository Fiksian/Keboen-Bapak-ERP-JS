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
  CircleDollarSign
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar, userRole }) => {
  const pathname = usePathname();

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: <LayoutDashboard size={18} />, 
      path: '/Dashboard', 
      roles: ['Admin', 'Staff', 'Manager', 'Supervisor', 'Test'] 
    },
    { 
      name: 'Cuaca', 
      icon: <CloudSun size={18} />, 
      path: '/Cuaca', 
      roles: ['Admin', 'Staff', 'Manager', 'Supervisor', 'Test'] 
    },
    { 
      name: 'Staff', 
      icon: <User size={18} />, 
      path: '/Staff', 
      roles: ['Admin']
    },
    { 
      name: 'Contacts', 
      icon: <User2 size={18} />, 
      path: '/Contacts', 
      roles: ['Admin']
    },
    { 
      name: 'Tasks', 
      icon: <CheckSquare size={18} />, 
      path: '/Tasks', 
      roles: ['Admin'] 
    },
    { 
      name: 'Kandang', 
      icon: <Warehouse size={18} />, 
      path: '/Kandang', 
      roles: ['Admin', 'Staff', 'Supervisor'] 
    },
    { 
      name: 'Produksi', 
      icon: <Settings size={18} />, 
      path: '/Produksi', 
      roles: ['Admin', 'Staff', 'Manager','Supervisor', 'Test'] 
    },
    { 
      name: 'Warehouse', 
      icon: <Package size={18} />, 
      path: '/Stock', 
      roles: ['Admin', 'Manager', 'Staff', 'Supervisor', 'Test'] 
    },
    { 
      name: 'Purchasing', 
      icon: <ShoppingCart size={18} />, 
      path: '/Purchasing', 
      roles: ['Admin', 'Manager', 'Staff','Supervisor', 'Test'] 
    },
    { 
      name: 'Penjualan', 
      icon: <Store size={18} />, 
      path: '/Penjualan', 
      roles: ['Admin', 'Manager', 'Staff','Supervisor', 'Test'] 
    },
    { 
      name: 'Finance', 
      icon: <CircleDollarSign size={18} />, 
      path: '/Finance', 
      roles: ['Admin', 'Manager'] 
    },
    { 
      name: 'Report', 
      icon: <BarChart3 size={18} />, 
      path: '/Report', 
      roles: ['Admin', 'Manager'] 
    },
    { 
      name: 'Notifications', 
      icon: <Bell size={18} />, 
      path: '/Notifications', 
      roles: ['Admin', 'Manager', 'Supervisor'] 
    },
    { 
      name: 'History', 
      icon: <Clock size={18} />, 
      path: '/History', 
      roles: ['Admin', 'Manager', 'Supervisor', 'Test'] 
    },
  ];

  return (
    <aside className={`bg-white border-r flex flex-col h-full shrink-0 shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'xl:w-64 sm:w-64'}`}>
      <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          
          if (!item.roles.includes(userRole)) return null;

          const isActive = pathname === item.path;

          return (
            <Link 
              key={item.name}
              href={item.path}
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
                {!isCollapsed && <span className="text-[13px] whitespace-nowrap">{item.name}</span>}
              </div>
              <ChevronRight size={14} className={isActive ? 'text-green-700/50' : 'text-gray-400'} />
            </Link>
          );
        })}
      </nav>

      <div className="border-t pb-4 bg-white shrink-0 ">
        <Link 
          href="/Settings"
          className="group w-full flex items-center justify-between px-4 py-4 cursor-pointer text-gray-500 hover:bg-gray-50  transition-colors hover:shadow-md hover:shadow-green-300"
        >
          <div className="flex items-center gap-3 group-hover:text-green-600/80 ">
            <Settings size={18} className="text-gray-600 group-hover:text-green-600/80" />
            {!isCollapsed && <span className="text-[13px] font-medium">Getting Started</span>}
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-green-600/80" />
        </Link>
        
        <div 
          className="group px-4 py-4 border-t hover:bg-blue-50 transition-colors cursor-pointer hover:shadow-md hover:shadow-green-300 flex items-center justify-start" 
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
  );
};

export default Sidebar;