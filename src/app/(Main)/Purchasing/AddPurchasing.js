'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  X, ShoppingBag, Hash, CreditCard, 
  User, Info, CheckCircle2,
  FileText, Layers, Tag
} from 'lucide-react';

const AddPurchasing = ({ isOpen, onClose, onAdd }) => {
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    item: "",
    qty: 0,
    unit: "Sacks",
    amount: 0,
    category: "Pakan", 
    type: "STOCKS"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawData = {
      item: formData.item,
      qty: `${formData.qty} ${formData.unit}`,
      amount: formData.amount.toString(),
      requestedBy: session?.user?.name || "System User",
      type: formData.type,     
      category: formData.category
    };

    try {
      const res = await fetch('/api/purchasing', {
        method: 'POST',
        body: JSON.stringify(rawData),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        onAdd(); 
        onClose();
      } else {
        alert("Gagal mengirim permintaan.");
      }
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center min-h-full justify-center p-4 bg-black/40 backdrop-blur-sm transition-all text-gray-800">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic">New Procurement</h2>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest italic text-blue-600">
                Requested by: {session?.user?.name || "Loading..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Baris 1: Item Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Name</label>
              <div className="relative">
                <input
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Nama Barang"
                  onChange={(e) => setFormData({...formData, item: e.target.value})}
                />
                <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori (Category)</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Pakan">Pakan</option>
                  <option value="Obat">Obat / Vaksin</option>
                  <option value="Alat">Alat / Perlengkapan</option>
                  <option value="Lainnya">Lain-lain</option>
                </select>
                <Tag className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          {/* Baris 2: Stock Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  value={formData.type}
                >
                  <option value="STOCKS">STOCKS</option>
                  <option value="INVENTORY">INVENTORY</option>
                </select>
                <Layers className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qty</label>
                  <input
                    required type="number"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-blue-500"
                    onChange={(e) => setFormData({...formData, qty: parseFloat(e.target.value) || 0})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none appearance-none cursor-pointer"
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="Sacks">Sacks</option>
                    <option value="Kg">Kg</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Unit">Unit</option>
                  </select>
               </div>
            </div>
          </div>

          {/* Baris 3: Harga Satuan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Harga Satuan (Rp)</label>
            <div className="relative">
              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                required type="number"
                className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                placeholder="0"
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            {formData.qty > 0 && formData.amount > 0 && (
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total:</span>
                <span className="text-sm font-black text-blue-600">Rp {(formData.qty * formData.amount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">Discard</button>
            <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
              Submit Request <CheckCircle2 size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchasing;