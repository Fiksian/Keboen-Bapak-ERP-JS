'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Save, 
  Warehouse, ShoppingBag, Factory, History, CheckCircle2,
  TrendingUp, TrendingDown, Loader2, X, Calendar, AlertTriangle, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const FeedmillPage = () => {
  const router = useRouter();
  
  // State Kontrol Modal
  const [activeModal, setActiveModal] = useState(null); // 'INTERNAL', 'EXTERNAL', 'HISTORY'
  const [isSaving, setIsSaving] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // --- DATA MASTER INVENTORY ---
  const [inventoryData, setInventoryData] = useState([
    { id: 1, category: 'BAHAN BAKU', item: 'JAGUNG GILING', saldoAwal: 10000, produksi: 2000, pengeluaran: 1500, harga: 5000 },
    { id: 2, category: 'BAHAN BAKU', item: 'BUNGKIL KEDELAI', saldoAwal: 5000, produksi: 0, pengeluaran: 800, harga: 12000 },
    { id: 3, category: 'KONSENTRAT', item: 'KONSENTRAT SAPI PERAH', saldoAwal: 8000, produksi: 3000, pengeluaran: 4000, harga: 7500 },
    { id: 4, category: 'KONSENTRAT', item: 'KONSENTRAT PEDET', saldoAwal: 2000, produksi: 500, pengeluaran: 200, harga: 8000 },
  ]);

  // --- LOGIKA KALKULASI ---
  const calculatedStats = useMemo(() => {
    return inventoryData.map(item => {
      const saldoAkhir = (item.saldoAwal + item.produksi) - item.pengeluaran;
      const pemakaianPerHari = (item.produksi + item.pengeluaran) / 30;
      const umurStok = pemakaianPerHari > 0 ? Math.floor(saldoAkhir / pemakaianPerHari) : 0;
      return { ...item, saldoAkhir, pemakaianPerHari, umurStok };
    });
  }, [inventoryData]);

  // --- STATE FORM INPUT ---
  const [formData, setFormData] = useState([]);

  // --- STATE HISTORY ---
  const [historyLogs, setHistoryLogs] = useState([
    { id: 1, type: 'INTERNAL', date: '2024-05-20 09:00', item: 'JAGUNG GILING', qty: '500 Kg', total: 'Rp 2.500.000' },
    { id: 2, type: 'EXTERNAL', date: '2024-05-20 10:45', item: 'KONSENTRAT SAPI PERAH', qty: '1.200 Kg', total: 'Rp 9.000.000' },
  ]);

  const filteredHistory = useMemo(() => {
    return historyLogs.filter(log => 
      log.item.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.type.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [historyLogs, historySearch]);

  // Fungsi Modal
  const openModal = (type) => {
    setActiveModal(type);
    if (type !== 'HISTORY') {
      setFormData([{ 
        id: Date.now(), 
        targetItem: inventoryData[0].item, 
        qty: 0, 
        customer: type === 'EXTERNAL' ? '' : 'INTERNAL PRODUCTION' 
      }]);
    }
  };

  const handleFinalizeReport = () => {
    setIsSaving(true);
    setTimeout(() => {
      const newInventory = [...inventoryData];
      const newLogs = [];

      formData.forEach(formItem => {
        if (formItem.qty <= 0) return;
        const itemIndex = newInventory.findIndex(inv => inv.item === formItem.targetItem);
        if (itemIndex !== -1) {
          if (activeModal === 'INTERNAL') newInventory[itemIndex].produksi += formItem.qty;
          else newInventory[itemIndex].pengeluaran += formItem.qty;

          newLogs.push({
            id: Date.now() + Math.random(),
            type: activeModal,
            date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
            item: formItem.targetItem,
            qty: `${formItem.qty} Kg`,
            total: `Rp ${(formItem.qty * newInventory[itemIndex].harga).toLocaleString('id-ID')}`
          });
        }
      });

      setInventoryData(newInventory);
      setHistoryLogs(prev => [...newLogs, ...prev]);
      setIsSaving(false);
      setActiveModal(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button onClick={() => router.back()} className="group flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
              <ArrowLeft size={16} className="text-gray-400 group-hover:text-[#8da070]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Back</span>
            </button>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-4">
              <div className="p-3 bg-[#8da070] text-white rounded-2xl shadow-lg shadow-[#8da070]/20">
                <Factory size={32} />
              </div>
              Feedmill Inventory
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => openModal('INTERNAL')} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-3 active:scale-95 italic">
              <Warehouse size={18} /> Update Stok
            </button>
            <button onClick={() => openModal('EXTERNAL')} className="px-6 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg flex items-center gap-3 active:scale-95 italic">
              <ShoppingBag size={18} /> Input Keluar
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {calculatedStats.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${item.category === 'KONSENTRAT' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                  {item.category === 'KONSENTRAT' ? <ShoppingBag size={20} /> : <Warehouse size={20} />}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.umurStok < 7 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  Stock: {item.umurStok} Days
                </div>
              </div>
              <h3 className="font-black text-sm uppercase italic text-gray-400 mb-1">{item.category}</h3>
              <p className="font-black text-lg text-gray-900 uppercase leading-none mb-4">{item.item}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Akhir</p>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">{item.saldoAkhir.toLocaleString()} <span className="text-xs">Kg</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Usage/Day</p>
                  <p className="font-bold text-gray-900">{item.pemakaianPerHari.toFixed(1)} <span className="text-[10px]">Kg</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* KARTU STOK TABLE */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-12">
          <div className="p-8 bg-gray-900 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <Calendar size={20} className="text-[#8da070]" />
              <h2 className="font-black uppercase tracking-tight italic text-lg">Kartu Stok Terkini</h2>
            </div>
            <button onClick={() => openModal('HISTORY')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8da070] hover:brightness-125 transition-all">
               Lihat Detail Log <History size={14}/>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-8 py-6">Nama Barang</th>
                  <th className="px-6 py-6 text-center">Awal</th>
                  <th className="px-6 py-6 text-center text-blue-600">Masuk (+)</th>
                  <th className="px-6 py-6 text-center text-orange-600">Keluar (-)</th>
                  <th className="px-6 py-6 text-center">Akhir</th>
                  <th className="px-8 py-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {calculatedStats.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/80 transition-all font-bold">
                    <td className="px-8 py-5 text-gray-900 uppercase italic text-sm">{item.item}</td>
                    <td className="px-6 py-5 text-center text-gray-400 tabular-nums">{item.saldoAwal.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center text-blue-600 tabular-nums">+{item.produksi.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center text-orange-600 tabular-nums">-{item.pengeluaran.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center text-gray-900 font-black tabular-nums">{item.saldoAkhir.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[10px] font-black uppercase italic ${item.umurStok < 7 ? 'text-red-500 animate-pulse' : 'text-[#8da070]'}`}>
                        {item.umurStok < 7 ? 'Low Stock' : 'Safe'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODAL SISTEM (Dinamis) */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white w-full ${activeModal === 'HISTORY' ? 'max-w-5xl' : 'max-w-4xl'} rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
              
              {/* Modal Header */}
              <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl text-white ${activeModal === 'HISTORY' ? 'bg-[#8da070]' : activeModal === 'INTERNAL' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                    {activeModal === 'HISTORY' ? <History size={24}/> : activeModal === 'INTERNAL' ? <Warehouse size={24}/> : <ShoppingBag size={24}/>}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                      {activeModal === 'HISTORY' ? 'Riwayat Transaksi' : activeModal === 'INTERNAL' ? 'Update Produksi' : 'Input Penjualan'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {activeModal === 'HISTORY' ? 'Data aktivitas keluar masuk stok' : 'Entry data logbook inventory'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"><X size={24}/></button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto flex-grow">
                {activeModal === 'HISTORY' ? (
                  /* Tampilan KHUSUS MODAL HISTORY */
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                      <input 
                        type="text" 
                        placeholder="Cari item atau tipe transaksi..." 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-[#8da070]/20"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                    </div>
                    <div className="overflow-hidden border border-gray-100 rounded-2xl">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                            <th className="px-6 py-4">Waktu</th>
                            <th className="px-6 py-4">Tipe</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Jumlah</th>
                            <th className="px-6 py-4 text-right">Total Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredHistory.length > 0 ? filteredHistory.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-[11px] font-bold text-gray-400 tabular-nums">{log.date}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${log.type === 'INTERNAL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-black text-sm uppercase italic">{log.item}</td>
                              <td className="px-6 py-4 font-bold text-gray-900 tabular-nums">{log.qty}</td>
                              <td className="px-6 py-4 text-right font-black text-[#8da070] tabular-nums">{log.total}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase italic">Data tidak ditemukan</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Tampilan FORM INPUT */
                  <>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-gray-400 border-b pb-2">
                          <th>Pilih Item</th>
                          {activeModal === 'EXTERNAL' && <th>Customer</th>}
                          <th className="text-center">Jumlah (Kg)</th>
                          <th className="text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.map((row) => (
                          <tr key={row.id} className="border-b border-gray-50">
                            <td className="py-4">
                              <select 
                                className="bg-gray-50 p-2 rounded-lg font-bold text-sm outline-none w-full"
                                value={row.targetItem}
                                onChange={(e) => setFormData(formData.map(r => r.id === row.id ? {...r, targetItem: e.target.value} : r))}
                              >
                                {inventoryData.map(inv => <option key={inv.id} value={inv.item}>{inv.item}</option>)}
                              </select>
                            </td>
                            {activeModal === 'EXTERNAL' && (
                              <td className="py-4 px-2">
                                <input placeholder="Nama Pembeli" className="bg-transparent border-b border-gray-200 font-bold text-sm outline-none w-full uppercase" onChange={(e) => setFormData(formData.map(r => r.id === row.id ? {...r, customer: e.target.value} : r))}/>
                              </td>
                            )}
                            <td className="py-4">
                              <input type="number" className="w-24 mx-auto block bg-gray-100 rounded-lg py-2 text-center font-black outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData(formData.map(r => r.id === row.id ? {...r, qty: parseFloat(e.target.value) || 0} : r))}/>
                            </td>
                            <td className="py-4 text-right">
                              <button onClick={() => setFormData(formData.filter(r => r.id !== row.id))} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => setFormData([...formData, { id: Date.now(), targetItem: inventoryData[0].item, qty: 0 }])} className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-[#8da070]"><Plus size={16}/> Add Row</button>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50/50 border-t flex justify-end gap-4">
                <button onClick={() => setActiveModal(null)} className="font-black text-[10px] uppercase text-gray-400">Tutup</button>
                {activeModal !== 'HISTORY' && (
                  <button 
                    onClick={handleFinalizeReport}
                    disabled={isSaving}
                    className={`px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg flex items-center gap-3 active:scale-95 ${activeModal === 'INTERNAL' ? 'bg-blue-600' : 'bg-orange-500'}`}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    {isSaving ? 'Processing...' : 'Simpan Data'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedmillPage;