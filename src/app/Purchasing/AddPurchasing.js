import React, { useState } from 'react';
import { 
  X, ShoppingBag, Hash, CreditCard, 
  User, Calendar, Info, CheckCircle2,
  FileText
} from 'lucide-react';

const AddPurchasing = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    item: "",
    qty: "",
    unit: "Sacks",
    amount: "",
    requestedBy: "",
    category: "Pakan"
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Format data agar sesuai dengan table di Purchasing.js
    const newRequest = {
      sn: "0" + Math.floor(Math.random() * 10 + 5),
      item: formData.item,
      qty: `${formData.qty} ${formData.unit}`,
      amount: parseInt(formData.amount).toLocaleString('id-ID'),
      requestedBy: formData.requestedBy,
      date: new Date().toLocaleDateString('id-ID'),
      status: "PENDING"
    };
    
    onAdd(newRequest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Section */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">New Procurement</h2>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Buat permintaan pengadaan barang baru</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Row 1: Item Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Name</label>
            <div className="relative">
              <input
                required
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Contoh: Mesin Perah Otomatis / Konsentrat"
                onChange={(e) => setFormData({...formData, item: e.target.value})}
              />
              <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
          </div>

          {/* Row 2: Qty & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  type="number"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="0"
                  onChange={(e) => setFormData({...formData, qty: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              >
                <option value="Sacks">Sacks</option>
                <option value="Pcs">Pcs</option>
                <option value="Bottles">Bottles</option>
                <option value="Kg">Kg</option>
                <option value="Unit">Unit</option>
              </select>
            </div>
          </div>

          {/* Row 3: Amount & Requester */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Cost (Rp)</label>
              <div className="relative">
                <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  type="number"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Total Harga"
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Requested By</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Nama Penanggung Jawab"
                  onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Alert Info */}
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex gap-4">
            <Info className="text-orange-500 shrink-0" size={20} />
            <p className="text-[11px] text-orange-700 font-medium leading-relaxed">
              Permintaan yang Anda buat akan berstatus <span className="font-black italic">PENDING</span> dan memerlukan persetujuan dari Manager Operasional sebelum diproses ke Vendor.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Submit Request
              <CheckCircle2 size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchasing;