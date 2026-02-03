'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Package, Layers, Calendar as CalendarIcon, 
  Plus, Trash2, Database, Scale, ChevronDown, Loader2, Search
} from 'lucide-react';

const ProductionModal = ({ isOpen, onClose, onSubmit }) => {
  const [ingredients, setIngredients] = useState([
    { itemId: '', itemName: '', qtyNeeded: '', unit: 'UNIT' }
  ]);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [targetQty, setTargetQty] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const fetchItems = async () => {
        try {
          const res = await fetch('/api/stock');
          if (res.ok) {
            const data = await res.json();
            setWarehouseItems(data);
            setFilteredItems(data);
          }
        } catch (err) {
          console.error("Gagal mengambil daftar stok:", err);
        }
      };
      fetchItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const addIngredient = () => {
    setIngredients([...ingredients, { itemId: '', itemName: '', qtyNeeded: '', unit: 'UNIT' }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };


  const selectItem = (index, item) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      itemId: item.id,
      itemName: item.name,
      unit: item.unit ? item.unit.toUpperCase() : 'UNIT'
    };
    setIngredients(updated);
    setActiveDropdown(null); 
  };

  const handleSearchChange = (index, value) => {
    const updated = [...ingredients];
    updated[index].itemName = value;
    setIngredients(updated);
    
    const searchTerm = value.toLowerCase();
    const filtered = warehouseItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm)
    );
    
    setFilteredItems(filtered);
    setActiveDropdown(index);
  };

  const handleInternalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      productName: formData.get('productName')?.toString().toUpperCase() || "",
      targetQty: targetQty,
      targetUnit: formData.get('targetUnit')?.toString().toUpperCase() || "UNIT",
      date: formData.get('date'),
      ingredients: ingredients.map(ing => ({
        ...ing,
        itemName: ing.itemName.toUpperCase(),
        qtyNeeded: parseFloat(ing.qtyNeeded) || 0,
        unit: ing.unit.toUpperCase()
      }))
    };

    try {
      await onSubmit(data);
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="text-left">
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">New Production Batch</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Setup production materials & target</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form id="production-form" onSubmit={handleInternalSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1">Finished Product Name</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="productName" type="text" required placeholder="Enter finished goods name..." className="w-full text-slate-700 pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold shadow-inner uppercase" />
              </div>
            </div>
            
            <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1">Output Qty</label>
              <input 
                  name="qty" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={targetQty}
                  onChange={(e) => setTargetQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-slate-700 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold shadow-inner" 
              />
            </div>

            <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1">Output Unit</label>
              <input name="targetUnit" type="text" required defaultValue="UNIT" className="w-full text-indigo-600 px-6 py-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl outline-none text-sm font-black uppercase shadow-inner" />
            </div>

            <div className="text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block italic ml-1">Production Date</label>
              <input name="date" type="date" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 shadow-inner" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100" ref={dropdownRef}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 italic">
                <Database size={14} className="text-indigo-600" /> Bill of Materials
              </h3>
              <button type="button" onClick={addIngredient} className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors uppercase italic flex items-center gap-2">
                <Plus size={14} /> Add Material
              </button>
            </div>

            <div className="space-y-4">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-3 items-end relative animate-in slide-in-from-left-2 duration-200">
                  <div className="flex-[3] relative text-left">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block italic">Material Name</label>
                    <div className="relative">
                      <input 
                        placeholder="Search stock..."
                        value={ing.itemName}
                        onChange={(e) => handleSearchChange(index, e.target.value)}
                        onFocus={() => { 
                          setActiveDropdown(index); 
                          setFilteredItems(warehouseItems);
                        }}
                        required
                        className="w-full text-slate-700 pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:bg-white text-xs font-bold uppercase transition-all"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    </div>

                    {activeDropdown === index && (
                      <div className="absolute z-[70] mt-1 w-full bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto py-2 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                          <button 
                            key={item.id} 
                            type="button" 
                            onClick={() => selectItem(index, item)} 
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-none group"
                          >
                            <div className="text-xs font-black text-slate-700 uppercase group-hover:text-indigo-600">{item.name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[9px] text-slate-400 uppercase font-bold italic">Stock: {item.stock} {item.unit}</span>
                              <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.category}</span>
                            </div>
                          </button>
                        )) : (
                          <div className="px-4 py-6 text-center">
                            <Package size={24} className="mx-auto text-slate-200 mb-2" />
                            <div className="text-[10px] text-slate-400 font-bold uppercase italic">Item not found</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block italic">Qty</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={ing.qtyNeeded} 
                      onChange={(e) => {
                        const updated = [...ingredients];
                        updated[index].qtyNeeded = e.target.value;
                        setIngredients(updated);
                      }} 
                      required 
                      className="w-full text-slate-700 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold" 
                    />
                  </div>

                  <div className="w-24 text-left">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block italic">Unit</label>
                    <div className="relative">
                      <select 
                        value={ing.unit} 
                        onChange={(e) => {
                          const updated = [...ingredients];
                          updated[index].unit = e.target.value.toUpperCase();
                          setIngredients(updated);
                        }}
                        className="w-full appearance-none text-indigo-600 px-3 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] font-black text-center uppercase shadow-sm outline-none focus:border-indigo-500 cursor-pointer pr-6"
                      >
                        {['KG', 'GR', 'TON', 'LITER', 'ML', 'UNIT', 'SACKS'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-300">
                        <ChevronDown size={10} />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => removeIngredient(index)} 
                    disabled={ingredients.length === 1} 
                    className="p-3 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-all active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-50 flex gap-4 bg-slate-50/30 sticky bottom-0">
          <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-slate-100 bg-white text-slate-400 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all italic shadow-sm">
            Discard
          </button>
          <button 
            type="submit" 
            form="production-form"
            disabled={loading}
            className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 italic"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> Processing...</>
            ) : (
              "Confirm & Start Batch"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionModal;