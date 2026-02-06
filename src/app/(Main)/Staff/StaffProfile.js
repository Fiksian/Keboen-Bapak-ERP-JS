'use client'

import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Phone, Briefcase, Shield, Save,
  User, Camera, Loader2, CreditCard,
  Home, ChevronDown, BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const StaffProfile = ({ staff, onBack, onUpdate }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: staff?.firstName || '',
    lastName: staff?.lastName || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    designation: staff?.designation || '',
    role: staff?.role || '',
    gender: staff?.gender || '',
    staffId: staff?.staffId || ''
  });

  const isAdmin = session?.user?.role === 'Admin';

  const roleOptions = [ 'Staff', 'Manager', 'Supervisor', 'Admin', 'Test'];
  const designationOptions = [
    'IT Support', 'Farm Worker', 'Accountant', 
    'Marketing', 'Maintenance', 'New Employee', 'Test Akun'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Profil dan akses berhasil diperbarui!");
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        alert(err.message || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4 md:px-0">
      
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden mt-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-40" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          <div className="relative group shrink-0">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2rem] bg-gray-50 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
              <User size={56} className="text-gray-300 md:w-16 md:h-16" />
            </div>
            <button className="absolute -bottom-1 -right-1 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-90 border-2 border-white">
              <Camera size={16} />
            </button>
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
              <p className="text-blue-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] italic">
                {isAdmin ? "Administrative Mode" : "Employee Profile"}
              </p>
              {isAdmin && <BadgeCheck size={14} className="text-blue-500 hidden md:block" />}
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic truncate w-full">
              {formData.firstName} {formData.lastName}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <span className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg shadow-blue-100 italic">
                {formData.role}
              </span>
              <span className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider italic">
                {formData.designation}
              </span>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            <button 
              onClick={isAdmin ? onBack : () => router.push('/Dashboard')} 
              className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 active:scale-95 border border-gray-100"
            >
              {isAdmin ? <ArrowLeft size={20} /> : <Home size={20} />}
            </button>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase italic tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Update Records</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <User size={18} />
               </div>
               <h3 className="text-sm font-black text-gray-800 uppercase italic tracking-widest">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-700 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-700 text-sm"
                />
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                <div className="relative">
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                <div className="relative">
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm"
                  />
                  <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5 pt-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">Secure Email (System Access)</label>
                <div className="relative">
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm"
                  />
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="flex items-center gap-1.5 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Shield size={12} className="text-amber-600" />
                  <p className="text-[9px] text-amber-700 font-black uppercase italic tracking-tighter leading-none">Warning: Updating email will change login credentials.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <Briefcase size={18} />
               </div>
               <h3 className="text-sm font-black text-gray-800 uppercase italic tracking-widest">Role & Privilege</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                {isAdmin ? (
                  <div className="relative">
                    <select 
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full pl-5 pr-12 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                    >
                      {designationOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-black text-gray-500 border border-gray-100 text-xs uppercase italic">
                    {formData.designation}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Privilege</label>
                {isAdmin ? (
                  <div className="relative">
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-5 pr-12 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-black text-gray-700 text-sm appearance-none cursor-pointer italic"
                    >
                      {roleOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <Shield size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none opacity-50" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-3.5 bg-blue-50/50 rounded-2xl text-blue-600 font-black text-[10px] border border-blue-100 uppercase italic">
                    <Shield size={14} />
                    {formData.role} Level
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee ID Card</label>
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-900 rounded-2xl text-white font-mono text-[10px] border border-gray-800 shadow-lg shadow-gray-200 uppercase tracking-widest">
                  <CreditCard size={14} className="text-blue-400" />
                  {formData.staffId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 md:hidden z-50 flex gap-2">
        <button 
          onClick={isAdmin ? onBack : () => router.push('/Dashboard')}
          className="p-4 bg-gray-100 text-gray-600 rounded-2xl flex-1 flex justify-center items-center active:scale-95"
        >
          {isAdmin ? <ArrowLeft size={20} /> : <Home size={20} />}
        </button>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase italic tracking-widest flex-[3] flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Update Records
        </button>
      </div>
    </div>
  );
};

export default StaffProfile;