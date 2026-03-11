'use client'

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Factory, 
  Download, 
  History, 
  Calculator, 
  TrendingUp, 
  FileText, 
  Boxes, 
  Save, 
  Lock, 
  Search, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Filter, 
  CheckCircle2,
  Leaf
} from 'lucide-react';

const FeedmillInventory = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('penerimaan'); 
  const [historySearch, setHistorySearch] = useState('');
  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'ADMIN';

  // State Form
  const [form, setForm] = useState({
    noPo: '',
    namaBahanBaku: '',
    beratNetto: 0,
    jenisKonsentrat: 'KONSENTRAT A (SAPI DEWASA)',
    penggunaanBahan: 0,
    hargaPerKg: 0,
    saldoAwal: 1000,
    produksi: 0,
    penjualan: 0
  });

  // Mock Data History (Tag warna dipertahankan sesuai aslinya)
  const [historyData] = useState([
    { id: 1, date: '2026-03-11 09:45', type: 'IN', item: 'Jagung Giling', qty: 5000, user: 'Admin_Pusat', ref: 'PO-2026-001' },
    { id: 2, date: '2026-03-10 14:20', type: 'OUT', item: 'Konsentrat A', qty: 1200, user: 'Staff_Prod', ref: 'PROD-992' },
    { id: 3, date: '2026-03-10 08:00', type: 'IN', item: 'Bungkil Sawit', qty: 3000, user: 'Admin_Pusat', ref: 'PO-2026-004' },
    { id: 4, date: '2026-03-09 16:30', type: 'OUT', item: 'Konsentrat B', qty: 850, user: 'Staff_Prod', ref: 'PROD-991' },
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Logic Perhitungan Otomatis
  const totalHarga = useMemo(() => form.penggunaanBahan * form.hargaPerKg, [form.penggunaanBahan, form.hargaPerKg]);
  const pemakaianPerHari = useMemo(() => (Number(form.produksi) + Number(form.penjualan)) / 30, [form.produksi, form.penjualan]);
  const saldoAkhir = useMemo(() => Number(form.saldoAwal) + Number(form.produksi) - Number(form.penjualan), [form.saldoAwal, form.produksi, form.penjualan]);
  const umurStok = useMemo(() => pemakaianPerHari > 0 ? saldoAkhir / pemakaianPerHari : 0, [saldoAkhir, pemakaianPerHari]);

  // Filter History
  const filteredHistory = historyData.filter(log => 
    log.item.toLowerCase().includes(historySearch.toLowerCase()) || 
    log.ref.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-[#f8faf7] min-h-screen space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER - Fokus Hijau #8da070 */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#f1f4eb] text-[#8da070] rounded-2xl">
            <Factory size={28} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight">
              Feedmill <span className="text-[#8da070]">Inventory</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] italic leading-none mt-1 flex items-center gap-2">
              <Leaf size={10} className="text-[#8da070]" /> Raw Material & Production Control
            </p>
          </div>
        </div>

        {/* NAVIGATION TAB */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          {['penerimaan', 'pengeluaran', 'kartu stok', 'history'].map((tab) => (
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
        
        {/* LEFT COLUMN: FORMS */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab !== 'history' ? (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-[#8da070] rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">
                      {activeTab === 'penerimaan' && 'Penerimaan Bahan Baku'}
                      {activeTab === 'pengeluaran' && 'Pengeluaran Barang / Produksi'}
                      {activeTab === 'kartu stok' && 'Konfigurasi Kartu Stok'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase italic">Form Section</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activeTab === 'penerimaan' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                          <FileText size={12} /> No. PO (Link Master)
                        </label>
                        <input name="noPo" onChange={handleInputChange} placeholder="Ketik No PO..." className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#8da070]/30 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                          <Boxes size={12} /> Nama Bahan Baku
                        </label>
                        <input name="namaBahanBaku" readOnly placeholder="Otomatis dari Database..." className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 cursor-not-allowed italic" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#8da070] uppercase tracking-widest flex items-center gap-2 ml-1">
                          <TrendingUp size={12} /> Berat Netto (Kg)
                        </label>
                        <input type="number" name="beratNetto" onChange={handleInputChange} className="w-full bg-[#f1f4eb]/50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#8da070] outline-none" />
                      </div>
                    </>
                  )}

                  {activeTab === 'pengeluaran' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Produksi</label>
                        <select name="jenisKonsentrat" onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none">
                          <option>KONSENTRAT A (SAPI DEWASA)</option>
                          <option>KONSENTRAT B (PEDET)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penggunaan Bahan (Kg)</label>
                        <input type="number" name="penggunaanBahan" onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#8da070] uppercase tracking-widest ml-1 italic font-bold">Total Biaya (Auto)</label>
                        <div className="w-full bg-slate-900 text-[#8da070] rounded-2xl px-5 py-4 text-sm font-black italic">
                          Rp {totalHarga.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'kartu stok' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Awal</label>
                        <input type="number" name="saldoAwal" value={form.saldoAwal} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Masuk (30 Hari)</label>
                        <input type="number" name="produksi" onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Keluar (30 Hari)</label>
                        <input type="number" name="penjualan" onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isAdmin ? <CheckCircle2 size={16} className="text-[#8da070]" /> : <Lock size={16} className="text-rose-500" />}
                  <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">
                    {isAdmin ? 'System Online: Admin' : 'Access Restricted: View Only'}
                  </span>
                </div>
                <button 
                  disabled={!isAdmin}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-[#8da070] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30 shadow-xl shadow-slate-200"
                >
                  <Save size={18} /> Simpan Records
                </button>
              </div>
            </div>
          ) : (
            /* HISTORY TAB - Tag warna dipertahankan (Emerald & Amber) */
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                      <History size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic leading-none">Activity Log</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Real-time inventory monitoring</p>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#8da070] transition-colors" size={14} />
                    <input 
                      type="text" 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Cari item atau No Ref..." 
                      className="pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-bold outline-none w-full md:w-64 focus:ring-2 focus:ring-[#8da070]/20 transition-all" 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                        <th className="pb-4 pl-2">Informasi Transaksi</th>
                        <th className="pb-4">Tipe</th>
                        <th className="pb-4">No. Referensi</th>
                        <th className="pb-4 text-right pr-2">Jumlah (Kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredHistory.length > 0 ? filteredHistory.map((log) => (
                        <tr key={log.id} className="group hover:bg-[#f1f4eb]/30 transition-colors">
                          <td className="py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-[#8da070]/20 transition-all">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-tight">{log.item}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Clock size={8} /> {log.date}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span className="text-[8px] font-black text-[#8da070] uppercase italic">{log.user}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-5">
                            {/* TAG WARNA TETAP (EMERALD & AMBER) SESUAI INSTRUKSI */}
                            {log.type === 'IN' ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                <ArrowDownLeft size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase italic tracking-tighter">Stok Masuk</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                                <ArrowUpRight size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase italic tracking-tighter">Produksi</span>
                              </div>
                            )}
                          </td>
                          <td className="py-5">
                            <span className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter bg-slate-100 px-2 py-1 rounded">
                              {log.ref}
                            </span>
                          </td>
                          <td className="py-5 text-right pr-2">
                            <p className="text-xs font-black text-slate-800 italic">
                              {log.qty.toLocaleString('id-ID')} Kg
                            </p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-20 text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Data tidak ditemukan</p>
                          </td>
                        </tr>
                      )}
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8da070] italic">Inventory Analytics</h3>
              <Calculator size={18} className="text-slate-600" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Estimasi Saldo Akhir</p>
                  <p className="text-4xl font-black italic tracking-tighter text-white">
                    {saldoAkhir.toLocaleString('id-ID')} <span className="text-xs text-[#8da070] uppercase tracking-normal">Kg</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-[#8da070]/30 transition-colors">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Avg Burn Rate/Day</p>
                  <p className="text-lg font-black italic text-white leading-none">{pemakaianPerHari.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-[#8da070]/30 transition-colors">
                  <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Stock Life</p>
                  <div className="flex items-baseline gap-1">
                    <p className={`text-lg font-black italic ${umurStok < 5 ? 'text-rose-500' : 'text-[#8da070]'}`}>
                      {Math.round(umurStok)}
                    </p>
                    <span className="text-[9px] font-black text-slate-500 uppercase italic">Days</span>
                  </div>
                </div>
              </div>

              <button className="w-full p-4 bg-[#8da070] hover:bg-[#7a8c5f] text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] italic shadow-lg shadow-[#8da070]/20 active:scale-95">
                <Download size={18} /> Export Laporan (CSV)
              </button>
            </div>
          </div>

          {/* MASTER SUPPLIER LINKS */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Filter size={16} className="text-[#8da070]" />
              <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Master Connection</p>
            </div>
            <div className="space-y-3">
              {['PT. MAKMUR FEED', 'GUDANG JAGUNG UTAMA'].map((sup, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-[#f8faf7] rounded-2xl hover:bg-[#f1f4eb] transition-colors border border-transparent hover:border-[#8da070]/20 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-[#8da070] shadow-sm group-hover:bg-[#8da070] group-hover:text-white transition-all">0{i+1}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{sup}</p>
                      <p className="text-[8px] font-bold text-[#8da070] uppercase mt-1 italic tracking-tight">Status: Active PO</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedmillInventory;