'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Save, Plus, Trash2, Unlock, Lock, Check, X, Loader2,
  LayoutDashboard, CloudSun, BarChart3, User, User2, CheckSquare, 
  Warehouse, Settings, Clock, Package, ShoppingCart, Store, 
  CircleDollarSign, Calendar, ArrowLeft,
  Book
} from 'lucide-react';

const MENU_ICONS = {
  dashboard: <LayoutDashboard size={20} />,
  cuaca: <CloudSun size={20} />,
  report: <BarChart3 size={20} />,
  staff: <User size={20} />,
  contacts: <User2 size={20} />,
  tasks: <CheckSquare size={20} />,
  kandang: <Warehouse size={20} />,
  produksi: <Settings size={20} />,
  arrival: <Clock size={20} />,
  sttb: <Book size={20} />,
  warehouse: <Package size={20} />,
  purchasing: <ShoppingCart size={20} />,
  penjualan: <Store size={20} />,
  finance: <CircleDollarSign size={20} />,
  history: <Calendar size={20} />,
};

const RoleSettingsPage = () => {
  const router = useRouter();
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/roles');
      const data = await res.json();
      setRolePermissions(data);
      if (Object.keys(data).length > 0 && !selectedRole) {
        setSelectedRole(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error("Gagal memuat role:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (menuId) => {
    if (rolePermissions[selectedRole]?.includes('*')) return;
    const current = rolePermissions[selectedRole] || [];
    const updated = current.includes(menuId)
      ? current.filter(id => id !== menuId)
      : [...current, menuId];
    setRolePermissions({ ...rolePermissions, [selectedRole]: updated });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: selectedRole, permissions: rolePermissions[selectedRole] })
      });
      if (res.ok) alert("Perubahan untuk role " + selectedRole + " berhasil disimpan!");
    } catch (error) {
      alert("Gagal menyimpan ke database");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (roleName === 'Owner' || roleName === 'Super Admin') {
      return alert("Role sistem inti tidak dapat dihapus!");
    }

    if (confirm(`Apakah Anda yakin ingin menghapus role "${roleName}"?`)) {
      try {
        const res = await fetch(`/api/auth/roles?roleName=${roleName}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          const updatedPermissions = { ...rolePermissions };
          delete updatedPermissions[roleName];
          setRolePermissions(updatedPermissions);
          if (selectedRole === roleName) {
            setSelectedRole(Object.keys(updatedPermissions)[0] || '');
          }
        } else {
          const err = await res.json();
          alert(err.error);
        }
      } catch (error) {
        alert("Terjadi kesalahan saat menghapus role.");
      }
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#8da070] mx-auto mb-4" size={40} />
        <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Sinkronisasi Database...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 animate-in slide-in-from-left duration-500">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-[#8da070] group-hover:text-white transition-colors">
              <ArrowLeft size={16} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-900 transition-colors italic">
              Back to Dashboard
            </span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3 italic">
              <ShieldCheck className="text-[#8da070]" size={36} />
              Akses Kontrol
            </h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Pengaturan Izin Berbasis Database</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving || !selectedRole}
            className="bg-[#8da070] text-white px-8 py-4 rounded-xl font-black hover:bg-[#7a8c61] transition-all shadow-lg shadow-[#8da070]/20 text-xs uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Perubahan
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Daftar Peran</p>
                <button 
                  onClick={() => setIsAdding(true)} 
                  className="p-2 bg-[#8da070]/10 text-[#8da070] rounded-lg hover:bg-[#8da070] hover:text-white transition-all shadow-sm"
                >
                  <Plus size={18} strokeWidth={3}/>
                </button>
              </div>

              <div className="space-y-2">
                {isAdding && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border-2 border-[#8da070] mb-4 animate-in zoom-in-95 duration-200">
                    <input 
                      autoFocus
                      className="flex-1 bg-transparent text-sm font-bold uppercase outline-none px-2 text-gray-800"
                      placeholder="Nama Role..."
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !(!newRoleName) && (setRolePermissions({...rolePermissions, [newRoleName]: []}), setSelectedRole(newRoleName), setIsAdding(false), setNewRoleName(''))}
                    />
                    <button onClick={() => {
                      if(!newRoleName) return;
                      setRolePermissions({...rolePermissions, [newRoleName]: []});
                      setSelectedRole(newRoleName);
                      setIsAdding(false);
                      setNewRoleName('');
                    }} className="text-green-600 p-1 hover:bg-green-50 rounded-md"><Check size={20} strokeWidth={3}/></button>
                    <button onClick={() => setIsAdding(false)} className="text-red-500 p-1 hover:bg-red-50 rounded-md"><X size={20}/></button>
                  </div>
                )}

                {Object.keys(rolePermissions).map((role) => (
                  <div key={role} className="group relative">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${
                        selectedRole === role 
                        ? 'bg-[#8da070] border-[#8da070] text-white shadow-md translate-x-1' 
                        : 'bg-white border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {role === 'Owner' || role === 'Super Admin' ? <Lock size={16}/> : <Unlock size={16}/>}
                        {role}
                      </span>
                    </button>
                    
                    {role !== 'Owner' && role !== 'Super Admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-200 p-8 md:p-12">
              <div className="mb-10 border-b border-gray-100 pb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 w-12 bg-[#8da070] rounded-full"></div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                    Izin Akses: <span className="text-[#8da070]">{selectedRole || '---'}</span>
                  </h2>
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] ml-16">Pilih modul yang dapat dilihat oleh role ini</p>
              </div>

              {selectedRole ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(MENU_ICONS).map((menuId) => {
                    const isChecked = rolePermissions[selectedRole]?.includes(menuId) || rolePermissions[selectedRole]?.includes('*');
                    const isLocked = rolePermissions[selectedRole]?.includes('*');

                    return (
                      <div 
                        key={menuId}
                        onClick={() => !isLocked && handleToggle(menuId)}
                        className={`
                          group flex items-center justify-between p-5 rounded-3xl border-2 transition-all
                          ${isChecked 
                            ? 'border-[#8da070] bg-[#8da070]/5' 
                            : 'border-gray-50 bg-gray-50/30 hover:border-gray-200 opacity-60 hover:opacity-100'}
                          ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl transition-all duration-300 ${isChecked ? 'bg-[#8da070] text-white rotate-6' : 'bg-white text-gray-300 border border-gray-100'}`}>
                            {MENU_ICONS[menuId]}
                          </div>
                          <div>
                            <span className={`text-[11px] font-black uppercase tracking-widest block ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                              {menuId}
                            </span>
                            <span className="text-[9px] text-gray-300 font-bold uppercase italic tracking-tighter">Module Access</span>
                          </div>
                        </div>
                        <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-[#8da070] border-[#8da070]' : 'bg-white border-gray-200'}`}>
                          {isChecked && <Check size={16} className="text-white" strokeWidth={4} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 italic">
                  <ShieldCheck size={48} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Pilih role untuk mengatur izin</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoleSettingsPage;