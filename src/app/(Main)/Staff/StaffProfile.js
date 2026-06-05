'use client'

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Mail, Phone, Briefcase, Shield, Save,
  User, Camera, Loader2, CreditCard,
  Home, ChevronDown, BadgeCheck, UploadCloud, MapPin, IdCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

// ─── Komponen Avatar — tampil foto jika ada, fallback ke inisial ──────────────
const StaffAvatar = ({ firstName, lastName, imageUrl, size = 'lg' }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state ketika imageUrl berubah
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  const palettes = [
    { bg: 'bg-blue-500',    text: 'text-white' },
    { bg: 'bg-violet-500',  text: 'text-white' },
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-amber-500',   text: 'text-white' },
    { bg: 'bg-rose-500',    text: 'text-white' },
    { bg: 'bg-cyan-600',    text: 'text-white' },
    { bg: 'bg-pink-500',    text: 'text-white' },
    { bg: 'bg-slate-700',   text: 'text-white' },
  ];
  const palette   = palettes[(firstName?.charCodeAt(0) || 0) % palettes.length];
  const sizeClass = size === 'lg'
    ? 'w-28 h-28 md:w-32 md:h-32 text-3xl rounded-[2rem]'
    : 'w-20 h-20 text-xl rounded-2xl';

  if (imageUrl && !imgError) {
    return (
      <div className={`${sizeClass} relative overflow-hidden border-4 border-white shadow-xl`}>
        <Image
          src={imageUrl}
          alt={`${firstName} ${lastName}`}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${palette.bg} flex items-center justify-center border-4 border-white shadow-xl`}>
      <span className={`font-black ${palette.text}`}>{initials}</span>
    </div>
  );
};

// ─── Komponen utama ────────────────────────────────────────────────────────────
const StaffProfile = ({ staff, onBack, onUpdate }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [roles, setRoles]               = useState([]);
  const [imagePreview, setImagePreview] = useState(staff?.image || null);

  // 🔄 Reset form state ketika staff prop berubah (misal setelah update)
  useEffect(() => {
    if (staff) {
      setFormData({
        firstName:   staff.firstName   || '',
        lastName:    staff.lastName    || '',
        email:       staff.email       || '',
        phone:       staff.phone       || '',
        designation: staff.designation || '',
        role:        staff.role        || '',
        gender:      staff.gender      || '',
        staffId:     staff.staffId     || '',
        identityNo:  staff.identityNo  || '',
        address:     staff.address     || '',
        image:       null,
      });
      setImagePreview(staff.image || null);
    }
  }, [staff]);

  const [formData, setFormData] = useState({
    firstName:   staff?.firstName   || '',
    lastName:    staff?.lastName    || '',
    email:       staff?.email       || '',
    phone:       staff?.phone       || '',
    designation: staff?.designation || '',
    role:        staff?.role        || '',
    gender:      staff?.gender      || '',
    staffId:     staff?.staffId     || '',
    identityNo:  staff?.identityNo  || '',
    address:     staff?.address     || '',
    image:       null,
  });

  const isAdmin = session?.user?.role === 'SuperAdmin';

  useEffect(() => {
    if (!isAdmin) return;
    const fetchRoles = async () => {
      try {
        const res  = await fetch('/api/auth/roles');
        const data = await res.json();
        setRoles(Object.keys(data).filter(r => r !== 'SuperAdmin'));
      } catch (error) {
        console.error("Gagal mengambil data role:", error);
      }
    };
    fetchRoles();
  }, [isAdmin]);

  const designationOptions = [
    'IT Support', 'Farm Worker', 'Accountant', 'Manager',
    'Marketing', 'Maintenance', 'New Employee', 'Test Akun'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("File terlalu besar. Maksimal 2MB."); return; }
    setFormData(prev => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('firstName',   formData.firstName);
      payload.append('lastName',    formData.lastName);
      payload.append('phone',       formData.phone);
      payload.append('gender',      formData.gender);
      payload.append('email',       formData.email);
      payload.append('designation', formData.designation);
      payload.append('role',        formData.role);
      payload.append('identityNo',  formData.identityNo);
      payload.append('address',     formData.address);
      if (formData.image) {
        payload.append('file', formData.image);
      }

      const res = await fetch(`/api/staff/${staff.id}`, { method: 'PATCH', body: payload });
      if (res.ok) {
        alert("Profil dan akses berhasil diperbarui!");
        if (onUpdate) onUpdate();  // memicu refresh data staff di parent
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
      {/* Header Card */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden mt-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-40" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          {/* Avatar + upload overlay */}
          <div className="relative group shrink-0">
            <input
              id="staff-profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={loading}
            />
            <label htmlFor="staff-profile-photo" className="cursor-pointer block">
              <StaffAvatar
                firstName={formData.firstName}
                lastName={formData.lastName}
                imageUrl={imagePreview}
                size="lg"
              />
              <div className="absolute inset-0 rounded-[2rem] bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </label>
            <div className="absolute -bottom-1 -right-1 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all border-2 border-white pointer-events-none">
              <Camera size={16} />
            </div>
          </div>

          <div className="text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
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
            <button onClick={isAdmin ? onBack : () => router.push('/Dashboard')}
              className="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 active:scale-95 border border-gray-100">
              {isAdmin ? <ArrowLeft size={20} /> : <Home size={20} />}
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase italic tracking-widest shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Update Records</span>
            </button>
          </div>
        </div>

        {imagePreview && imagePreview !== staff?.image && (
          <div className="mt-6 relative">
            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Foto baru siap disimpan
            </p>
            <label htmlFor="staff-profile-photo"
              className="relative flex items-center justify-center w-full min-h-[80px] rounded-[20px] border-2 border-dashed border-green-400 bg-green-50/30 cursor-pointer overflow-hidden hover:bg-green-50 transition-all">
              <img src={imagePreview} alt="Preview Foto Baru" className="w-full h-[120px] object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Camera size={14} /> Ganti Foto
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* ── Grid form ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Personal Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User size={18} /></div>
              <h3 className="text-sm font-black text-gray-800 uppercase italic tracking-widest">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input name="firstName" value={formData.firstName} onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input name="lastName" value={formData.lastName} onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-700 text-sm" />
              </div>
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                <div className="relative">
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                <div className="relative">
                  <input name="phone" value={formData.phone} onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm" />
                  <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* No. KTP */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. KTP / Identitas</label>
                <div className="relative">
                  <input name="identityNo" value={formData.identityNo} onChange={handleChange} placeholder="3271xxxxxxxxxxxxxx"
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm" />
                  <IdCard size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-2 space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Secure Email (System Access)</label>
                <div className="relative">
                  <input name="email" type="email" value={formData.email} onChange={handleChange}
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm" />
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="flex items-center gap-1.5 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Shield size={12} className="text-amber-600" />
                  <p className="text-[9px] text-amber-700 font-black uppercase italic tracking-tighter leading-none">Warning: Updating email will change login credentials.</p>
                </div>
              </div>

              {/* Alamat */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Alamat Lengkap</label>
                <div className="relative">
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={3} placeholder="Jl. Contoh No. 12..."
                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm resize-none" />
                  <MapPin size={14} className="absolute left-5 top-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role & Privilege */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-50 rounded-lg text-red-600"><Briefcase size={18} /></div>
              <h3 className="text-sm font-black text-gray-800 uppercase italic tracking-widest">Role & Privilege</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Designation</label>
                {isAdmin ? (
                  <div className="relative">
                    <select name="designation" value={formData.designation} onChange={handleChange}
                      className="w-full pl-5 pr-12 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer">
                      {designationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
                    <select name="role" value={formData.role} onChange={handleChange}
                      className="w-full pl-5 pr-12 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-black text-gray-700 text-sm appearance-none cursor-pointer italic">
                      {roles.length > 0
                        ? roles.map(r => <option key={r} value={r}>{r}</option>)
                        : <option value={formData.role}>{formData.role}</option>
                      }
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
                <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-900 rounded-2xl text-white font-mono text-[10px] border border-gray-800 shadow-lg uppercase tracking-widest">
                  <CreditCard size={14} className="text-blue-400" />
                  {formData.staffId}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky footer ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 md:hidden z-50 flex gap-2">
        <button onClick={isAdmin ? onBack : () => router.push('/Dashboard')}
          className="p-4 bg-gray-100 text-gray-600 rounded-2xl flex-1 flex justify-center items-center active:scale-95">
          {isAdmin ? <ArrowLeft size={20} /> : <Home size={20} />}
        </button>
        <button onClick={handleSave} disabled={loading}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase italic tracking-widest flex-[3] flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Update Records
        </button>
      </div>
    </div>
  );
};

export default StaffProfile;
