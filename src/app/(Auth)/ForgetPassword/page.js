"use client";

import { useState } from 'react';
import { Mail, ChevronLeft, HelpCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link'; // Import Link

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset link sent to:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f2f5] relative overflow-hidden font-sans">
      
      <div className="text-center mb-10 z-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#7a9d54] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Keboen Bapak</h1>
        </div>
        <p className="text-gray-700 text-sm font-bold tracking-wide">Dashboard Management System</p>
      </div>

      <div className="z-10 w-full max-w-[420px] px-6">
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          {!isSubmitted ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                {/* Perbaikan: Gunakan Link untuk kembali ke Login */}
                <Link 
                  href="/Login" 
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                  <ChevronLeft size={24} />
                </Link>
                <h2 className="text-xl font-extrabold text-gray-900">Forgot Password</h2>
              </div>

              <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full py-3.5 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-500 font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded-lg font-extrabold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                  <CheckCircle2 size={40} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-700 mb-8 leading-relaxed font-medium">
                We have sent a password reset link to <br />
                <span className="font-extrabold text-blue-600 underline decoration-2 underline-offset-4">{email}</span>
              </p>
              {/* Perbaikan: Gunakan Link untuk tombol sukses */}
              <Link 
                href="/Login"
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-extrabold hover:bg-gray-800 transition-all shadow-md inline-block text-center"
              >
                Back to Login
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            {/* Perbaikan: Gunakan Link untuk teks bawah */}
            <Link 
              href="/Login"
              className="text-blue-600 hover:text-blue-700 text-sm font-extrabold transition-colors underline-offset-2 hover:underline"
            >
              Remember your password? Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 w-full text-center">
        <p className="text-gray-500 text-xs font-bold tracking-wider">
          COPYRIGHT © 2026 KEBOEN BAPAK. ALL RIGHTS RESERVED.
        </p>
      </div>

      <button 
        type="button"
        className="fixed bottom-8 right-8 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all border border-gray-100 active:scale-90"
      >
        <HelpCircle size={24} />
      </button>
    </div>
  );
};

export default ForgetPassword;