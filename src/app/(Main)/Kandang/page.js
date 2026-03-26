'use client'

import { 
  ChevronDown, 
  Warehouse, 
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Truck,
  Activity,
  Calendar,
  TrendingUp,
  Beef,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'

const Kandang = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Data dummy hasil input dari Feedlot
  const [feedlotLogs] = useState([
    { id: 1, date: '2026-03-13', type: 'PENERIMAAN', item: 'Brahman Cross', qty: '450', ref: 'PO-2026-001', status: 'Selesai', origin: 'Australia' },
    { id: 2, date: '2026-03-12', type: 'MUTASI', item: 'Limousin', qty: '520', ref: 'SALE-992', status: 'Penjualan', origin: 'Local' },
    { id: 3, date: '2026-03-12', type: 'PENERIMAAN', item: 'Angus', qty: '410', ref: 'PO-2026-004', status: 'Selesai', origin: 'New Zealand' },
    { id: 4, date: '2026-03-11', type: 'MUTASI', item: 'Brahman Cross', qty: '480', ref: 'CULL-102', status: 'Potong Paksa', origin: 'Local' },
    { id: 5, date: '2026-03-10', type: 'PENERIMAAN', item: 'Wagyu', qty: '380', ref: 'PO-2026-009', status: 'Selesai', origin: 'Japan' },
  ]);

  const statusCards = [
    { title: 'Total Populasi', value: '124', unit: 'Ekor', icon: <Activity size={20} />, status: '+3 Hari ini', status_color: 'text-emerald-500', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Berat Rata-rata', value: '458', unit: 'Kg', icon: <TrendingUp size={20} />, status: 'IDEAL', status_color: 'text-blue-500', color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Sapi Siap Jual', value: '42', unit: 'Ekor', icon: <Beef size={20} />, status: 'SIAP', status_color: 'text-purple-500', color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Kapasitas Kandang', value: '82', unit: '%', icon: <Warehouse size={20} />, status: 'TERISI', status_color: 'text-orange-500', color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const filteredLogs = feedlotLogs.filter(log => 
    log.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.ref.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className='p-4 md:p-6 bg-gray-50 min-h-full space-y-6'>
      
      <div className='flex justify-between items-center p-2 mb-2'>
        <span className='text-gray-800 font-bold'>Management Dashboard: Feedlot Inventory</span>
        <div className='flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm'>
            <Calendar size={14} />
            <span>13 Maret 2026</span>
        </div>
      </div>

      {/* Header Selector */}
      <div className='bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4'>
        <div className='space-y-1 w-full md:w-auto'>
          <label className='text-gray-600 font-semibold text-[10px] uppercase tracking-widest'>Lokasi Penempatan</label>
          <div className='flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all'>
            <div className='p-2 bg-emerald-100 text-emerald-600 rounded-lg'>
              <Warehouse size={18}/>
            </div>
            <span className='font-bold text-gray-700'>Kandang Utama (A)</span>
            <ChevronDown size={18} className='text-gray-400 ml-auto md:ml-4' />
          </div>
        </div>

        <div className='flex items-center gap-4'>
            <div className='text-right hidden sm:block'>
                <p className='text-[10px] font-black text-gray-300 uppercase'>Data Integrity</p>
                <p className='text-[12px] font-bold text-emerald-500'>Verified & Synced</p>
            </div>
            <button className='flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs hover:bg-gray-800 transition-all shadow-lg shadow-gray-200'>
                <Truck size={16} />
                <span>Input Data Baru</span>
            </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statusCards.map((card, idx) => (
          <div key={idx} className='bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4 group hover:border-emerald-500/30 transition-all'>
            <div className='flex justify-between items-start'>
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md border border-current opacity-70 ${card.status_color}`}>
                {card.status}
              </span>
            </div>
            <div>
              <p className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter'>{card.title}</p>
              <h3 className='text-3xl font-black text-gray-800 group-hover:text-emerald-600 transition-colors'>
                {card.value} <span className='text-sm font-medium text-gray-400'>{card.unit}</span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        
        {/* Main Content: Table Activity (Now Taking Full Left Space) */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 overflow-hidden min-h-[600px]'>
            <div className='flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-50 pb-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-gray-900 text-white rounded-xl shadow-lg'>
                  <History size={18} />
                </div>
                <div>
                    <h3 className='font-bold text-gray-700 uppercase text-xs tracking-widest leading-none'>Log Mutasi & Penerimaan</h3>
                    <p className='text-[10px] text-gray-400 font-bold mt-1'>Riwayat data feedlot terbaru</p>
                </div>
              </div>
              <div className='relative w-full md:w-64'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
                <input 
                  type="text" 
                  placeholder="Cari No. RFID atau Batch..."
                  className='w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-[11px] font-bold outline-none ring-1 ring-gray-100 focus:ring-emerald-500/20'
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left'>
                <thead>
                  <tr className='text-gray-400 text-[9px] font-black uppercase tracking-widest border-b border-gray-50'>
                    <th className='pb-4 pl-2'>Waktu</th>
                    <th className='pb-4'>Aktivitas</th>
                    <th className='pb-4'>Spesifikasi</th>
                    <th className='pb-4'>Berat</th>
                    <th className='pb-4'>Asal/Tujuan</th>
                    <th className='pb-4'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className='group hover:bg-emerald-50/30 transition-colors cursor-default'>
                      <td className='py-5 pl-2 text-[10px] font-bold text-gray-500'>{log.date}</td>
                      <td className='py-5'>
                        {log.type === 'PENERIMAAN' ? (
                          <div className='flex items-center gap-1.5 text-emerald-600 font-black'>
                            <ArrowDownLeft size={12} />
                            <span className='text-[8px]'>INBOUND</span>
                          </div>
                        ) : (
                          <div className='flex items-center gap-1.5 text-amber-600 font-black'>
                            <ArrowUpRight size={12} />
                            <span className='text-[8px]'>OUTBOUND</span>
                          </div>
                        )}
                      </td>
                      <td className='py-5'>
                        <p className='text-[11px] font-black text-gray-700 leading-tight'>{log.item}</p>
                        <p className='text-[9px] text-gray-400 font-mono mt-0.5'>{log.ref}</p>
                      </td>
                      <td className='py-5 text-[11px] font-bold text-gray-600'>{log.qty} Kg</td>
                      <td className='py-5 text-[10px] font-bold text-gray-400 italic'>{log.origin}</td>
                      <td className='py-5'>
                        <span className='text-[9px] font-black text-gray-500 border border-gray-100 bg-gray-50/50 px-2.5 py-1 rounded-lg uppercase'>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className='py-20 text-center'>
                    <p className='text-gray-400 font-bold text-xs italic'>Data tidak ditemukan...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Insights */}
        <div className='space-y-6'>
          
          {/* Distribution Card */}
          <div className="p-8 bg-white rounded-[32px] shadow-sm border border-gray-100 space-y-6">
            <h3 className='font-black text-gray-700 text-xs uppercase tracking-widest flex items-center gap-2'>
               <Activity size={18} className='text-emerald-500' /> Distribusi Stok
            </h3>
            
            <div className='space-y-4'>
                {[
                    { label: 'Brahman Cross', value: 65, color: 'bg-emerald-500' },
                    { label: 'Limousin', value: 35, color: 'bg-blue-500' },
                    { label: 'Angus', value: 24, color: 'bg-purple-500' }
                ].map((item, index) => (
                    <div key={index} className='p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md hover:shadow-gray-100 transition-all border border-transparent hover:border-gray-100'>
                        <div className='flex justify-between items-center mb-2'>
                            <span className='text-[10px] font-bold text-gray-500 uppercase'>{item.label}</span>
                            <span className='text-[10px] font-black text-gray-700'>{item.value} Ekor</span>
                        </div>
                        <div className='w-full h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                            <div className='h-full transition-all duration-1000' style={{ width: `${item.value}%`, backgroundColor: item.color === 'bg-emerald-500' ? '#10b981' : item.color === 'bg-blue-500' ? '#3b82f6' : '#a855f7' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <button className='w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase hover:bg-emerald-100 transition-all flex items-center justify-center gap-2'>
                Lihat Detail Inventaris <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick Stats: Monthly Movement */}
          <div className="p-6 bg-linear-to-br from-gray-900 to-gray-800 rounded-[32px] shadow-xl text-white">
             <div className='flex items-center gap-3 mb-6'>
                <div className='p-2 bg-emerald-500/20 rounded-lg'>
                    <TrendingUp className='text-emerald-400' size={18}/>
                </div>
                <h4 className='font-bold text-xs uppercase tracking-tighter'>Mutasi Bulan Ini</h4>
             </div>
             
             <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                    <p className='text-[9px] font-bold text-gray-400 uppercase'>Sapi Masuk</p>
                    <p className='text-xl font-black text-emerald-400'>+42</p>
                </div>
                <div className='space-y-1'>
                    <p className='text-[9px] font-bold text-gray-400 uppercase'>Sapi Keluar</p>
                    <p className='text-xl font-black text-amber-400'>-18</p>
                </div>
             </div>

             <div className='mt-6 pt-6 border-t border-white/10'>
                <div className='flex items-center gap-2 text-[10px] text-gray-400 italic'>
                    <Activity size={12} />
                    <span>Perubahan Stok Netto: +24 Ekor</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Kandang;