import React, { useState } from 'react';
import { 
  X, Package, Tag, DollarSign, 
  Layers, Info, CheckCircle2, Database 
} from 'lucide-react';

const AddStock = ({ isOpen, onClose, activeTab, onAdd }) => {
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    category: "",
    price: "",
    stock: "",
    status: "READY"
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Menambahkan suffix satuan berdasarkan tab
    const formattedStock = activeTab === 'stocks' ? `${formData.stock} Ekor/kg` : `${formData.stock} Unit`;
    onAdd({
      ...formData,
      sn: '0' + (Math.floor(Math.random() * 9) + 5), // Generate SN dummy
      stock: formattedStock,
      price: `Rp ${parseInt(formData.price).toLocaleString('id-ID')}`
    });
    onClose();
  };

  const isStockTab = activeTab === 'stocks';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">
              {isStockTab ? 'Tambah Produk Jual' : 'Tambah Inventaris'}
            </h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">
              Input data {isStockTab ? 'Komoditas' : 'Bahan Baku'} baru
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {/* Nama Produk */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Item</label>
            <div className="relative">
              <input
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder={isStockTab ? "Contoh: Sapi Limousin" : "Contoh: Pakan Organik"}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500">
                {isStockTab ? <Package size={18} /> : <Database size={18} />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ID Produk */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID / Kode</label>
              <input
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-mono text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="EX: LMS-002"
                onChange={(e) => setFormData({...formData, id: e.target.value})}
              />
            </div>
            {/* Kategori */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {isStockTab ? (
                  <>
                    <option>Ternak Hidup</option>
                    <option>Produk Olahan</option>
                    <option>Produk Harian</option>
                  </>
                ) : (
                  <>
                    <option>Pakan</option>
                    <option>Kesehatan</option>
                    <option>Alat Kebersihan</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Harga */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Harga Satuan (Rp)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="0"
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>
            {/* Stok */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Stok</label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="0"
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Awal</label>
            <div className="flex gap-3">
              {['READY', 'LIMITED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${
                    formData.status === s 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Simpan Ke {isStockTab ? 'Produk' : 'Gudang'}
              <CheckCircle2 size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStock;