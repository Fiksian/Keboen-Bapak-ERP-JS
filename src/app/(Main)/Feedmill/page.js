'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Save, 
  Warehouse, ShoppingBag, Factory, History, CheckCircle2,
  TrendingUp, TrendingDown, Loader2, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const FeedmillPage = () => {
  const router = useRouter();
  
  // State untuk Kontrol Modal
  const [activeModal, setActiveModal] = useState(null); // 'INTERNAL' | 'EXTERNAL' | null

  // State untuk Penggunaan Bahan Baku (Internal)
  const [internalUsage, setInternalUsage] = useState([
    { id: Date.now(), kode: '', nama: '', jenis: 'Sapi Perah', qty: 0, harga: 0 }
  ]);

  // State untuk Pengeluaran Barang (External)
  const [externalSales, setExternalSales] = useState([
    { id: Date.now() + 1, customer: '', jenis: 'Sapi Perah', kode: '', berat: 0, harga: 0 }
  ]);

  // State untuk Histori
  const [historyLogs, setHistoryLogs] = useState([
    { id: 1, type: 'INTERNAL', date: '2024-05-20 09:00', item: 'JAGUNG GILING', qty: '500 Kg', total: 'Rp 2.500.000', status: 'Success' },
    { id: 2, type: 'EXTERNAL', date: '2024-05-20 10:30', item: 'KONSENTRAT A (CV. TERNAK)', qty: '1.200 Kg', total: 'Rp 8.400.000', status: 'Success' },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('id-ID', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    }).replace(/\//g, '-');
  };

  const handleFinalizeReport = () => {
    const type = activeModal;
    setIsSaving(true);

    setTimeout(() => {
      const newEntries = [];

      if (type === 'INTERNAL') {
        internalUsage.forEach(item => {
          if (item.nama && item.qty > 0) {
            newEntries.push({
              id: `INT-${Date.now()}-${Math.random()}`,
              type: 'INTERNAL',
              date: getCurrentDateTime(),
              item: item.nama.toUpperCase(),
              qty: `${item.qty} Kg`,
              total: `Rp ${(item.qty * item.harga).toLocaleString('id-ID')}`,
              status: 'Success'
            });
          }
        });
        setInternalUsage([{ id: Date.now(), kode: '', nama: '', jenis: 'Sapi Perah', qty: 0, harga: 0 }]);
      } else {
        externalSales.forEach(item => {
          if (item.kode && item.berat > 0) {
            newEntries.push({
              id: `EXT-${Date.now()}-${Math.random()}`,
              type: 'EXTERNAL',
              date: getCurrentDateTime(),
              item: `${item.jenis.toUpperCase()} (${item.customer || 'PELANGGAN'})`,
              qty: `${item.berat} Kg`,
              total: `Rp ${(item.berat * item.harga).toLocaleString('id-ID')}`,
              status: 'Success'
            });
          }
        });
        setExternalSales([{ id: Date.now() + 1, customer: '', jenis: 'Sapi Perah', kode: '', berat: 0, harga: 0 }]);
      }

      setHistoryLogs(prev => [...newEntries, ...prev]);
      setIsSaving(false);
      setActiveModal(null);
    }, 800);
  };

  const handleInternalChange = (id, field, value) => {
    setInternalUsage(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleExternalChange = (id, field, value) => {
    setExternalSales(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = (qty, harga) => (qty * harga).toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <button onClick={() => router.back()} className="group flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
              <ArrowLeft size={16} className="text-gray-400 group-hover:text-[#8da070]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Back</span>
            </button>
            <div>
              <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-4">
                <div className="p-3 bg-[#8da070] text-white rounded-2xl shadow-lg shadow-[#8da070]/20">
                  <Factory size={32} />
                </div>
                Feedmill Division
              </h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 ml-1">Log & Monitoring Produksi</p>
            </div>
          </div>

          {/* Action Buttons to Open Modals */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveModal('INTERNAL')}
              className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-3 active:scale-95 italic"
            >
              <Warehouse size={18} />
              Input Bahan Baku
            </button>
            <button 
              onClick={() => setActiveModal('EXTERNAL')}
              className="px-6 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg flex items-center gap-3 active:scale-95 italic"
            >
              <ShoppingBag size={18} />
              Input Pengeluaran
            </button>
          </div>
        </div>

        {/* MAIN CONTENT: HISTORY LOGS */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-20">
          <div className="p-8 border-b border-gray-50 bg-gray-900 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#8da070] text-white rounded-xl flex items-center justify-center">
                <History size={20} />
              </div>
              <div>
                <h2 className="font-black uppercase tracking-tight italic text-lg text-white">History Transaksi</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Feedmill Activity Logs</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                  <th className="px-8 py-6">Status</th>
                  <th className="px-6 py-6">Tipe</th>
                  <th className="px-6 py-6">Tanggal & Waktu</th>
                  <th className="px-6 py-6">Item / Deskripsi</th>
                  <th className="px-6 py-6 text-center">Jumlah (Qty)</th>
                  <th className="px-6 py-6 text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historyLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/80 transition-all cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#8da070]" />
                        <span className="text-[10px] font-black uppercase text-gray-900">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        log.type === 'INTERNAL' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {log.type === 'INTERNAL' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {log.type}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-gray-400 tabular-nums">{log.date}</td>
                    <td className="px-6 py-5 text-sm font-black text-gray-700 uppercase italic">{log.item}</td>
                    <td className="px-6 py-5 text-center"><span className="text-sm font-bold text-gray-900">{log.qty}</span></td>
                    <td className="px-6 py-5 text-right font-black text-sm text-[#8da070]">{log.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODAL COMPONENT */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${activeModal === 'INTERNAL' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                    {activeModal === 'INTERNAL' ? <Warehouse size={24} /> : <ShoppingBag size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">
                      {activeModal === 'INTERNAL' ? 'Input Penggunaan Bahan Baku' : 'Input Pengeluaran Barang'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {activeModal === 'INTERNAL' ? 'Produksi Internal / Konsentrat' : 'Customer & External Sales'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-3 bg-white border border-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-8 overflow-y-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="px-4 py-4">Jenis Konsentrat</th>
                      {activeModal === 'EXTERNAL' && <th className="px-4 py-4">Nama Customer</th>}
                      <th className="px-4 py-4">Kode Barang</th>
                      {activeModal === 'INTERNAL' && <th className="px-4 py-4">Nama Barang</th>}
                      <th className="px-4 py-4 text-center">{activeModal === 'INTERNAL' ? 'Qty (Kg)' : 'Berat (Kg)'}</th>
                      <th className="px-4 py-4 text-right">Harga/Kg</th>
                      <th className="px-4 py-4 text-right">Total</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(activeModal === 'INTERNAL' ? internalUsage : externalSales).map((item) => (
                      <tr key={item.id} className="group hover:bg-gray-50/30">
                        <td className="py-4">
                          <select 
                            className="bg-gray-50 border-none outline-none font-bold text-xs uppercase italic p-2 rounded-lg"
                            value={item.jenis} 
                            onChange={(e) => activeModal === 'INTERNAL' ? handleInternalChange(item.id, 'jenis', e.target.value) : handleExternalChange(item.id, 'jenis', e.target.value)}
                          >
                            <option>Sapi Perah</option>
                            <option>Penggemukan</option>
                            <option>Pedet</option>
                          </select>
                        </td>
                        {activeModal === 'EXTERNAL' && (
                          <td className="py-4">
                            <input 
                              placeholder="Nama Customer"
                              className="w-full bg-transparent font-bold text-sm outline-none"
                              value={item.customer} onChange={(e) => handleExternalChange(item.id, 'customer', e.target.value)}
                            />
                          </td>
                        )}
                        <td className="py-4">
                          <input 
                            placeholder="KODE"
                            className={`w-full bg-transparent font-bold text-sm outline-none uppercase ${activeModal === 'INTERNAL' ? 'text-blue-600' : 'text-orange-600'}`}
                            value={item.kode} onChange={(e) => activeModal === 'INTERNAL' ? handleInternalChange(item.id, 'kode', e.target.value) : handleExternalChange(item.id, 'kode', e.target.value)}
                          />
                        </td>
                        {activeModal === 'INTERNAL' && (
                          <td className="py-4">
                            <input 
                              placeholder="Nama Barang"
                              className="w-full bg-transparent font-bold text-sm outline-none"
                              value={item.nama} onChange={(e) => handleInternalChange(item.id, 'nama', e.target.value)}
                            />
                          </td>
                        )}
                        <td className="py-4">
                          <input 
                            type="number"
                            className="w-20 mx-auto block bg-white border border-gray-100 rounded-lg py-2 px-1 text-center font-black text-sm outline-none"
                            value={activeModal === 'INTERNAL' ? item.qty : item.berat} 
                            onChange={(e) => activeModal === 'INTERNAL' ? handleInternalChange(item.id, 'qty', parseFloat(e.target.value) || 0) : handleExternalChange(item.id, 'berat', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-4 text-right font-bold text-xs text-gray-400 italic">
                          Rp {item.harga.toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 text-right font-black text-sm text-gray-900 italic">
                          Rp {calculateTotal(activeModal === 'INTERNAL' ? item.qty : item.berat, item.harga)}
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => {
                              if (activeModal === 'INTERNAL') setInternalUsage(internalUsage.filter(i => i.id !== item.id));
                              else setExternalSales(externalSales.filter(i => i.id !== item.id));
                            }}
                            className="text-red-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button 
                  onClick={() => {
                    const newItem = { id: Date.now(), kode: '', nama: '', jenis: 'Sapi Perah', qty: 0, berat: 0, customer: '', harga: 0 };
                    if (activeModal === 'INTERNAL') setInternalUsage([...internalUsage, newItem]);
                    else setExternalSales([...externalSales, newItem]);
                  }}
                  className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#8da070] hover:bg-[#8da070]/5 p-2 rounded-xl transition-all"
                >
                  <Plus size={14} /> Add New Row
                </button>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-4">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalizeReport}
                  disabled={isSaving}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg flex items-center gap-3 active:scale-95 italic ${activeModal === 'INTERNAL' ? 'bg-blue-600' : 'bg-orange-500'} text-white`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isSaving ? 'Processing...' : 'Verify & Save Log'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FeedmillPage;