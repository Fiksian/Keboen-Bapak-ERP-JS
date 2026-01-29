
import React, { useState, useEffect, useCallback } from 'react';
import { X, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

const EditStock = ({ isOpen, onClose, itemData, fetchAllStocks }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    status: "",
    type: "",
    notes: ""
  });

  const handleClose = useCallback(() => {
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      status: "",
      type: "",
      notes: ""
    });
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (itemData && isOpen) {
      setFormData({
        name: itemData.name,
        category: itemData.category || "General",
        price: itemData.price || "0",
        stock: itemData.stock || 0,
        status: itemData.status || "READY",
        type: itemData.type || "STOCKS",
        notes: "" 
      });
    }
  }, [itemData, isOpen]);

  if (!isOpen || !itemData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.notes.trim()) {
      alert("Mohon isi alasan perubahan stok.");
      return;
    }

    try {
      const res = await fetch(`/api/stock/${itemData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAllStocks();
        handleClose();
      } else {
        alert("Gagal memperbarui stok.");
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <div 
      className="fixed h-full inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
      onClick={handleClose} 
    >
      <div 
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} 
      >
        
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 text-left">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase italic text-left">Edit Item Data</h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest text-left">{formData.name}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left">Category</label>
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-all"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left">Stock Type</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-50 border text-gray-700 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="STOCKS">STOCKS</option>
                  <option value="INVENTORY">INVENTORY</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 w-full text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock Level</label>
            <div className="relative">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 flex items-center gap-1 italic">
              <AlertCircle size={12} /> Reason for Change
            </label>
            <textarea 
              required
              placeholder="Contoh: Koreksi stok rusak / Hasil opname mingguan..."
              className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-blue-500 transition-all h-28 resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={handleClose} 
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Discard
            </button>
            <button 
              type="submit" 
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-tighter italic"
            >
              Save Changes <CheckCircle2 size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStock;