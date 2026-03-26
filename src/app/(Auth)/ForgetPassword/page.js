"use client";

import { useState } from 'react';
import { ChevronLeft, HelpCircle, CheckCircle2, User, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const ForgetPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [step, setStep] = useState(1); // 1: Cari User, 2: Reset Password, 3: Sukses
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Step 1: Cek apakah user ada di database
  const handleCheckUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/auth/forget/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();
      if (response.ok) {
        setStep(2);
      } else {
        setMessage({ type: 'error', text: data.message || 'User tidak ditemukan.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Kirim Password baru dan lama untuk divalidasi
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forget/reset-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, ...passwordData }),
      });

      const data = await response.json();
      if (response.ok) {
        setStep(3);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal memperbarui password.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memproses permintaan.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f2f5] relative overflow-hidden font-sans">
      
      {/* Header Logo */}
      <div className="text-center mb-10 z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#7a9d54] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">KB</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Keboen Bapak</h1>
        </div>
        <p className="text-gray-700 text-sm font-bold tracking-wide">Dashboard Management System</p>
      </div>

      <div className="z-10 w-full max-w-[420px] px-6">
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Link href="/Login" className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={24} /></Link>
                <h2 className="text-xl font-extrabold text-gray-900">Cari Akun</h2>
              </div>
              <p className="text-sm text-gray-700 mb-6 font-medium">Masukkan Username atau Email untuk memverifikasi akun Anda.</p>
              {message.text && <div className="mb-4 p-3 rounded-lg text-xs font-bold bg-red-50 border border-red-100 text-red-600">{message.text}</div>}
              <form onSubmit={handleCheckUser} className="space-y-5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text" required placeholder="Username or Email"
                    className="w-full text-slate-500 py-3.5 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-[#1890ff] text-white rounded-lg font-extrabold flex justify-center items-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Verifikasi Akun"}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={24} /></button>
                <h2 className="text-xl font-extrabold text-gray-900">Reset Password</h2>
              </div>
              <p className="text-xs text-blue-600 mb-6 font-bold bg-blue-50 p-2 rounded">Akun ditemukan: {identifier}</p>
              {message.text && <div className="mb-4 p-3 rounded-lg text-xs font-bold bg-red-50 border border-red-100 text-red-600">{message.text}</div>}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPass ? "text" : "password"} required placeholder="Password Lama"
                    className="w-full text-slate-500 py-3.5 pl-10 pr-10 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                    value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPass ? "text" : "password"} required placeholder="Password Baru"
                    className="w-full text-slate-500 py-3.5 pl-10 pr-10 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                    value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPass ? "text" : "password"} required placeholder="Konfirmasi Password Baru"
                    className="w-full text-slate-500 py-3.5 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
                    value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-extrabold flex justify-center items-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100"><CheckCircle2 size={40} /></div></div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Password Diperbarui!</h2>
              <p className="text-sm text-gray-700 mb-8 font-medium">Password Anda telah berhasil diubah. Silakan login kembali.</p>
              <Link href="/Login" className="w-full py-3 bg-gray-900 text-white rounded-lg font-extrabold block text-center">Login Sekarang</Link>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 w-full text-center">
        <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Copyright © 2026 Keboen Bapak. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default ForgetPassword;