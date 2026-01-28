'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Phone, Briefcase, Shield, Save,
  User, Camera, Loader2, CreditCard,
  Home, ChevronDown
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

  const roleOptions = [ 'Staff', 'Manager', 'Supervisor', 'Admin'];
  const designationOptions = [
    'IT Support', 'Farm Worker', 'Accountant', 
    'Marketing', 'Maintenance', 'New Employee'
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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gray-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
              <User size={64} className="text-gray-300" />
            </div>
            <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              <Camera size={18} />
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
              {isAdmin ? "Administrative Access" : "Employee Profile"}
            </p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {formData.firstName} {formData.lastName}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-100">
                {formData.role}
              </span>
              <span className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                {formData.designation}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={isAdmin ? onBack : () => router.push('/Dashboard')} 
              className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 group"
              title={isAdmin ? "Kembali ke Daftar" : "Kembali ke Dashboard"}
            >
              {isAdmin ? <ArrowLeft size={20} /> : <Home size={20} />}
            </button>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" /> Identity Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                <input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                <input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 bottom-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address (Login)</label>
                <div className="relative">
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                  />
                  <Mail size={16} className="absolute right-4 bottom-4 text-gray-400" />
                </div>
                <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase italic">* Mengubah email akan memperbarui data login Anda.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-500" /> System Settings
            </h3>
            
            <div className="space-y-6">
              {/* DESIGNATION SELECT */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Designation</label>
                {isAdmin ? (
                  <>
                    <select 
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                    >
                      {designationOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 bottom-4 text-blue-500 pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full px-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-500 border border-gray-200">
                    {formData.designation}
                  </div>
                )}
              </div>

              {/* ROLE SELECT */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">System Role</label>
                {isAdmin ? (
                  <>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-red-50 border-2 border-red-100 rounded-xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                    >
                      {roleOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <Shield size={16} className="absolute right-4 bottom-4 text-red-500 pointer-events-none" />
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-blue-700 font-bold text-sm border border-blue-100">
                    <Shield size={16} />
                    {formData.role}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Staff ID</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-500 font-mono text-xs border border-gray-200">
                  <CreditCard size={14} />
                  {formData.staffId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;