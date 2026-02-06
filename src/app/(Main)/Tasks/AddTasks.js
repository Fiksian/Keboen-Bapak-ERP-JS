'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, User, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

const AddTask = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    priority: "MEDIUM",
    category: "Maintenance",
    assignee: ""
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title,
        time: editData.time,
        priority: editData.priority,
        category: editData.category,
        assignee: editData.assignee
      });
    } else {
      setFormData({ title: "", time: "", priority: "MEDIUM", category: "Maintenance", assignee: "" });
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editData ? `/api/tasks/${editData.id}` : '/api/tasks';
    const method = editData ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl border-t sm:border border-gray-100 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] flex flex-col">
        
        <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 text-gray-800 shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-black tracking-tight uppercase italic">{editData ? 'Edit Task' : 'Add New Task'}</h2>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Detail tugas operasional</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-gray-100 shadow-sm active:scale-90"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 text-gray-800 overflow-y-auto overflow-x-hidden">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Task Title</label>
            <div className="relative">
              <input
                required
                placeholder="Masukkan judul tugas..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 md:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 hidden sm:block" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Schedule</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="time"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority Level</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 md:py-4 text-sm font-bold outline-none cursor-pointer appearance-none focus:border-blue-500 focus:bg-white"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="HIGH">🔴 HIGH</option>
                  <option value="MEDIUM">🟠 MEDIUM</option>
                  <option value="LOW">🔵 LOW</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-10 py-3.5 md:py-4 text-sm font-bold outline-none cursor-pointer appearance-none focus:border-blue-500 focus:bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Nutrisi">Nutrisi</option>
                  <option value="Vaksin">Vaksin</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Cleaning">Cleaning</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assignee PIC</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  placeholder="Nama petugas..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white"
                  value={formData.assignee}
                  onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="w-full sm:flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {editData ? 'Update Task' : 'Create Task'}
              <AlertCircle size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTask;