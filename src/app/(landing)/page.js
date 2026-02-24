'use client'

import React from 'react';
import { 
  ArrowRight, Leaf, ShieldCheck, Zap, 
  ChevronRight, Globe, BarChart3, Package 
} from 'lucide-react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#8da070]/30">
      
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#8da070] p-2 rounded-xl">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-xl font-black uppercase italic tracking-tighter">
              Keboen<span className="text-[#8da070]">Bapak</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <a href="#features" className="hover:text-[#8da070] transition-colors">Fitur</a>
            <a href="#about" className="hover:text-[#8da070] transition-colors">Tentang Kami</a>
            <Link 
              href="https://sali.keboenbapak.id" 
              className="bg-slate-900 text-white px-6 py-3 rounded-full hover:bg-[#8da070] transition-all shadow-xl shadow-slate-200"
            >
              Masuk ke Sistem
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#8da070]/10 text-[#8da070] px-4 py-2 rounded-full">
              <Zap size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Next-Gen Farming System</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
              Digitizing <br />
              <span className="text-[#8da070]">Agriculture.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-md font-medium leading-relaxed">
              Platform integrasi cerdas untuk manajemen stok, produksi, hingga laporan keuangan kebun Anda dalam satu dashboard dashboard transparan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="https://sali.keboenbapak.id" 
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#8da070] transition-all"
              >
                Mulai Kelola Sekarang
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-[#8da070]/10 rounded-[40px] blur-3xl" />
            <div className="relative bg-slate-50 rounded-[40px] border border-slate-100 overflow-hidden shadow-2xl">
              <div className="p-4 bg-white border-b border-slate-100 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="p-8 space-y-6">
                <div className="h-8 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-[#8da070]/20 rounded-3xl" />
                  <div className="h-32 bg-slate-200 rounded-3xl" />
                </div>
                <div className="h-40 bg-slate-100 rounded-3xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-xs font-black text-[#8da070] uppercase tracking-[0.4em]">Core Capabilities</h2>
            <p className="text-4xl font-black uppercase italic tracking-tighter">Solusi End-to-End untuk Kebun Modern</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart3 size={32} />}
              title="Real-time Analytics"
              desc="Pantau arus kas, laba rugi, dan statistik produksi harian secara presisi."
            />
            <FeatureCard 
              icon={<Package size={32} />}
              title="Inventory Guard"
              desc="Sistem peringatan dini saat stok bahan baku mencapai batas minimum."
            />
            <FeatureCard 
              icon={<ShieldCheck size={32} />}
              title="Audit Traceability"
              desc="Setiap perubahan stok dan transaksi tercatat otomatis dalam log sistem."
            />
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale">
            <Leaf size={18} />
            <span className="font-black uppercase italic tracking-tighter text-sm">KeboenBapak © 2026</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Built for efficiency. Powered by Intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-10 rounded-[32px] border border-slate-100 hover:border-[#8da070]/30 hover:shadow-xl hover:shadow-[#8da070]/5 transition-all group">
    <div className="text-[#8da070] mb-6 group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

export default LandingPage;