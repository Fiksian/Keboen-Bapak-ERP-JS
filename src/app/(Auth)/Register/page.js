'use client';

import { useState } from 'react';
import { HelpCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Register = () => { 
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phonePrefix: '+62',
    phoneNumber: ''
  });

  // LOGIKA HARUS DI DALAM FUNGSI INI
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 1. Validasi Minimal Password
    if (formData.password.length < 6) {
      alert("Password minimal 6 karakter!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Password konfirmasi tidak cocok!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username, 
          email: formData.email, 
          password: formData.password,
          phone: formData.phonePrefix + formData.phoneNumber
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Akun berhasil dibuat! Silakan Login.");
        router.push('/Login');
      } else {
        // Menampilkan pesan error spesifik dari API (misal: "User sudah terdaftar")
        alert(data.message || "Gagal mendaftar");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f2f5] font-sans">
      
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#7a9d54] rounded-lg flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-xl">K</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a2b3c] tracking-tight">Keboen Bapak</h1>
      </div>

      <div className="w-full max-w-[420px] bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="flex items-center gap-2 mb-8">
          <Link 
            href="/Login" 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ChevronLeft size={20} />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Create Account</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            required
            value={formData.username}
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
          />

          <input
            type="email"
            placeholder="Email Address"
            required
            value={formData.email}
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            required
            value={formData.password}
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={formData.confirmPassword}
            className="w-full py-3.5 px-4 bg-[#f8f9fb] border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 placeholder:text-gray-500 font-bold"
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />
          
          <div className="flex items-center w-full">
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
            </div>

            <input
              type="tel"
              placeholder="Phone Number"
              required
              value={formData.phoneNumber}
              className="flex-1 h-[52px] px-4 bg-[#f8f9fb] border border-gray-200 rounded-r-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm text-gray-800 font-bold"
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 ${loading ? 'bg-gray-400' : 'bg-[#1890ff] hover:bg-[#40a9ff]'} text-white rounded-lg font-bold shadow-lg transition-all active:scale-[0.98]`}
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;