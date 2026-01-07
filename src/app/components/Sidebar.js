import React from 'react';
import { 
  LayoutDashboard, User, CheckSquare, Package, 
  ShoppingCart, CloudSun, BarChart3, Bell, Settings, ChevronRight, PanelLeftClose,
  Leaf
} from 'lucide-react';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
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
    <aside className="bg-white border-r flex flex-col h-screen shrink-0 shadow-md xl:w-64 sm:w-200">
      <nav className="flex-1 py-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button 
            key={item.name}
            onClick={() => setActiveMenu(item.name)}
            className={`w-full flex items-center justify-between px-4 py-3 transition-colors hover:shadow-md hover:shadow-green-300/80 ${
              activeMenu === item.name 
                ? 'text-green-700/80 bg-blue-50/40 border-l-4 border-green-500/80 font-semibold ' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeMenu === item.name ? 'text-green-700' : 'text-gray-600'}>
                {item.icon}
              </span>
              <span className="text-[13px]">{item.name}</span>
            </div>
            <ChevronRight size={14} className={activeMenu === item.name ? 'text-green-700/50' : 'text-gray-400'} />
          </button>
        ))}
      </nav>
      <div>
        
      </div>
    </aside>
  );
};

export default Sidebar;