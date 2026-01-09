import React, {useState} from 'react'
import { X, Upload, User, Mail, Phone, Briefcase, Camera } from 'lucide-react';

const AddStaff = ({isOpen, onClose}) => {
  if(!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className='bg-white w-full max-x-2xl py-4 px-4 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200'>
        
        {/* Header Modal */}
        <div className='flex justify-between items-center p-6 border-b border-gray-100'>
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Add Staff</h2>
            <p className='text-sm text-gray-500'>Input Staff Data and Profile Picture</p>
          </div>
          <button 
          onClick={onClose}
          className='p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer'
          >
            <X size={20} className='text-gray-500'/>
          </button>
        </div>

        {/* Body AddStaff */}
        <div className='p-8 max-h-[80vh] overflow-y-auto custom-scrollbar'>
          <form className='space-y-6'>

            {/* Upload Foto */}
            <div className='flex flex-col items-center justify-center mb-8'>
              <div className='relative group'>
                <div className='w-28 h-28 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400'>
                    <Camera size={32} className='text-gray-300 group-hover:text-blue-400' />
                    {/* Overlay Upload ketika hover */}
                    <div className='absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full'>
                      <span className='text-[10px] text-white font-bold uppercase'>Change Photo</span>
                    </div>
                </div>
                <input type='file' className='absolute inset-0 opacity-0 cursor-pointer'></input>
              </div>
              <p className='text-[11px] text-gray-400 mt-2 italic'>Allowed file type: png, jpg, jpeg(Max 2MB)</p>
            </div>

            {/* Input Field Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* input-items */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>First Name</label>
                <div className='relative'>
                  <User size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input type='text' placeholder='e.g Sandra' className='w-full pl-10 pr-4 py-2.5 border text-gray-400 border-gray-200 rounded-xl focus-ring-2 focus:ring-blue/20 focus:border-blue-500 outline-none transition-all text-sm' />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Last Name</label>
                <input type='text' placeholder='e.g Williams' className='w-full pl-10 pr-4 py-2.5 border text-gray-400 border-gray-200 rounded-xl focus-ring-2 focus:ring-blue/20 focus:border-blue-500 outline-none transition-all text-sm' />
              </div>

              <div className='space-y-2'>
                <label className='text-xs font-bold text-gray-600 uppercase'>Email Address</label>
                <div className='relative'>
                  <Mail size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'/>
                  <input type="email" placeholder="sandra@keboenbapak.com" className="w-full pl-10 pr-4 py-2.5 text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" />              </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" placeholder="0813xxxxxxx" className="w-full pl-10 pr-4 py-2.5 text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" />
                </div>
              </div>

              <div className='space-y-2'>
                <label className="text-xs font-bold text-gray-600 uppercase">Role</label>
                <select className='text-gray-400 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue outline-none bg-white transition-all text-sm'>
                  <option>Admin</option>
                  <option>I.T</option>
                  <option>Manager</option>
                  <option>Operations</option>
                </select>
              </div>

              <div className='space-y-2'>
                <label className="text-xs font-bold text-gray-600 uppercase">Gender</label>
                <div className='flex items-center gap-2 cursor-pointer'>
                  <label className='flex items-center gap-2 cursor-pointer'>  
                    <input type='radio' name='gender' className='w-4 h-4 text-blue-600' />
                    <span className='text-sm text-gray-600'>Male</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>  
                    <input type='radio' name='gender' className='w-4 h-4 text-blue-600' />
                    <span className='text-sm text-gray-600'>Female</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tombol */}
            <div className='flex gap-3 pt-6 border-t border-gray-50'>
              <button type='button' onClick={onClose} className='flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer'>Cancel</button>
              <button type='button' className='flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer'>Save Staff</button>
            </div>

          </form>
        </div>
      </div>
    </div>  
  )
}

export default AddStaff