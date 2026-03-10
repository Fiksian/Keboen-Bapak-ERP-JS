'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  X, ShoppingBag, CheckCircle2, Users, 
  Loader2, Plus, Trash2, ChevronRight, Box, AlertCircle
} from 'lucide-react';

const AddPurchasing = ({ isOpen, onClose, onAdd }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  const [contacts, setContacts] = useState([]); 
  const [stockMaster, setStockMaster] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const [items, setItems] = useState([
    { id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }
  ]);

  const [activeRowId, setActiveRowId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const vendorRef = useRef(null);
  const stockRefs = useRef({});

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [resContacts, resStocks] = await Promise.all([
            fetch('/api/contacts?type=SUPPLIER'),
            fetch('/api/stock')
          ]);
          if (resContacts.ok) setContacts(await resContacts.json());
          if (resStocks.ok) setStockMaster(await resStocks.json());
        } catch (err) {
          console.error("Failed to load master data:", err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorRef.current && !vendorRef.current.contains(event.target)) {
        setShowVendorDropdown(false);
      }
      if (activeRowId && stockRefs.current[activeRowId] && !stockRefs.current[activeRowId].contains(event.target)) {
        setActiveRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeRowId]);
  
  const isVendorValid = useMemo(() => {
    return contacts.some(c => c.name.toUpperCase() === supplier.toUpperCase());
  }, [supplier, contacts]);

  const checkItemValidity = (itemName) => {
    return stockMaster.some(s => s.name.toUpperCase() === itemName.toUpperCase());
  };

  const handleVendorChange = (e) => {
    setSupplier(e.target.value);
    setShowVendorDropdown(true);
  };

  const filteredContacts = useMemo(() => {
    if (!supplier) return [];
    return contacts.filter(c => 
      c.name.toLowerCase().includes(supplier.toLowerCase()) || 
      (c.companyName && c.companyName.toLowerCase().includes(supplier.toLowerCase()))
    ).slice(0, 8);
  }, [supplier, contacts]);

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return [];
    return stockMaster.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [searchTerm, stockMaster]);

  const handleItemInputChange = (id, value) => {
    updateItem(id, 'item', value);
    setSearchTerm(value);
    setActiveRowId(value.trim().length > 0 ? id : null);
  };

  const selectStockItem = (id, stock) => {
    const displayCategory = stock.category.includes(' - ') 
      ? stock.category.split(' - ')[1] 
      : stock.category;

    setItems(prev => prev.map(i => i.id === id ? { 
      ...i, 
      item: stock.name, 
      category: displayCategory,
      unit: stock.unit,
      price: parseInt(stock.price) || 0
    } : i));
    
    setActiveRowId(null);
    setSearchTerm("");
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleClose = useCallback(() => {
    setSupplier("");
    setItems([{ id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }]);
    setShowVendorDropdown(false);
    setActiveRowId(null);
    onClose();
  }, [onClose]);

  const totalHargaAll = items.reduce((acc, curr) => acc + (parseFloat(curr.qty || 0) * parseInt(curr.price || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVendorValid || items.some(i => !checkItemValidity(i.item))) return;

    setLoading(true);
    const payload = items.map(i => ({
      supplier: supplier.toUpperCase(),
      item: i.item.toUpperCase(),         
      qty: parseFloat(i.qty), 
      unit: i.unit,
      price: i.price.toString(),
      type: i.type,     
      category: i.category,
      requestedBy: session?.user?.name || "System"
    }));

    try {
      const promises = payload.map(data => 
        fetch('/api/purchasing', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        })
      );
      const results = await Promise.all(promises);
      if (results.every(res => res.ok)) {
        onAdd(); 
        handleClose();
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] h-full flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleClose}>
      <div className="bg-[#FDFDFD] w-full max-w-4xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white"><ShoppingBag size={24} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic">Create Bulk PO</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic text-blue-600">Strict Database Mode Active</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"><X size={24} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 custom-scrollbar">
          
          <div className={`p-6 rounded-[24px] border transition-all relative ${!isVendorValid && supplier ? 'bg-red-50 border-red-200' : 'bg-blue-50/50 border-blue-100/50'}`} ref={vendorRef}>
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] italic ml-1 flex items-center gap-2 ${!isVendorValid && supplier ? 'text-red-600' : 'text-blue-600'}`}>
              <Users size={12} /> Vendor Utama {!isVendorValid && supplier && "(Data Tidak Terdaftar)"}
            </label>
            <div className="relative mt-3">
              <input 
                required 
                autoComplete="off"
                className={`w-full bg-white border rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all uppercase ${!isVendorValid && supplier ? 'border-red-300 focus:ring-4 focus:ring-red-100' : 'border-blue-200 focus:ring-4 focus:ring-blue-100'}`} 
                placeholder="Cari & Pilih Vendor..." 
                value={supplier}
                onChange={handleVendorChange}
              />
              {showVendorDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-[200] left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                  {filteredContacts.map((c) => (
                    <div key={c.id} onClick={() => { setSupplier(c.name); setShowVendorDropdown(false); }} className="px-5 py-4 border-b border-gray-50 hover:bg-blue-600 hover:text-white cursor-pointer flex justify-between items-center group transition-colors text-left">
                      <div>
                        <p className="text-xs font-black uppercase italic">{c.name}</p>
                        <p className="text-[9px] font-bold opacity-70 uppercase">{c.companyName || "Verified Supplier"}</p>
                      </div>
                      <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Daftar Barang ({items.length})</label>
              <button type="button" onClick={() => setItems([...items, { id: Date.now(), item: "", qty: 0, unit: "Kg", price: 0, category: "Makro", type: "STOCKS" }])} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase italic shadow-md hover:bg-blue-700 transition-all active:scale-95">
                <Plus size={14} strokeWidth={3} /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((row) => {
                const isItemValid = checkItemValidity(row.item);
                return (
                  <div key={row.id} className={`group relative p-5 rounded-[24px] border transition-all ${!isItemValid && row.item ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm hover:border-blue-300'}`}>
                    
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter(i => i.id !== row.id))} className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10">
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4 space-y-1.5 text-left relative" ref={el => stockRefs.current[row.id] = el}>
                        <p className={`text-[9px] font-black uppercase tracking-tighter ml-1 ${!isItemValid && row.item ? 'text-red-500' : 'text-gray-400'}`}>
                          Nama Barang {!isItemValid && row.item && "(Not in DB)"}
                        </p>
                        <input 
                          required
                          autoComplete="off"
                          className={`w-full border rounded-xl px-4 py-3 text-xs font-bold outline-none uppercase transition-all ${!isItemValid && row.item ? 'bg-white border-red-300 focus:ring-red-100' : 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-200'}`}
                          placeholder="Ketik & Pilih Barang..."
                          value={row.item}
                          onChange={(e) => handleItemInputChange(row.id, e.target.value)}
                        />
                        
                        {activeRowId === row.id && filteredStocks.length > 0 && (
                          <div className="absolute z-[300] left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[220px] overflow-y-auto">
                            {filteredStocks.map((s) => (
                              <div key={s.id} onClick={() => selectStockItem(row.id, s)} className="px-4 py-3 border-b border-gray-50 hover:bg-blue-600 hover:text-white cursor-pointer flex items-center gap-3 transition-colors group text-left">
                                <Box size={14} className="text-blue-400 group-hover:text-white" />
                                <div>
                                  <p className="text-[10px] font-black uppercase italic">{s.name}</p>
                                  <p className="text-[8px] font-bold opacity-70 uppercase">{s.category} | Stok: {s.stock} {s.unit}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-1.5 text-left">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Kategori</p>
                        <input readOnly className="w-full bg-gray-100 border-none rounded-xl px-3 py-3 text-xs font-bold text-gray-400 cursor-not-allowed" value={row.category} />
                      </div>

                      <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        <div className="space-y-1.5 text-left">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Qty</p>
                          <input type="number" step="any" required className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={row.qty} onChange={(e) => updateItem(row.id, 'qty', e.target.value)} />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter ml-1">Unit</p>
                          <input readOnly className="w-full bg-gray-100 border-none rounded-xl px-3 py-3 text-xs font-bold text-gray-400 cursor-not-allowed" value={row.unit} />
                        </div>
                      </div>

                      <div className="md:col-span-3 space-y-1.5 text-left">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter ml-1">Harga Satuan</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">Rp</span>
                          <input type="number" required className="w-full bg-blue-50/30 border-none rounded-xl pl-8 pr-3 py-3 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" value={row.price} onChange={(e) => updateItem(row.id, 'price', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="bg-gray-900 px-6 py-4 rounded-2xl w-full sm:w-auto shadow-lg text-left">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Total Estimasi</p>
                <p className="text-xl font-black text-white italic tracking-tighter">Rp {totalHargaAll.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={handleClose} className="flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[11px] font-black uppercase italic text-gray-400 hover:bg-gray-50 transition-colors">Discard</button>
              <button 
                onClick={handleSubmit} 
                disabled={
                  loading || 
                  !isVendorValid || 
                  items.some(i => !checkItemValidity(i.item) || i.qty <= 0)
                } 
                className="flex-[2] sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 py-4 text-[11px] font-black shadow-xl shadow-blue-100 uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> Submit {items.length} Items</>}
              </button>
            </div>
          </div>
          {!isVendorValid && supplier && (
            <p className="text-[10px] text-red-500 font-bold uppercase mt-3 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> Periksa kembali Vendor atau Barang. Pastikan semua terpilih dari daftar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPurchasing;