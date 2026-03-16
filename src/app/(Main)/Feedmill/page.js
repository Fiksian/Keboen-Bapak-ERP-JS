'use client'

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Factory, 
  Download, 
  History, 
  Calculator, 
  TrendingUp, 
  Boxes, 
  Save, 
  Lock, 
  Search, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  CheckCircle2,
  Leaf,
  Beaker,
  Layers
} from 'lucide-react';

const FeedmillInventory = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('produksi'); 
  const [historySearch, setHistorySearch] = useState('');
  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'ADMIN';

  // Mock Data Stok Bahan Baku (Biasanya ditarik dari API Modul Penerimaan/Gudang)
  const [availableStock] = useState([
    { id: 'BB-001', name: 'Jagung Giling', qty: 15000, unit: 'Kg' },
    { id: 'BB-002', name: 'Bungkil Sawit', qty: 8000, unit: 'Kg' },
    { id: 'BB-003', name: 'Dedak Padi', qty: 5000, unit: 'Kg' },
    { id: 'BB-004', name: 'Mineral Mix', qty: 500, unit: 'Kg' },
  ]);

  // State Form Produksi
  const [form, setForm] = useState({
    bahanBakuId: '',
    jumlahPakai: 0,
    jenisHasil: 'KONSENTRAT A (SAPI DEWASA)',
    batchNo: `MIX-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-001`,
  });

  // Mock History Produksi
  const [historyData] = useState([
    { id: 1, date: '2026-03-11 09:45', type: 'OUT', item: 'Jagung Giling', qty: 2500, user: 'Staff_Prod', ref: 'MIX-202603-001' },
    { id: 2, date: '2026-03-10 14:20', type: 'PROD', item: 'Konsentrat A', qty: 5000, user: 'Admin_Feedmill', ref: 'BATCH-992' },
    { id: 3, date: '2026-03-10 08:00', type: 'OUT', item: 'Bungkil Sawit', qty: 1200, user: 'Staff_Prod', ref: 'MIX-202603-001' },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Logic Perhitungan
  const selectedBahan = useMemo(() => 
    availableStock.find(s => s.id === form.bahanBakuId), 
    [form.bahanBakuId, availableStock]
  );

  const estimasiSisaStok = useMemo(() => {
    if (!selectedBahan) return 0;
    return selectedBahan.qty - (Number(form.jumlahPakai) || 0);
  }, [selectedBahan, form.jumlahPakai]);

  // Filter History
  const filteredHistory = historyData.filter(log => 
    log.item.toLowerCase().includes(historySearch.toLowerCase()) || 
    log.ref.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-[#f8faf7] min-h-screen space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#f1f4eb] text-[#8da070] rounded-2xl">
            <Factory size={28} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">
              Feedmill <span className="text-[#8da070]">Production</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] italic leading-none mt-1 flex items-center gap-2">
              <Leaf size={10} className="text-[#8da070]" /> Processing & Mixing Center
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          {['produksi', 'stok bahan', 'history'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-[#8da070] shadow-sm' : 'text-slate-400 hover:text-[#8da070]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'produksi' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#8da070] rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Pencatatan Mixing Bahan Baku</h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase italic">Form Produksi</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Boxes size={12} /> Pilih Bahan Baku (Darik Gudang)
                    </label>
                    <select 
                      name="bahanBakuId" 
                      onChange={handleInputChange} 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/30 outline-none appearance-none"
                    >
                      <option value="">-- Pilih Stok --</option>
                      {availableStock.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Sisa: {s.qty} {s.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Layers size={12} /> Hasil Produksi
                    </label>
                    <select name="jenisHasil" onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none">
                      <option>KONSENTRAT A (SAPI DEWASA)</option>
                      <option>KONSENTRAT B (PEDET)</option>
                      <option>SILASE KOMPLIT</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8da070] uppercase tracking-widest flex items-center gap-2 ml-1">
                      <Beaker size={12} /> Jumlah Pemakaian (Kg)
                    </label>
                    <input 
                      type="number" 
                      name="jumlahPakai" 
                      onChange={handleInputChange} 
                      className="w-full bg-[#f1f4eb]/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#8da070] outline-none" 
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                      <TrendingUp size={12} /> Nomor Batch
                    </label>
                    <input 
                      name="batchNo" 
                      value={form.batchNo}
                      readOnly
                      className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 cursor-not-allowed italic" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isAdmin ? <CheckCircle2 size={16} className="text-[#8da070]" /> : <Lock size={16} className="text-rose-500" />}
                  <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">
                    {isAdmin ? 'System Ready: Production Mode' : 'Access Restricted'}
                  </span>
                </div>
                <button 
                  disabled={!isAdmin || !form.bahanBakuId}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-[#8da070] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30 shadow-xl shadow-slate-200"
                >
                  <Save size={18} /> Simpan & Kurangi Stok
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stok bahan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
              {availableStock.map((s) => (
                <div key={s.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#8da070] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#f1f4eb] transition-colors">
                      <Boxes className="text-slate-400 group-hover:text-[#8da070]" size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase italic text-sm">{s.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{s.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black italic text-slate-800 tracking-tighter">{s.qty.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400">{s.unit}</span></p>
                    <p className="text-[8px] font-black text-[#8da070] uppercase">Available</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                      <History size={20} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic leading-none">Log Produksi</h3>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#8da070]" size={14} />
                    <input 
                      type="text" 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Cari item/batch..." 
                      className="pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-bold outline-none w-full md:w-64 focus:ring-2 focus:ring-[#8da070]/20" 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                        <th className="pb-4 pl-2">Item/Hasil</th>
                        <th className="pb-4">Jenis Log</th>
                        <th className="pb-4">No. Ref</th>
                        <th className="pb-4 text-right pr-2">Jumlah (Kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredHistory.map((log) => (
                        <tr key={log.id} className="group hover:bg-[#f1f4eb]/30 transition-colors">
                          <td className="py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-all">
                                <User size={14} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase italic">{log.item}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                  <Clock size={8} /> {log.date}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5">
                            {log.type === 'OUT' ? (
                              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit text-[8px] font-black uppercase italic">
                                <ArrowUpRight size={10} /> Pemakaian
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit text-[8px] font-black uppercase italic">
                                <CheckCircle2 size={10} /> Hasil Produksi
                              </div>
                            )}
                          </td>
                          <td className="py-5">
                            <span className="text-[9px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{log.ref}</span>
                          </td>
                          <td className="py-5 text-right pr-2 font-black text-xs italic text-slate-800">
                            {log.qty.toLocaleString('id-ID')} Kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ANALYTICS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1a1c18] rounded-[32px] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8da070]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#8da070]/20 transition-all duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8da070] italic">Real-time Stock Impact</h3>
              <Calculator size={18} className="text-slate-600" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="border-b border-white/5 pb-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Estimasi Sisa Stok Bahan</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-4xl font-black italic tracking-tighter ${estimasiSisaStok < 100 && form.bahanBakuId ? 'text-rose-500' : 'text-white'}`}>
                    {estimasiSisaStok.toLocaleString('id-ID')}
                  </p>
                  <span className="text-xs text-[#8da070] uppercase italic">Kg</span>
                </div>
                {selectedBahan && (
                  <p className="text-[8px] font-black text-slate-500 uppercase mt-2 italic">
                    Base: {selectedBahan.name}
                  </p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-3 italic">Safety Level Monitor</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${estimasiSisaStok < 500 ? 'bg-rose-500' : 'bg-[#8da070]'}`}
                    style={{ width: `${selectedBahan ? (estimasiSisaStok / selectedBahan.qty) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[7px] font-bold text-slate-600 uppercase">Critical</span>
                   <span className="text-[7px] font-bold text-slate-600 uppercase">Optimal</span>
                </div>
              </div>

              <button className="w-full p-4 bg-[#8da070] hover:bg-[#7a8c5f] text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] italic shadow-lg shadow-[#8da070]/20 active:scale-95">
                <Download size={18} /> Download Production Report
              </button>
            </div>
          </div>

          {/* QUICK LINKS TO WAREHOUSE */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Boxes size={16} className="text-[#8da070]" />
              <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Warehouse Status</p>
            </div>
            <div className="space-y-2">
               <div className="p-3 bg-slate-50 rounded-xl border-l-4 border-[#8da070]">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Total Raw Material</p>
                  <p className="text-sm font-black text-slate-800 italic">28,500.00 Kg</p>
               </div>
               <p className="text-[7px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4 italic">Synced with Central Warehouse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedmillInventory;