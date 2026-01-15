'use client'

import React, { useState } from 'react';
import { X, User, Mail, Phone, Camera, Loader2, CreditCard, Briefcase } from 'lucide-react';

const AddStaff = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    staffId: '',
    role: 'Admin',
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
        alert("Staff successfully added!");
        onClose(); // Menutup modal dan memicu refresh di StaffManager
        setFormData({ // Reset form
          firstName: '', lastName: '', email: '', phone: '',
          staffId: '', role: 'Admin', designation: '', gender: 'Male'
        });
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className='bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden'>
        
        {/* Header Modal */}
        <div className='flex justify-between items-center p-6 border-b border-gray-100'>
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Add Staff</h2>
            <p className='text-sm text-gray-500'>Input Staff Data and Profile Picture</p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer'>
            <X size={20} className='text-gray-500'/>
          </button>
        </div>

        {/* Body AddStaff */}
        <div className='p-8 max-h-[80vh] overflow-y-auto custom-scrollbar'>
          <form onSubmit={handleSubmit} className='space-y-6'>

            {/* Upload Foto (UI Only for now) */}
            <div className='flex flex-col items-center justify-center mb-8'>
              <div className='relative group'>
                <div className='w-28 h-28 bg-gray-50 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400'>
                    <Camera size={32} className='text-gray-300 group-hover:text-blue-400' />
                    <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full'>
                      <span className='text-[10px] text-white font-bold uppercase'>Change Photo</span>
                    </div>
                </div>
                <input type='file' className='absolute inset-0 opacity-0 cursor-pointer' disabled={loading} />
              </div>
              <p className='text-[11px] text-gray-400 mt-2 italic'>Allowed file type: png, jpg (Max 2MB)</p>
            </div>

            {/* Input Field Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              
              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>First Name</label>
                <div className='relative'>
                  <User size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="firstName" required value={formData.firstName} onChange={handleChange} type='text' placeholder='e.g Sandra' className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Last Name</label>
                <input name="lastName" required value={formData.lastName} onChange={handleChange} type='text' placeholder='e.g Williams' className='w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700' />
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Staff ID</label>
                <div className='relative'>
                  <CreditCard size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="staffId" required value={formData.staffId} onChange={handleChange} type='text' placeholder='e.g 0246AHR' className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 font-mono' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Designation</label>
                <div className='relative'>
                  <Briefcase size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="designation" required value={formData.designation} onChange={handleChange} type='text' placeholder='e.g Human Resources' className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Email Address</label>
                <div className='relative'>
                  <Mail size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input name="email" required value={formData.email} onChange={handleChange} type="email" placeholder="sandra@email.com" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="0813xxxxxxx" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700" />
                </div>
              </div>

              <div className='space-y-2'>
                <label className="text-xs font-bold text-gray-600 uppercase">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className='w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all text-sm text-gray-700'>
                  <option value="Admin">Admin</option>
                  <option value="I.T">I.T</option>
                  <option value="Manager">Manager</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className='space-y-2'>
                <label className="text-xs font-bold text-gray-600 uppercase">Gender</label>
                <div className='flex items-center gap-6 h-[42px]'>
                  <label className='flex items-center gap-2 cursor-pointer'>  
                    <input type='radio' name='gender' value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className='w-4 h-4 text-blue-600' />
                    <span className='text-sm text-gray-600'>Male</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>  
                    <input type='radio' name='gender' value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className='w-4 h-4 text-blue-600' />
                    <span className='text-sm text-gray-600'>Female</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tombol Action */}
            <div className='flex gap-3 pt-6 border-t border-gray-50'>
              <button type='button' onClick={onClose} disabled={loading} className='flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all'>Cancel</button>
              <button type='submit' disabled={loading} className='flex-1 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2'>
                {loading ? <Loader2 size={18} className='animate-spin' /> : 'Save Staff'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>  
  )
}

export default AddStaff