import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const AddTask = ({ isOpen, onClose, onAddTask }) => {
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    priority: "MEDIUM",
    category: "Maintenance",
    assignee: "",
    completed: false
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assignee) return;
    
    onAddTask({ ...formData, id: Date.now() });
    setFormData({ title: "", time: "", priority: "MEDIUM", category: "Maintenance", assignee: "", completed: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Modal */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase italic">Add New Task</h2>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Input detail tugas operasional baru</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm border border-transparent hover:border-gray-100"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Judul Tugas */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Task Title</label>
            <div className="relative">
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Pemberian Nutrisi Tanaman"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
              />
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Waktu */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Time Schedule</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Priority Level</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="HIGH">🔴 HIGH</option>
                <option value="MEDIUM">🟠 MEDIUM</option>
                <option value="LOW">🔵 LOW</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Nutrisi">Nutrisi</option>
                  <option value="Vaksin">Vaksin</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Harvest">Harvest</option>
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1">Assign To</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  required
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  placeholder="Nama Staf"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Create Task
              <AlertCircle size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTask;