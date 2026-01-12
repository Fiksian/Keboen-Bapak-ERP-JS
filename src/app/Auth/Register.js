'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronLeft } from 'lucide-react';

const Register = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phonePrefix: '+62',
    phoneNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) {
      alert("Password tidak cocok!");
      return;
    }
    // Tambahkan logika API register di sini jika sudah ada backend
    console.log("Registering User:", formData);
    alert("Registrasi Berhasil! Silahkan Login.");
    onNavigate(); // Kembali ke halaman Login
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f2f5] font-sans">
      
      {/* Brand Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#7a9d54] rounded-lg flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-xl">K</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b3c] tracking-tight">Keboen Bapak</h1>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-[420px] bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        {/* Header: Back Button & Title */}
        <div className="flex items-center gap-2 mb-8">
          <button 
            type="button"
            onClick={onNavigate} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            title="Kembali ke Login"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Create Account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            required
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          {/* Confirm Password */}
          <input
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />
          
          {/* Phone Number Input Group */}
          <div className="flex items-center w-full group">
            {/* Country Selector */}
            <div className="relative">
              <select 
                className="appearance-none h-[52px] w-[100px] pl-4 pr-6 bg-[#f8f9fb] border border-gray-200 border-r-0 rounded-l-lg text-sm text-gray-800 font-bold outline-none cursor-pointer focus:border-blue-500 transition-all"
                value={formData.phonePrefix}
                onChange={(e) => setFormData({...formData, phonePrefix: e.target.value})}
              >
                <option value="+62">🇮🇩 +62</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+86">🇨🇳 +86</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Input Field */}
            <input
              type="tel"
              placeholder="Phone Number"
              required
              className="flex-1 h-[52px] px-4 bg-[#f8f9fb] border border-gray-200 rounded-r-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold border-l-gray-300"
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full py-4 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              Register Now
            </button>
          </div>
          
          {/* Link to Login */}
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={onNavigate} 
              className="text-[#1890ff] hover:underline text-sm font-bold transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>

      {/* Floating Help Button */}
      <button className="fixed bottom-8 right-8 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all border border-gray-100 group">
        <HelpCircle size={24} />
        <span className="absolute right-14 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Butuh bantuan?
        </span>
      </button>

    </div>
  );
};

export default Register;