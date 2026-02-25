'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  X, ShoppingBag, CheckCircle2, Users, 
  Loader2, Plus, Trash2, ChevronRight
} from 'lucide-react';

const AddPurchasing = ({ isOpen, onClose, onAdd }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [supplier, setSupplier] = useState("");
  const [contacts, setContacts] = useState([]); 
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [items, setItems] = useState([
    { id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }
  ]);

  useEffect(() => {
    if (isOpen) {
      const fetchContacts = async () => {
        try {
          const res = await fetch('/api/contacts?type=SUPPLIER');
          if (res.ok) {
            const data = await res.json();
            setContacts(data);
          }
        } catch (err) {
          console.error("Failed to load contacts:", err);
        }
      };
      fetchContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setSupplier(value);

    if (value.trim().length > 0) {
      const search = value.toLowerCase();
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(search) || 
        c.companyName.toLowerCase().includes(search)
      );
      setFilteredContacts(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const selectContact = (contact) => {
    setSupplier(contact.name);
    setShowDropdown(false);
  };

  const handleClose = useCallback(() => {
    setSupplier("");
    setItems([{ id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }]);
    setShowDropdown(false);
    onClose();
  }, [onClose]);

  const addNewItem = () => {
    setItems([...items, { id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totalHargaAll = items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = items.map(i => ({
      supplier: supplier.toUpperCase(),
      item: i.item.toUpperCase(),         
      qty: `${i.qty} ${i.unit}`,
      price: i.price.toString(),
      type: i.type,     
      category: i.category
    }));

    try {
      const promises = payload.map(data => 
        fetch('/api/purchasing', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await Promise.all(promises);
      
      onAdd(); 
      handleClose();
    } catch (error) {
      console.error("Submit Error:", error);
      alert("Terjadi kesalahan saat mengirim data.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] h-full flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm text-gray-800 animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div 
        className="bg-[#FDFDFD] w-full max-w-4xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic leading-tight">Create Bulk PO</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic mt-1">
                Requested By: {session?.user?.name || "System"}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar space-y-8">
          
          <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100/50 space-y-3 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] italic ml-1 flex items-center gap-2">
              <Users size={12} /> Vendor / Supplier Utama
            </label>
            <div className="relative">
              <input 
                required 
                className="w-full bg-white border border-blue-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all uppercase" 
                placeholder="Cari atau Ketik Nama Vendor..." 
                value={supplier}
                onChange={handleSupplierChange}
                onFocus={() => supplier.length > 0 && setShowDropdown(true)}
              />
              
              {showDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-[160] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredContacts.map((c) => (
                    <div 
                      key={c.id}
                      onClick={() => selectContact(c)}
                      className="px-5 py-4 border-b border-gray-50 last:border-none hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-all"
                    >
                      <div className="text-left">
                        <p className="text-xs font-black uppercase italic text-gray-700">{c.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          {c.companyName !== "-" ? c.companyName : "Personal Vendor"}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Daftar Barang ({items.length})</label>
              <button 
                type="button"
                onClick={addNewItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic hover:bg-blue-700 transition-all shadow-md"
              >
                <Plus size={14} strokeWidth={3} /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((row, index) => (
                <div key={row.id} className="group relative bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm hover:border-blue-300 transition-all">
                  
                  {items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeItem(row.id)}
                      className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 space-y-1.5 text-left">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Nama Barang {index + 1}</p>
                      <input 
                        required
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-blue-200 outline-none uppercase"
                        placeholder="Contoh: Jagung"
                        value={row.item}
                        onChange={(e) => updateItem(row.id, 'item', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1.5 text-left">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Kategori</p>
                      <select 
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-3 py-3 text-xs font-bold outline-none cursor-pointer"
                        value={row.category}
                        onChange={(e) => updateItem(row.id, 'category', e.target.value)}
                      >
                        <option value="Makro">Makro</option>
                        <option value="Mikro">Mikro</option>
                        <option value="Premix">Premix</option>
                        <option value="Hijauan">Hijauan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-2 gap-2 space-y-0">
                      <div className="space-y-1.5 text-left">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Qty</p>
                        <input 
                          type="number" step="0.01" required
                          className="w-full bg-gray-50 border border-transparent rounded-xl px-3 py-3 text-xs font-bold outline-none"
                          value={row.qty}
                          onChange={(e) => updateItem(row.id, 'qty', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1.5 text-left">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Unit</p>
                        <select 
                          className="w-full bg-gray-50 border border-transparent rounded-xl px-2 py-3 text-xs font-bold outline-none cursor-pointer"
                          value={row.unit}
                          onChange={(e) => updateItem(row.id, 'unit', e.target.value)}
                        >
                          <option value="Kg">Kg</option>
                          <option value="Ton">Ton</option>
                          <option value="Liter">Liter</option>
                          <option value="Unit">Unit</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-3 space-y-1.5 text-left">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter ml-1">Harga Satuan</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                        <input 
                          type="number" required
                          className="w-full bg-blue-50/30 border border-transparent rounded-xl pl-8 pr-3 py-3 text-xs font-bold focus:bg-white focus:border-blue-200 outline-none"
                          value={row.price}
                          onChange={(e) => updateItem(row.id, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 bg-gray-900 px-6 py-4 rounded-2xl w-full sm:w-auto shadow-lg">
              <div className="text-left">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Grand Total Estimation</p>
                <p className="text-xl font-black text-white italic tracking-tighter">
                  Rp {totalHargaAll.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={handleClose}
                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || !supplier || items.some(i => !i.item || i.qty <= 0)}
                className="flex-[2] sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 py-4 text-[11px] font-black shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest italic disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Submit {items.length} Items</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchasing;