import React, { useState } from 'react';
import { 
  Box, ShoppingCart, AlertTriangle, TrendingUp, 
  Plus, Search, Filter, MoreHorizontal, Package,
  ChevronRight, Database
} from 'lucide-react';

const StockInventory = () => {
  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' or 'inventory'

  // Data Dummy Peternakan Sapi
  const stockData = [
    { sn: '01', name: 'Sapi Limousin Dewasa', id: 'LMS-001', category: 'Ternak Hidup', price: 'Rp 25.000.000', stock: '5 Ekor', status: 'READY' },
    { sn: '02', name: 'Daging Sapi Wagyu A5', id: 'WGY-442', category: 'Produk Olahan', price: 'Rp 1.500.000', stock: '12 kg', status: 'LIMITED' },
    { sn: '03', name: 'Susu Sapi Segar (Liter)', id: 'MLK-098', category: 'Produk Harian', price: 'Rp 18.000', stock: '0 Liter', status: 'SOLD OUT' },
    { sn: '04', name: 'Sapi Brahman Muda', id: 'BRH-021', category: 'Ternak Hidup', price: 'Rp 15.000.000', stock: '8 Ekor', status: 'READY' },
  ];

  const inventoryData = [
    { sn: '01', name: 'Pakan Konsentrat Hijau', id: 'FOD-01', category: 'Pakan', price: 'Rp 5.000', stock: '500 kg', status: 'READY' },
    { sn: '02', name: 'Vaksin Anthrax 50ml', id: 'MED-22', category: 'Kesehatan', price: 'Rp 450.000', stock: '2 Botol', status: 'LIMITED' },
    { sn: '03', name: 'Jerami Padi Kering', id: 'FOD-05', category: 'Pakan', price: 'Rp 2.500', stock: '10 Ball', status: 'READY' },
  ];

  const currentData = activeTab === 'stocks' ? stockData : inventoryData;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'READY': return 'bg-green-50 text-green-600 border-green-100';
      case 'LIMITED': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'SOLD OUT': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8">
      
      {/* Tab Navigation */}
      <div className="flex gap-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('stocks')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'stocks' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Stocks (Siap Jual)
          {activeTab === 'stocks' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'inventory' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Inventory (Bahan & Alat)
          {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Categories" value="12" sub="↑ 2 more than last month" icon={<Box className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Total Items" value="840" sub="↑ 10 more than last week" icon={<ShoppingCart className="text-orange-500" />} color="bg-orange-50" />
        <StatCard title="Low Stock Items" value="12" sub="! Action required" icon={<AlertTriangle className="text-purple-500" />} color="bg-purple-50" />
        <StatCard title="Top Commodity" value="Sapi Limousin" sub="↑ High demand" icon={<TrendingUp className="text-green-500" />} color="bg-green-50" />
      </div>

      {/* Banner / Header Table */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            DAFTAR {activeTab === 'stocks' ? 'PRODUK SIAP JUAL' : 'BAHAN & ALAT'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Kelola data operasional perternakan Anda dengan mudah.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-bold text-sm">
          <Plus size={18} strokeWidth={3} />
          Update {activeTab === 'stocks' ? 'Stok Jual' : 'Inventaris'}
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                <th className="px-8 py-6">S/N</th>
                <th className="px-6 py-6 text-center">Image</th>
                <th className="px-6 py-6">Nama Produk</th>
                <th className="px-6 py-6">ID</th>
                <th className="px-6 py-6">Kategori</th>
                <th className="px-6 py-6">Harga</th>
                <th className="px-6 py-6">Sisa Stok</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-6 text-sm text-gray-400 font-medium">{item.sn}</td>
                  <td className="px-6 py-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mx-auto text-gray-300">
                      {activeTab === 'stocks' ? <Package size={20} /> : <Database size={20} />}
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-gray-800">{item.name}</td>
                  <td className="px-6 py-6 text-sm text-gray-500 font-mono">{item.id}</td>
                  <td className="px-6 py-6 text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-6 font-bold text-gray-800">{item.price}</td>
                  <td className="px-6 py-6 font-bold text-gray-800">{item.stock}</td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline cursor-pointer">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-komponen untuk Kartu Statistik
const StatCard = ({ title, value, sub, icon, color }) => (
  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-gray-800 tracking-tight">{value}</h3>
      <p className={`text-[10px] font-bold ${sub.includes('!') ? 'text-purple-500' : 'text-green-500'}`}>
        {sub}
      </p>
    </div>
    <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
  </div>
);

export default StockInventory;