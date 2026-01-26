'use client'

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, PlusCircle, Layers, Calendar, Wheat, BookMarked, Search, ChevronRight, Check } from 'lucide-react';

const AddProduction = ({ isOpen, onClose, onSave }) => {
  // Daftar Master Data Stok
  const STOCK_ITEMS = ["JAGUNG", "BUNGKIL KEDELAI", "DEDAK", "MOLASES", "GAPLEK", "ONGGOK", "POLARD", "UREA", "ROTI GILING", "MENIR JAGUNG"];

  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    productName: 'KONSENTRAT CUSTOM',
    targetQty: '',
    tertimbangQty: '',
    kandangQty: '0',
    ingredients: [{ id: Date.now(), itemName: '', qtyUsed: '', showSuggestions: false }]
  };

  const [formData, setFormData] = useState(initialForm);
  const [presets, setPresets] = useState([]);
  const [showPresetManager, setShowPresetManager] = useState(false);

  useEffect(() => {
    const savedPresets = localStorage.getItem('production_presets');
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  useEffect(() => {
    if (!isOpen) setFormData(initialForm);
  }, [isOpen]);

  const addIngredientRow = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { id: Date.now(), itemName: '', qtyUsed: '', showSuggestions: false }]
    });
  };

  const updateIngredient = (id, field, value) => {
    const newIngredients = formData.ingredients.map(ing => {
      if (ing.id === id) {
        const updatedItem = { ...ing, [field]: value };
        // Munculkan saran hanya jika user mengetik di field itemName
        if (field === 'itemName') {
          updatedItem.showSuggestions = value.length > 0;
        }
        return updatedItem;
      }
      return ing;
    });
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const selectIngredient = (id, name) => {
    const newIngredients = formData.ingredients.map(ing => {
      if (ing.id === id) {
        return { ...ing, itemName: name, showSuggestions: false };
      }
      return ing;
    });
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const saveAsPreset = () => {
    const presetName = prompt("Nama Preset Resep:");
    if (presetName) {
      const newPreset = {
        name: presetName.toUpperCase(),
        ingredients: formData.ingredients.map(({ itemName, qtyUsed }) => ({ itemName, qtyUsed }))
      };
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      localStorage.setItem('production_presets', JSON.stringify(updatedPresets));
    }
  };

  const deletePreset = (e, index) => {
    e.stopPropagation();
    if (confirm("Hapus preset ini?")) {
      const updatedPresets = presets.filter((_, i) => i !== index);
      setPresets(updatedPresets);
      localStorage.setItem('production_presets', JSON.stringify(updatedPresets));
    }
  };

  const applyPreset = (preset) => {
    setFormData({
      ...formData,
      ingredients: preset.ingredients.map(ing => ({
        ...ing,
        id: Math.random(),
        showSuggestions: false
      }))
    });
    setShowPresetManager(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto antialiased font-sans">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 overflow-visible my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-t-[32px]">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none">New Production</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
              <Layers size={12} /> Local Session Mode
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setShowPresetManager(!showPresetManager)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase italic border transition-all flex items-center gap-1.5 ${showPresetManager ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-amber-100 text-amber-600 shadow-sm hover:bg-amber-50'}`}
            >
              <BookMarked size={14} /> Presets
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><X size={20} strokeWidth={3} /></button>
          </div>
        </div>

        {/* Preset Manager Ribbon */}
        {showPresetManager && (
          <div className="px-6 py-3 bg-amber-50/50 border-b border-amber-100 flex gap-2 overflow-x-auto no-scrollbar">
            {presets.length > 0 ? presets.map((p, i) => (
              <div key={i} className="flex items-center group shrink-0">
                <button 
                  type="button"
                  onClick={() => applyPreset(p)} 
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-amber-200 rounded-l-lg text-[9px] font-black text-amber-700 uppercase italic hover:bg-amber-100 transition-all"
                >
                  {p.name}
                </button>
                <button 
                  type="button"
                  onClick={(e) => deletePreset(e, i)}
                  className="px-1.5 py-1.5 bg-white border-y border-r border-amber-200 rounded-r-lg text-amber-300 hover:text-rose-500 hover:bg-rose-50 transition-all border-l-0"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            )) : <p className="text-[9px] font-bold text-amber-400 uppercase italic px-2">No presets found...</p>}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-5 text-left">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Produk Jadi</label>
              <div className="relative">
                <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <select value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white shadow-sm">
                  <option>KONSENTRAT CUSTOM</option>
                  <option>CBF 41 SILASE 10%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex flex-col items-center">
              <label className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter mb-1">Target (Kg)</label>
              <input type="number" required value={formData.targetQty} onChange={(e) => setFormData({...formData, targetQty: e.target.value})} className="w-full bg-transparent text-center text-sm font-black text-indigo-600 outline-none" placeholder="0" />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Tertimbang (Kg)</label>
              <input type="number" value={formData.tertimbangQty} onChange={(e) => setFormData({...formData, tertimbangQty: e.target.value})} className="w-full bg-transparent text-center text-sm font-black text-slate-600 outline-none" placeholder="0" />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Kandang (Kg)</label>
              <input type="number" value={formData.kandangQty} onChange={(e) => setFormData({...formData, kandangQty: e.target.value})} className="w-full bg-transparent text-center text-sm font-black text-slate-600 outline-none" placeholder="0" />
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-tighter flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-500 rounded-full" /> Pemakaian Bahan Baku
              </h3>
              <div className="flex gap-3">
                <button type="button" onClick={saveAsPreset} className="text-[8px] font-bold text-amber-600 uppercase italic hover:underline">Save Preset</button>
                <button type="button" onClick={addIngredientRow} className="text-[8px] font-black text-indigo-600 uppercase italic flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                  <PlusCircle size={12} /> Add Item
                </button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl bg-white shadow-sm max-h-64 overflow-y-auto no-scrollbar">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-20 border-b border-slate-100">
                  <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-2.5 text-left pl-4">Material Name</th>
                    <th className="p-2.5 text-center w-24">Qty (Kg)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {formData.ingredients.map((ing) => (
                    <tr key={ing.id} className="group transition-colors relative">
                      <td className="p-1 pl-4 relative overflow-visible">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                          <input 
                            type="text" 
                            className="w-full bg-transparent pl-8 pr-3 py-2 text-xs font-bold text-slate-700 outline-none uppercase"
                            placeholder="Cari bahan..."
                            value={ing.itemName}
                            onChange={(e) => updateIngredient(ing.id, 'itemName', e.target.value.toUpperCase())}
                            onFocus={() => ing.itemName && updateIngredient(ing.id, 'showSuggestions', true)}
                          />
                        </div>

                        {/* Dropdown Autocomplete */}
                        {ing.showSuggestions && (
                          <div className="absolute left-0 right-4 top-full z-[150] bg-white border border-slate-100 shadow-2xl rounded-xl mt-1 py-1 overflow-hidden ring-4 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150">
                            {STOCK_ITEMS.filter(s => s.includes(ing.itemName)).length > 0 ? (
                              STOCK_ITEMS.filter(s => s.includes(ing.itemName)).map(s => (
                                <button 
                                  key={s} 
                                  type="button" 
                                  onClick={() => selectIngredient(ing.id, s)}
                                  className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 uppercase italic flex justify-between items-center group/item"
                                >
                                  {s}
                                  <Check size={10} className="opacity-0 group-hover/item:opacity-100 text-indigo-500" />
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-[10px] text-slate-400 italic font-bold uppercase">Bahan tidak ditemukan</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-1 text-center">
                        <input type="number" value={ing.qtyUsed} onChange={(e) => updateIngredient(ing.id, 'qtyUsed', e.target.value)} className="w-full bg-slate-50 rounded-lg py-1.5 text-xs font-black text-indigo-600 text-center outline-none focus:bg-indigo-100/30 transition-colors" placeholder="0" />
                      </td>
                      <td className="p-1 text-right pr-4">
                        <button type="button" onClick={() => setFormData({...formData, ingredients: formData.ingredients.filter(i => i.id !== ing.id)})} className="p-1.5 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl text-[10px] font-bold text-slate-400 uppercase italic hover:bg-slate-50 transition-all active:scale-95">Discard</button>
            <button type="submit" className="flex-[2] bg-indigo-600 text-white rounded-2xl py-3.5 text-[10px] font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 uppercase italic hover:bg-indigo-700 transition-all active:scale-[0.98]">
              <Save size={14} strokeWidth={3} /> Save Production Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduction;