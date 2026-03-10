'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Box, CheckCircle2, Loader2, 
  Database, Scale, Tag, AlertTriangle , Plus
} from 'lucide-react';

const AddStockModal = ({ isOpen, onClose, onAdd }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'MAKRO',
    stock: '',
    unit: 'KG',
    price: '0',
    type: 'STOCKS'
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        category: 'MAKRO',
        stock: '',
        unit: 'KG',
        price: '0',
        type: 'STOCKS'
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.toUpperCase(),
          stock: parseFloat(formData.stock)
        }),
      });

      if (response.ok) {
        onAdd();
        onClose();
      } else {
        const err = await response.json();
        alert(err.message || "Gagal memperbarui stok");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-100">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic text-gray-900">Master Stock Entry</h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5 italic">Inventory Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Database size={12} /> Nama Barang
            </label>
            <input 
              required
              name="name"
              className="w-full text-gray-600 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all uppercase"
              placeholder="CONTOH: JAGUNG GILING..."
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Tag size={12} /> Kategori
              </label>
              <select 
                name="category"
                className="w-full text-gray-600  bg-gray-50 border-transparent rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 appearance-none transition-all"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="MAKRO">MAKRO</option>
                <option value="MIKRO">MIKRO</option>
                <option value="MEDICINE">HIJAUAN</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Scale size={12} /> Satuan
              </label>
              <select 
                name="unit"
                className="w-full text-gray-600  bg-gray-50 border-transparent rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 appearance-none transition-all"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="KG">KG</option>
                <option value="TON">TON</option>
                <option value="SAK">SAK (50KG)</option>
                <option value="PCS">PCS</option>
                <option value="LITER">LITER</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                Harga Dasar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">Rp</span>
                <input 
                  type="number"
                  name="price"
                  className="w-full text-gray-600  bg-gray-50 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl pl-10 pr-4 py-4 text-sm font-bold outline-none transition-all"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
            <AlertTriangle className="text-amber-600 shrink-0" size={18} />
            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed tracking-tight">
              Jika barang sudah ada di database, sistem akan secara otomatis menambahkan (akumulasi) saldo stok saat ini.
            </p>
          </div>
        </form>

        <div className="p-6 bg-gray-50 flex gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.stock}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 py-4 text-[11px] font-black shadow-xl shadow-emerald-100 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Update Stock Database</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;