import React from 'react';
import { 
  LayoutDashboard, User, CheckSquare, Package, 
  ShoppingCart, CloudSun, BarChart3, Bell, Settings, ChevronRight, PanelLeftClose,
  PanelLeftOpen,
  Leaf
} from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu, isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Profil', icon: <User size={18} /> },
    { name: 'Tasks', icon: <CheckSquare size={18} /> },
    { name: 'Plants', icon: <Leaf size={18} /> },
    { name: 'Stock/Inventory', icon: <Package size={18} /> },
    { name: 'Purchasing', icon: <ShoppingCart size={18} /> },
    { name: 'Cuaca', icon: <CloudSun size={18} /> },
    { name: 'Report', icon: <BarChart3 size={18} /> },
    { name: 'Notifications', icon: <Bell size={18} /> },
  ];

  return (
    <aside className={`bg-white border-r flex flex-col h-full shrink-0 shadow-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'xl:w-64 sm:w-64'}`}>
      <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <button 
            key={item.name}
            onClick={() => setActiveMenu(item.name)}
            className={`w-full flex items-center justify-between px-4 py-3 transition-colors hover:shadow-md hover:shadow-green-300 ${
              activeMenu === item.name 
                ? 'text-green-700/80 bg-blue-50/40 border-l-4 border-green-500/80 font-semibold ' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeMenu === item.name ? 'text-green-700' : 'text-gray-600'}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-[13px] whitespace-nowrap">{item.name}</span>}
            </div>
            <ChevronRight size={14} className={activeMenu === item.name ? 'text-green-700/50' : 'text-gray-400'} />
          </button>
        ))}
      </nav>

      <div className="border-t pb-4 bg-white shrink-0">
        <button 
          onClick={() => setActiveMenu('Getting Started')}
          className="group w-full flex items-center justify-between px-4 py-4 text-gray-500 hover:bg-gray-50  transition-colors hover:shadow-md hover:shadow-green-300"
        >
          <div className="flex items-center gap-3 group-hover:text-green-600/80 ">
            <Settings size={18} className="text-gray-600 group-hover:text-green-600/80" />
            {!isCollapsed && <span className="text-[13px] font-medium">Getting Started</span>}
          </div>
          <ChevronRight size={14} className="text-gray-600 group-hover:text-green-600/80" />
        </button>
        
        <div className="group px-4 py-4 border-t hover:bg-blue-50 transition-colors hover:shadow-md hover:shadow-green-300 " onClick={toggleSidebar}>
          <button  
            className="w-full flex items-center justify-start focus:outline-none group-hover:text-green-600 "
          />
            {isCollapsed ? (
              <PanelLeftOpen size={18} className="text-gray-600 cursor-pointer group-hover:text-green-600/80" />
            ) : (
              <PanelLeftClose size={18} className="text-gray-600 cursor-pointer group-hover:text-green-600/80" />
            )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;