"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, CheckSquare, Package,
  ShoppingCart, CloudSun, BarChart3, Settings, ChevronRight, PanelLeftClose,
  PanelLeftOpen, Warehouse, Clock, Store, User2, CircleDollarSign, X, Calendar,
  Truck, FileCheck, ClipboardList, ChevronDown
} from 'lucide-react';

// ─── Tipe menu ─────────────────────────────────────────────────────────────────
// "link"  : item langsung (existing behavior)
// "group" : accordion / collapsible parent dengan children
//
// Setiap group punya:
//   id       : dipakai untuk canAccess check (via '*' atau explicit list)
//   children : array item, masing-masing punya id, name, icon, path

const menuConfig = [
  { type: 'link', id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/Dashboard' },
  { type: 'link', id: 'cuaca',     name: 'Cuaca',     icon: CloudSun,        path: '/Cuaca'     },
  { type: 'link', id: 'report',    name: 'Report',    icon: BarChart3,       path: '/Report'    },
  { type: 'link', id: 'staff',     name: 'Staff',     icon: User,            path: '/Staff'     },
  { type: 'link', id: 'contacts',  name: 'Contacts',  icon: User2,           path: '/Contacts'  },
  { type: 'link', id: 'tasks',     name: 'Tasks',     icon: CheckSquare,     path: '/Tasks'     },
  { type: 'link', id: 'kandang',   name: 'Kandang',   icon: Warehouse,       path: '/Kandang'   },
  { type: 'link', id: 'produksi',  name: 'Produksi',  icon: Settings,        path: '/Produksi'  },
  { type: 'link', id: 'feedmill',  name: 'Feedmill',  icon: Settings,        path: '/Feedmill'  },

  // ── Grup Pengadaan ──────────────────────────────────────────────────────────
  {
    type:  'group',
    id:    'pengadaan',        // parent permission id
    name:  'Pengadaan',
    icon:  ClipboardList,      // ikon parent accordion
    // Group dianggap aktif jika pathname cocok dengan salah satu child
    children: [
      { id: 'purchasing', name: 'Purchase Order', icon: ShoppingCart,  path: '/Purchasing' },
      { id: 'arrival',    name: 'Arrival',         icon: Truck,         path: '/Arrival'    },
      { id: 'sttb',       name: 'STTB',            icon: FileCheck,     path: '/STTB'       },
    ],
  },

  { type: 'link', id: 'warehouse', name: 'Warehouse', icon: Package,           path: '/Stock'     },
  { type: 'link', id: 'penjualan', name: 'Penjualan', icon: Store,             path: '/Penjualan' },
  { type: 'link', id: 'finance',   name: 'Finance',   icon: CircleDollarSign,  path: '/Finance'   },
  { type: 'link', id: 'history',   name: 'History',   icon: Calendar,          path: '/History'   },
];

// ─── Sub-menu permission: group aktif jika setidaknya satu child bisa diakses ─
const groupChildPaths = (group) => group.children?.map(c => c.path) || [];

// =============================================================================
// Sidebar
// =============================================================================
const Sidebar = ({ isCollapsed, toggleSidebar, userRole, isOpenMobile, onCloseMobile }) => {
  const pathname = usePathname();
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading]                 = useState(true);

  // Track grup yang sedang terbuka. Gunakan Set agar bisa multi-group jika nanti perlu.
  // Default: buka otomatis jika pathname berada di dalam salah satu child
  const getInitialOpen = () => {
    const open = new Set();
    menuConfig
      .filter(m => m.type === 'group')
      .forEach(g => {
        if (groupChildPaths(g).some(p => pathname.startsWith(p))) {
          open.add(g.id);
        }
      });
    return open;
  };

  const [openGroups, setOpenGroups] = useState(getInitialOpen);

  // Ketika pathname berubah (navigasi), pastikan group yang aktif tetap terbuka
  useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      menuConfig
        .filter(m => m.type === 'group')
        .forEach(g => {
          if (groupChildPaths(g).some(p => pathname.startsWith(p))) {
            next.add(g.id);
          }
        });
      return next;
    });
  }, [pathname]);

  const toggleGroup = (id) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch('/api/auth/roles');
        if (res.ok) setRolePermissions(await res.json());
      } catch (err) {
        console.error("Gagal mengambil data akses sidebar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const canAccess = (itemId) => {
    if (loading) return false;
    const userPerms = rolePermissions[userRole] || [];
    return userPerms.includes('*') || userPerms.includes(itemId);
  };

  // Grup tampil jika setidaknya satu child bisa diakses
  const canAccessGroup = (group) =>
    group.children?.some(child => canAccess(child.id));

  const closeMobileIfNeeded = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onCloseMobile();
  };

  // ── Link tunggal ─────────────────────────────────────────────────────────────
  const renderLink = (item) => {
    if (!canAccess(item.id)) return null;
    const isActive = pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        key={item.id}
        href={item.path}
        onClick={closeMobileIfNeeded}
        className={`w-full flex items-center justify-between px-4 py-3.5 my-0.5 cursor-pointer transition-all ${
          isActive
            ? 'text-[#8da070] bg-[#8da070]/5 border-l-4 border-[#8da070] font-bold shadow-sm'
            : 'text-gray-500 hover:bg-gray-50 border-l-4 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-colors ${isActive ? 'text-[#8da070]' : 'text-gray-400'}`}>
            <Icon size={18} />
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
  };

  // ── Accordion group ────────────────────────────────────────────────────────
  const renderGroup = (group) => {
    if (!canAccessGroup(group)) return null;

    const Icon          = group.icon;
    const isGroupActive = group.children.some(c => pathname.startsWith(c.path));
    const isOpen        = openGroups.has(group.id) && (isOpenMobile || !isCollapsed);

    // Collapsed sidebar: tampilkan hanya ikon group, klik langsung ke child pertama
    if (!isOpenMobile && isCollapsed) {
      return (
        <div key={group.id} className="relative group/collapsed">
          <div
            className={`flex items-center justify-center px-4 py-3.5 my-0.5 cursor-pointer transition-all border-l-4 ${
              isGroupActive
                ? 'text-[#8da070] bg-[#8da070]/5 border-[#8da070]'
                : 'text-gray-400 hover:bg-gray-50 border-transparent'
            }`}
          >
            <Icon size={18} />
          </div>
          {/* Tooltip flyout saat collapsed */}
          <div className="absolute left-full top-0 ml-2 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 min-w-[180px] z-[200] hidden group-hover/collapsed:block animate-in slide-in-from-left-2 duration-150">
            <p className="px-4 pt-1 pb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
              {group.name}
            </p>
            {group.children.map(child => {
              if (!canAccess(child.id)) return null;
              const ChildIcon    = child.icon;
              const isChildActive = pathname.startsWith(child.path);
              return (
                <Link
                  key={child.id}
                  href={child.path}
                  onClick={closeMobileIfNeeded}
                  className={`flex items-center gap-3 px-4 py-3 text-[13px] cursor-pointer transition-colors ${
                    isChildActive
                      ? 'text-[#8da070] font-bold bg-[#8da070]/5'
                      : 'text-gray-600 hover:text-[#8da070] hover:bg-gray-50'
                  }`}
                >
                  <ChildIcon size={15} className={isChildActive ? 'text-[#8da070]' : 'text-gray-400'} />
                  {child.name}
                  {isChildActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8da070]" />}
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    // Expanded sidebar atau mobile: tampilkan accordion penuh
    return (
      <div key={group.id}>
        {/* Parent header */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={`w-full flex items-center justify-between px-4 py-3.5 my-0.5 cursor-pointer transition-all border-l-4 ${
            isGroupActive
              ? 'text-[#8da070] bg-[#8da070]/5 border-[#8da070] font-bold'
              : 'text-gray-500 hover:bg-gray-50 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`transition-colors ${isGroupActive ? 'text-[#8da070]' : 'text-gray-400'}`}>
              <Icon size={18} />
            </span>
            <span className="text-[14px] whitespace-nowrap tracking-wide">{group.name}</span>
            {/* Badge jumlah child aktif */}
            {isGroupActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#8da070] animate-pulse" />
            )}
          </div>
          <ChevronDown
            size={14}
            className={`transition-all duration-200 ${
              isGroupActive ? 'text-[#8da070]' : 'text-gray-300'
            } ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Children (animated accordion) */}
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {/* Visual group line */}
          <div className="ml-7 border-l-2 border-[#8da070]/20 mb-1">
            {group.children.map(child => {
              if (!canAccess(child.id)) return null;
              const ChildIcon     = child.icon;
              const isChildActive = pathname.startsWith(child.path);
              return (
                <Link
                  key={child.id}
                  href={child.path}
                  onClick={closeMobileIfNeeded}
                  className={`flex items-center gap-3 pl-5 pr-4 py-3 cursor-pointer transition-all relative ${
                    isChildActive
                      ? 'text-[#8da070] font-bold bg-[#8da070]/5'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {/* Active dot connector */}
                  {isChildActive && (
                    <span className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#8da070] border-2 border-white shadow-sm" />
                  )}
                  <ChildIcon size={15} className={isChildActive ? 'text-[#8da070]' : 'text-gray-400'} />
                  <span className="text-[13px] whitespace-nowrap tracking-wide">{child.name}</span>
                  {isChildActive && (
                    <ChevronRight size={12} className="ml-auto text-[#8da070]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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

        {/* Mobile header */}
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

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200">
          {loading ? (
            <div className="px-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            menuConfig.map(item =>
              item.type === 'group'
                ? renderGroup(item)
                : renderLink(item)
            )
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="border-t p-2 bg-white shrink-0">
          <button
            className="hidden md:flex w-full group mt-2 px-4 py-4 border-t hover:bg-gray-50 transition-all items-center justify-start gap-3 text-gray-400"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} className="group-hover:text-[#8da070]" />
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