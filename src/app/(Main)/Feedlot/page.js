'use client'

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ClipboardCheck, 
  ArrowRightLeft, 
  Calendar, 
  Hash, 
  Truck, 
  User, 
  MapPin, 
  Tag, 
  Scale,
  Save,
  Lock,
  Leaf
} from 'lucide-react';

const FeedlotInventory = () => {
  const { data: session } = useSession();
  const [activeForm, setActiveForm] = useState('penerimaan'); // penerimaan atau mutasi
  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'ADMIN';

  // State untuk form
  const [formData, setFormData] = useState({
    // Penerimaan
    tanggalTerima: '',
    noPo: '',
    shipmentTerima: '',
    namaImportir: '',
    alamatImportir: '',
    jenisSapiTerima: '',
    noRfidTerima: '',
    noEartagTerima: '',
    beratTerima: '',
    // Mutasi
    tanggalMutasi: '',
    jenisMutasi: 'PENJUALAN',
    shipmentMutasi: '',
    jenisSapiMutasi: '',
    noRfidMutasi: '',
    noEartagMutasi: '',
    beratMutasi: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin && activeForm === 'penerimaan') {
      alert("Hanya Admin yang dapat menambah penerimaan sapi baru.");
      return;
    }
    console.log("Submitting:", formData);
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8faf7] min-h-screen space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER & TOGGLE */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#f1f4eb] text-[#8da070] rounded-2xl">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">
              Feedlot <span className="text-[#8da070]">Inventory</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] italic leading-none mt-1 flex items-center gap-2">
              <Leaf size={10} className="text-[#8da070]" /> Livestock Tracking System
            </p>
          </div>
        </div>

        {/* NAVIGATION TOGGLE */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveForm('penerimaan')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeForm === 'penerimaan' ? 'bg-white text-[#8da070] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Penerimaan Sapi
          </button>
          <button 
            onClick={() => setActiveForm('mutasi')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeForm === 'mutasi' ? 'bg-white text-[#8da070] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mutasi Sapi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORM SECTION */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                <div className="w-2 h-8 bg-[#8da070] rounded-full" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">
                  Informasi {activeForm === 'penerimaan' ? 'Penerimaan' : 'Mutasi'} Baru
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeForm === 'penerimaan' ? (
                  <>
                    {/* INPUT PENERIMAAN SAPI */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar size={12} /> Tanggal Terima
                      </label>
                      <input type="date" name="tanggalTerima" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Hash size={12} /> No PO (Master Link)
                      </label>
                      <input type="text" name="noPo" placeholder="PO-2026-XXXX" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Truck size={12} /> Shipment
                      </label>
                      <input type="text" name="shipmentTerima" placeholder="Nama Kapal/Shipment" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <User size={12} /> Nama Importir
                      </label>
                      <input type="text" name="namaImportir" placeholder="PT. Importir Ternak" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <MapPin size={12} /> Alamat Importir
                      </label>
                      <textarea name="alamatImportir" rows="2" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all resize-none"></textarea>
                    </div>
                  </>
                ) : (
                  <>
                    {/* INPUT MUTASI SAPI */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Calendar size={12} /> Tanggal Mutasi
                      </label>
                      <input type="date" name="tanggalMutasi" onChange={handleInputChange} className="w-full text-slate-600 bg-[#f1f4eb]/50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                        <ArrowRightLeft size={12} /> Jenis Mutasi
                      </label>
                      <select name="jenisMutasi" onChange={handleInputChange} className="w-full text-slate-600 bg-[#f1f4eb]/50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all appearance-none">
                        <option value="PENJUALAN">PENJUALAN</option>
                        <option value="POTONG PAKSA">POTONG PAKSA</option>
                        <option value="PENJUALAN MITRA">PENJUALAN MITRA</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-[#8da070] uppercase tracking-widest flex items-center gap-2 ml-1 italic">
                        <Hash size={12} /> Scan RFID (Otomatis Tarik Data)
                      </label>
                      <input type="text" name="noRfidMutasi" placeholder="Tempel RFID Sapi..." onChange={handleInputChange} className="w-full text-slate-600 bg-white border-2 border-[#f1f4eb] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#8da070] transition-all shadow-lg shadow-[#8da070]/5" />
                    </div>
                  </>
                )}

                {/* SHARED FIELDS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Tag size={12} /> Jenis Sapi
                  </label>
                  <input type="text" name={activeForm === 'penerimaan' ? 'jenisSapiTerima' : 'jenisSapiMutasi'} placeholder="Contoh: Brahman Cross" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Hash size={12} /> No Eartag
                  </label>
                  <input type="text" name={activeForm === 'penerimaan' ? 'noEartagTerima' : 'noEartagMutasi'} placeholder="ET-XXXX" onChange={handleInputChange} className="w-full text-slate-600 bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070]/30 transition-all" />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-black text-[#8da070] uppercase tracking-widest flex items-center gap-2 ml-1 font-bold">
                    <Scale size={12} /> Berat Sapi (KG)
                  </label>
                  <input type="number" name={activeForm === 'penerimaan' ? 'beratTerima' : 'beratMutasi'} placeholder="0.00" onChange={handleInputChange} className="w-full text-slate-600 bg-[#f1f4eb]/50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8da070] transition-all" />
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-6 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase italic tracking-widest">
                {activeForm === 'penerimaan' && !isAdmin ? (
                  <><Lock size={14} className="text-rose-500" /> Admin Access Only</>
                ) : (
                  <><CheckCircle2 size={14} className="text-[#8da070]" /> Data Terverifikasi</>
                )}
              </div>
              <button 
                type="submit"
                disabled={activeForm === 'penerimaan' && !isAdmin}
                className={`w-full md:w-auto px-10 py-4 rounded-2xl text-[11px] font-black uppercase italic tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${activeForm === 'penerimaan' && !isAdmin ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-[#8da070] shadow-slate-200'}`}
              >
                <Save size={18} /> Simpan {activeForm === 'penerimaan' ? 'Penerimaan' : 'Mutasi'}
              </button>
            </div>
          </form>
        </div>

        {/* SUMMARY SECTION */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1a1c18] rounded-[32px] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8da070]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#8da070]/20 transition-all duration-700" />
            
            <h3 className="text-[11px] font-black text-[#8da070] uppercase tracking-[0.3em] italic relative z-10">Data Preview</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Identitas RFID</p>
                <p className="text-sm font-black text-white uppercase tracking-tighter">
                  {formData.noRfidMutasi || formData.noRfidTerima || 'Waiting for scan...'}
                </p>
              </div>
              <div className="p-5 bg-[#8da070]/10 border border-[#8da070]/20 rounded-2xl space-y-1">
                <p className="text-[9px] font-black text-[#8da070] uppercase tracking-widest italic">Live Weight Scale</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">
                  {activeForm === 'penerimaan' ? formData.beratTerima : formData.beratMutasi || '0'} <span className="text-xs text-[#8da070] uppercase tracking-normal">KG</span>
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 relative z-10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                   <Leaf size={14} className="text-[#8da070]" />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold italic uppercase tracking-tight">
                  {activeForm === 'penerimaan' 
                    ? "Input ini akan meregistrasi sapi baru ke dalam sistem inventory feedlot." 
                    : "Mutasi akan mengeluarkan sapi dari inventory aktif dan memperbarui status aset."}
                </p>
              </div>
            </div>
          </div>

          {/* QUICK LINKS / HELP */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest mb-4">Quick Information</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase italic">Admin Role</span>
                <span className="text-[10px] font-black text-[#8da070] uppercase">{isAdmin ? 'Active' : 'Locked'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase italic">System Status</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal sub-component for check icon in status
const CheckCircle2 = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default FeedlotInventory;