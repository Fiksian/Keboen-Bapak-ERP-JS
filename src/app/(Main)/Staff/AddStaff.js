'use client';

import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, Camera, Loader2, 
  CreditCard, Briefcase, ShieldCheck, UserPlus, Fingerprint, Lock
} from 'lucide-react';

const AddStaff = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Staff',
    designation: '',
    gender: 'Male'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Staff successfully added with Auto-ID!");
        setFormData({ 
          username: '', password: '', firstName: '', lastName: '', 
          email: '', phone: '', role: 'Staff', 
          designation: '', gender: 'Male'
        });
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

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className='bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100'>
        
        {/* Header Modal */}
        <div className='flex justify-between items-center p-8 border-b border-gray-50 bg-gray-50/50'>
          <div className='flex items-center gap-4'>
            <div className='bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100'>
                <UserPlus size={24} />
            </div>
            <div>
              <h2 className='text-xl font-black text-gray-900 uppercase tracking-tight'>Add New Staff</h2>
              <p className='text-xs text-gray-500 font-bold'>Create a new member account and profile</p>
            </div>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-white hover:shadow-md rounded-full transition-all cursor-pointer active:scale-90'>
            <X size={20} className='text-gray-400'/>
          </button>
        </div>

        {/* Body AddStaff */}
        <div className='p-8 max-h-[75vh] overflow-y-auto custom-scrollbar'>
          <form onSubmit={handleSubmit} className='space-y-8'>

            {/* Upload Foto Section - TETAP ADA */}
            <div className='flex flex-col items-center justify-center'>
              <div className='relative group'>
                <div className='w-32 h-32 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30'>
                    <Camera size={32} className='text-gray-300 group-hover:text-blue-400 transition-colors' />
                    <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer'>
                      <span className='text-[10px] text-white font-black uppercase tracking-widest'>Upload</span>
                    </div>
                </div>
                <input type='file' className='absolute inset-0 opacity-0 cursor-pointer' disabled={loading} />
              </div>
              <p className='text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter'>JPG, PNG or WEBP (MAX. 2MB)</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
              
              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Username</label>
                <div className='relative'>
                  <Fingerprint size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="username" required value={formData.username} onChange={handleChange} type='text' placeholder='sandra.w' className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Password</label>
                <div className='relative'>
                  <Lock size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="password" required value={formData.password} onChange={handleChange} type='password' placeholder='••••••••' className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>First Name</label>
                <div className='relative'>
                  <User size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="firstName" required value={formData.firstName} onChange={handleChange} type='text' placeholder='Sandra' className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Last Name</label>
                <input name="lastName" required value={formData.lastName} onChange={handleChange} type='text' placeholder='Williams' className='w-full px-5 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700' />
              </div>

              {/* Staff ID - SEKARANG READ ONLY */}
              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Staff ID (Auto)</label>
                <div className='relative'>
                  <CreditCard size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input disabled value="WILL BE GENERATED" className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-100/50 rounded-2xl text-xs font-bold text-gray-400 italic cursor-not-allowed' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Designation</label>
                <div className='relative'>
                  <Briefcase size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="designation" required value={formData.designation} onChange={handleChange} type='text' placeholder='Operational Manager' className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1'>Email Address</label>
                <div className='relative'>
                  <Mail size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="email" required value={formData.email} onChange={handleChange} type="email" placeholder="sandra@keboenbapak.com" className="w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="phone" required value={formData.phone} onChange={handleChange} type="tel" placeholder="08123456789" className="w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700" />
                </div>
              </div>

              <div className='space-y-2'>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Access Role</label>
                <div className='relative'>
                  <ShieldCheck size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10'/>
                  <select name="role" value={formData.role} onChange={handleChange} className='w-full pl-12 pr-4 py-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none appearance-none transition-all text-sm font-bold text-gray-700 cursor-pointer'>
                    <option value="Staff">Staff Member</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Gender</label>
                <div className='flex items-center gap-4 h-[50px]'>
                  <label className={`flex-1 flex items-center justify-center gap-2 border rounded-2xl cursor-pointer transition-all ${formData.gender === 'Male' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-100 text-gray-500'}`}>  
                    <input type='radio' name='gender' value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className='hidden' />
                    <span className='text-xs font-black uppercase'>Male</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 border rounded-2xl cursor-pointer transition-all ${formData.gender === 'Female' ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-100' : 'bg-white border-gray-100 text-gray-500'}`}>  
                    <input type='radio' name='gender' value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className='hidden' />
                    <span className='text-xs font-black uppercase'>Female</span>
                  </label>
                </div>
              </div>
            </div>

            <div className='flex gap-4 pt-8 border-t border-gray-50'>
              <button type='button' onClick={onClose} disabled={loading} className='flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all'>Cancel</button>
              <button type='submit' disabled={loading} className='flex-[2] py-4 text-xs font-black bg-blue-600 text-white hover:bg-black rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'>
                {loading ? <Loader2 size={18} className='animate-spin' /> : <span>Submit & Create Account</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>  
  )
}

export default AddStaff;