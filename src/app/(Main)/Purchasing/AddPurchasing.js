import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  X, ShoppingBag, CreditCard, 
  CheckCircle2, FileText, Tag, Users, 
  Layers, Loader2, Info
} from 'lucide-react';

const AddPurchasing = ({ isOpen, onClose, onAdd }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const initialFormState = {
    supplier: "",
    item: "",
    qty: 0,
    unit: "Kg",
    amount: 0,
    category: "Pakan",
    type: "STOCKS"
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleClose = useCallback(() => {
    setFormData(initialFormState);
    onClose();
  }, [onClose]);

  const totalHarga = formData.qty * formData.amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const rawData = {
      supplier: formData.supplier.toUpperCase(),
      item: formData.item.toUpperCase(),         
      qty: `${formData.qty} ${formData.unit}`,
      amount: formData.amount.toString(),
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
        handleClose();
      } else {
        const err = await res.json();
        alert(err.message || "Gagal mengirim Purchase Order.");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 h-full flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm text-gray-800"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic text-left">Create Purchase Order</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-black uppercase italic">Auto-Numbering Active</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                  By: {session?.user?.name || "System"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Vendor / Supplier</label>
            <div className="relative">
              <input 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all uppercase" 
                placeholder="Masukkan Supplier" 
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value.toUpperCase()})}
              />
              <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Nama Barang</label>
              <div className="relative">
                <input 
                  required 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 uppercase" 
                  placeholder="Nama Barang" 
                  value={formData.item}
                  onChange={(e) => setFormData({...formData, item: e.target.value.toUpperCase()})}
                />
                <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              </div>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Kategori</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Pakan">Pakan (Bahan Baku)</option>
                  <option value="Obat">Obat / Vaksin</option>
                  <option value="Alat">Alat / Perlengkapan</option>
                  <option value="Lainnya">Lain-lain</option>
                </select>
                <Tag className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic ml-1">Tipe Stok</label>
              <div className="relative">
                <select 
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-blue-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="STOCKS">STOCKS</option>
                  <option value="INVENTORY">INVENTORY</option>
                </select>
                <Layers className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" size={18} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Qty</label>
                <input required type="number" step="0.001" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none" value={formData.qty} onChange={(e) => setFormData({...formData, qty: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Unit</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold outline-none appearance-none cursor-pointer" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                  <option value="Kg">Kg</option>
                  <option value="Ton">Ton</option>
                  <option value="Sacks">Sacks</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic ml-1">Harga Satuan (Rp)</label>
            <div className="relative">
              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input required type="number" className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-500 uppercase" placeholder="" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
            </div>
          </div>

          {totalHarga > 0 && (
            <div className="flex justify-between items-center px-6 py-5 bg-gray-900 rounded-[24px] shadow-xl animate-in slide-in-from-bottom-2 duration-500 border border-gray-800">
              <div className="text-left">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter block">Estimasi Total Tagihan</span>
                <span className="text-[10px] text-blue-400 font-bold italic lowercase flex items-center gap-1">
                  <Info size={10} /> dikalkulasi otomatis oleh sistem
                </span>
              </div>
              <span className="text-2xl font-black text-white italic tracking-tighter">
                Rp {totalHarga.toLocaleString('id-ID')}
              </span>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              disabled={loading}
              onClick={handleClose} 
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter italic disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>Processing... <Loader2 size={18} className="animate-spin" /></>
              ) : (
                <>Submit Purchase Order <CheckCircle2 size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchasing;