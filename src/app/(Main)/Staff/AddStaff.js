'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Camera, Loader2, 
  CreditCard, Briefcase, ShieldCheck, UserPlus, Fingerprint, Lock, ChevronDown,
  UploadCloud, MapPin, IdCard
} from 'lucide-react';

// FINAL — gabungan dari:
//   - UI upload foto + preview (dari file upload)
//   - field identityNo + address (dari output RBAC sebelumnya)
//   - filter SuperAdmin dari dropdown role (dari output RBAC sebelumnya)

const AddStaff = ({ isOpen, onClose }) => {
  const [loading, setLoading]           = useState(false);
  const [roles, setRoles]               = useState([]);
  const [imagePreview, setImagePreview] = useState(null);  // ← dari file upload

  const [formData, setFormData] = useState({
    username:    '',
    password:    '',
    firstName:   '',
    lastName:    '',
    email:       '',
    phone:       '',
    role:        'Staff',
    designation: '',
    gender:      'Male',
    identityNo:  '',   // ← dari output RBAC
    address:     '',   // ← dari output RBAC
    image:       null, // ← dari file upload (File object)
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchRoles = async () => {
      try {
        const res       = await fetch('/api/auth/roles');
        const data      = await res.json();
        // Filter SuperAdmin — tidak boleh di-assign via form
        const roleNames = Object.keys(data).filter(r => r !== 'SuperAdmin');
        setRoles(roleNames);
        if (roleNames.length > 0 && !roleNames.includes('Staff')) {
          setFormData(prev => ({ ...prev, role: roleNames[0] }));
        }
      } catch (error) {
        console.error("Gagal memuat roles:", error);
      }
    };
    fetchRoles();
  }, [isOpen]);

  const designationOptions = [
    'IT Support', 'Farm Worker', 'Accountant', 'Manager',
    'Marketing', 'Maintenance', 'New Employee', 'Test Akun'
  ];

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler foto — pola identik dengan ArrivalModal
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 2MB.");
      return;
    }
    setFormData(prev => ({ ...prev, image: file }));
    const reader      = new FileReader();
    reader.onloadend  = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Submit via FormData agar bisa kirim foto
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.designation) {
      alert("Please select a designation");
      return;
    }
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('username',    formData.username.toLowerCase().trim());
      payload.append('password',    formData.password);
      payload.append('firstName',   formData.firstName);
      payload.append('lastName',    formData.lastName);
      payload.append('email',       formData.email);
      payload.append('phone',       formData.phone);
      payload.append('role',        formData.role);
      payload.append('designation', formData.designation);
      payload.append('gender',      formData.gender);
      payload.append('identityNo',  formData.identityNo);  // ← dari output RBAC
      payload.append('address',     formData.address);     // ← dari output RBAC

      // Key 'file' — sama dengan receive/route.js: data.get("file")
      if (formData.image) {
        payload.append('file', formData.image);
      }

      const res  = await fetch('/api/staff', {
        method: 'POST',
        // Jangan set Content-Type — browser otomatis atur multipart/form-data
        body:   payload,
      });
      const data = await res.json();

      if (res.ok) {
        alert("Staff berhasil ditambahkan dengan Auto-ID!");
        handleReset();
        onClose();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Connection error: Please check your internet or server.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      username: '', password: '', firstName: '', lastName: '',
      email: '', phone: '', role: 'Staff',
      designation: '', gender: 'Male',
      identityNo: '', address: '', image: null
    });
    setImagePreview(null);
  };

  const handleClose = () => { handleReset(); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300 text-left">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      <div className="relative z-10 bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300 overflow-hidden border border-gray-100 flex flex-col max-h-[95vh] md:max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-blue-600 p-2.5 md:p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
              <UserPlus size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight italic">Add New Staff</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter opacity-70">Create new account profile</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all active:scale-90">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
          <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

            {/* Upload foto */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="relative w-full max-w-xs">
                <input
                  id="staff-photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={loading}
                />
                <label
                  htmlFor="staff-photo-upload"
                  className="relative flex items-center justify-center w-full min-h-[130px] md:min-h-[160px] rounded-[20px] border-2 border-dashed border-blue-200 bg-blue-50/30 cursor-pointer overflow-hidden hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-[160px] object-cover animate-in fade-in" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <Camera size={14} /> Ganti Foto
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <UploadCloud className="text-blue-400 mx-auto mb-2" size={32} />
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">Upload Foto Profil</p>
                      <p className="text-[9px] text-slate-400 mt-1">Klik atau ambil foto · Maks 2MB</p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-[9px] md:text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest italic">
                JPG, PNG atau WEBP (Maks. 2MB) — Opsional
              </p>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-8 gap-y-4 md:gap-y-6">

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <Fingerprint size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="username" required value={formData.username.toLowerCase().trim()} onChange={handleChange} type="text" placeholder="sandra.w"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="password" required value={formData.password} onChange={handleChange} type="password" placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="firstName" required value={formData.firstName} onChange={handleChange} type="text" placeholder="Sandra"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input name="lastName" required value={formData.lastName} onChange={handleChange} type="text" placeholder="Williams"
                  className="w-full px-4 md:px-5 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
              </div>

              {/* Staff ID (auto) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Staff ID (Auto)</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input disabled value="SYSTEM GENERATED"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-100/50 rounded-2xl text-[10px] font-black text-gray-400 italic cursor-not-allowed uppercase" />
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <select name="designation" required value={formData.designation} onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none appearance-none transition-all text-sm font-bold text-gray-700 cursor-pointer">
                    <option value="" disabled>Select Designation</option>
                    {designationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* No. KTP */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. KTP / Identitas</label>
                <div className="relative">
                  <IdCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="identityNo" value={formData.identityNo} onChange={handleChange} type="text" placeholder="3271xxxxxxxxxxxxxx"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* Access Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Access Role</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <select name="role" value={formData.role} onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none appearance-none transition-all text-sm font-bold text-gray-700 cursor-pointer italic">
                    {roles.length > 0
                      ? roles.map(r => <option key={r} value={r}>{r}</option>)
                      : <option value="Staff">Staff Member</option>
                    }
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="email" required value={formData.email} onChange={handleChange} type="email" placeholder="sandra@keboenbapak.com"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="phone" required value={formData.phone} onChange={handleChange} type="tel" placeholder="08123456789"
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={3} placeholder="Jl. Contoh No. 12, Kel. Contoh..."
                    className="w-full pl-11 pr-4 py-3 md:py-3.5 border border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700 resize-none" />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender Selection</label>
                <div className="flex items-center gap-3 h-[48px] md:h-[50px]">
                  <label className={`flex-1 flex items-center justify-center gap-2 border rounded-2xl cursor-pointer transition-all h-full ${formData.gender === 'Male' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className="hidden" />
                    <span className="text-[10px] font-black uppercase italic">Male</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 border rounded-2xl cursor-pointer transition-all h-full ${formData.gender === 'Female' ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className="hidden" />
                    <span className="text-[10px] font-black uppercase italic">Female</span>
                  </label>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="p-6 md:p-8 border-t border-gray-50 bg-white flex flex-col-reverse md:flex-row gap-3 md:gap-4 shrink-0">
          <button type="button" onClick={handleClose} disabled={loading}
            className="w-full md:flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="add-staff-form" disabled={loading}
            className="w-full md:flex-[2] py-4 text-[10px] font-black bg-gray-900 text-white hover:bg-blue-600 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widest italic">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Create Account Profile</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaff;
