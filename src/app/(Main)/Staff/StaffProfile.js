'use client'

import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Phone, 
  Calendar, Briefcase, ShieldCheck, 
  User, Edit, FileText, Save, Camera, Loader2
} from 'lucide-react';

const StaffProfile = ({ staff, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...staff });

  if (!staff) return null;

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
        const updatedData = await res.json();
        setIsEditing(false);
        
        // Sangat penting: panggil onUpdate agar data di tabel (parent) ikut berubah
        if (onUpdate) onUpdate(updatedData); 
        
        alert("Profil berhasil diperbarui!");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-full p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={isEditing ? () => setIsEditing(false) : onBack}
          disabled={loading}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-50 transition-all">
            <ArrowLeft size={18} />
          </div>
          {isEditing ? "Batal Edit" : "Back to List"}
        </button>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-bold text-sm cursor-pointer"
          >
            <Edit size={16} />
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-200 transition-all active:scale-95 font-bold text-sm cursor-pointer disabled:bg-gray-400"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Foto & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 text-center space-y-6 relative overflow-hidden">
            {isEditing && (
              <div className="absolute top-4 right-4 text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                MODE EDIT
              </div>
            )}
            
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border-4 border-white shadow-md overflow-hidden">
                <User size={64} strokeWidth={1.5} />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-4 border-white hover:bg-blue-700 transition-all cursor-pointer">
                  <Camera size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full text-center p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-blue-600 outline-none font-bold text-gray-800"
                    placeholder="First Name"
                  />
                  <input 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full text-center p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-blue-600 outline-none font-bold text-gray-800"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                  {formData.firstName} {formData.lastName}
                </h2>
              )}
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-1">
                {formData.role}
              </p>
            </div>

            <div className="pt-6 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500 justify-center">
                <Mail size={16} className="text-gray-400" />
                <span>{formData.email || (formData.firstName.toLowerCase() + "@keboenbapak.com")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 justify-center">
                <Phone size={16} className="text-gray-400" />
                {isEditing ? (
                   <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="p-2 bg-gray-50 rounded-lg border border-transparent focus:border-blue-600 outline-none text-center text-sm w-full"
                   />
                ) : (formData.phone || '-')}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Detail Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tight mb-8">
              {isEditing ? "Edit Employment Info" : "Employment Details"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <DetailField 
                isEditing={isEditing}
                icon={<ShieldCheck />} 
                label="Staff ID" 
                name="staffId"
                value={formData.staffId}
                onChange={handleChange}
              />
              <DetailField 
                isEditing={isEditing}
                icon={<Briefcase />} 
                label="Designation" 
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                type="select"
                options={["Operations", "Human Resources", "Project Management", "Security"]}
              />
              <DetailField 
                isEditing={isEditing}
                icon={<User />} 
                label="Gender" 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                type="select"
                options={["Male", "Female"]}
              />
              <DetailField 
                isEditing={isEditing}
                icon={<Mail />} 
                label="Role" 
                name="role"
                value={formData.role}
                onChange={handleChange}
                type="select"
                options={["Admin", "I.T", "Manager", "Operations"]}
              />
            </div>
          </div>

          {isEditing && (
            <div className="bg-blue-50 rounded-[32px] p-6 flex items-start gap-4 border border-blue-100 animate-pulse">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Tips Pengeditan</p>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed italic font-medium">
                  Pastikan Staff ID tidak diubah sembarangan karena terhubung dengan identitas unik di database.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-komponen dinamis untuk Field
const DetailField = ({ isEditing, icon, label, name, value, onChange, type = "text", options = [] }) => (
  <div className="flex items-start gap-4 group">
    <div className={`p-3 rounded-2xl transition-all ${isEditing ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      {isEditing ? (
        type === "select" ? (
          <select 
            name={name}
            value={value}
            onChange={onChange}
            className="w-full text-sm font-bold text-gray-800 bg-gray-50 border-b-2 border-transparent focus:border-blue-600 outline-none py-1.5 px-2 rounded-lg cursor-pointer mt-1"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            name={name}
            value={value}
            onChange={onChange}
            className="w-full text-sm font-bold text-gray-800 bg-gray-50 border-b-2 border-transparent focus:border-blue-600 outline-none py-1.5 px-2 rounded-lg mt-1"
          />
        )
      ) : (
        <p className="text-sm font-bold text-gray-800 mt-1">{value || '-'}</p>
      )}
    </div>
  </div>
);

export default StaffProfile;