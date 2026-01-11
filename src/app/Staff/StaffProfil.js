import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Phone, MapPin, 
  Calendar, Briefcase, ShieldCheck, 
  User, Edit, FileText, Save, X, Camera
} from 'lucide-react';

const StaffProfile = ({ staff, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...staff });

  if (!staff) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Di sini Anda bisa memanggil API untuk update data
    console.log("Saving data:", formData);
    setIsEditing(false);
    if (onUpdate) onUpdate(formData);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-full p-4 md:p-8 lg:p-10 space-y-8">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={isEditing ? () => setIsEditing(false) : onBack}
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
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-bold text-sm"
          >
            <Edit size={16} />
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-200 transition-all active:scale-95 font-bold text-sm"
          >
            <Save size={16} />
            Simpan Perubahan
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
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-4 border-white hover:bg-blue-700 transition-all">
                  <Camera size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <input 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full text-center p-2 border-b-2 border-blue-100 focus:border-blue-600 outline-none font-bold text-gray-800"
                    placeholder="First Name"
                  />
                  <input 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full text-center p-2 border-b-2 border-blue-100 focus:border-blue-600 outline-none font-bold text-gray-800"
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
                <span className={isEditing ? 'italic opacity-50' : ''}>
                  {formData.firstName.toLowerCase()}@keboenbapak.com
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 justify-center">
                <Phone size={16} className="text-gray-400" />
                {isEditing ? (
                   <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="p-1 border-b border-gray-200 focus:border-blue-600 outline-none text-center"
                   />
                ) : formData.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Detail */}
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
                isEditing={false} // Selalu non-edit untuk Joined Date
                icon={<Calendar />} 
                label="Joined Date" 
                value="12 Jan 2024" 
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
                  Pastikan Staff ID sesuai dengan format departemen untuk sinkronisasi otomatis ke sistem payroll.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-komponen dinamis untuk Field (Bisa Tampil/Edit)
const DetailField = ({ isEditing, icon, label, name, value, onChange, type = "text", options = [] }) => (
  <div className="flex items-start gap-4 group">
    <div className={`p-3 rounded-2xl transition-all ${isEditing ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
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
            className="w-full text-sm font-bold text-gray-800 bg-transparent border-b-2 border-blue-100 focus:border-blue-600 outline-none py-1 appearance-none cursor-pointer"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            name={name}
            value={value}
            onChange={onChange}
            className="w-full text-sm font-bold text-gray-800 bg-transparent border-b-2 border-blue-100 focus:border-blue-600 outline-none py-1"
          />
        )
      ) : (
        <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
      )}
    </div>
  </div>
);

export default StaffProfile;