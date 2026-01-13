'use client'

import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login sukses");

    router.push('/Dashboard'); 
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f2f5] relative overflow-hidden font-sans">
      <div className="z-10 w-full max-w-[400px] px-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#7a9d54] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Keboen Bapak</h1>
          </div>
          <p className="text-gray-600 text-sm font-medium">Dashboard Management System</p>
        </div>

        {/* Login Card */}
        <div className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button className="pb-2 px-4 text-blue-600 border-b-2 border-blue-600 font-bold text-sm transition-all">
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Input Username */}
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                placeholder="Username"
                className="w-full py-3 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-500 font-medium"
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {/* Input Password */}
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full py-3 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-500 font-medium"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {/* Remember & Forgot Password Link */}
            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-bold">
                <input 
                  type="checkbox" 
                  checked={formData.remember} 
                  onChange={(e) => setFormData({...formData, remember: e.target.checked})} 
                  className="w-4 h-4 rounded text-blue-600 border-gray-300" 
                />
                Remember Me
              </label>
              
              <Link 
                href="/ForgetPassword" 
                className="text-blue-600 hover:underline font-bold"
              >
                Forgot Password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded-md font-bold shadow-md transition-all active:scale-95"
            >
              Sign In
            </button>

            <div className="text-center pt-2">
              <span className="text-gray-600 text-sm font-medium">Don't have an account? </span>
              <Link 
                href="/Register" 
                className="text-blue-600 hover:underline text-sm font-bold"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;