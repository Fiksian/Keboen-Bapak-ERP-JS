'use client'

import { useState, useEffect } from 'react';
import { 
  Plus, Clock, Tag, User, CheckCircle2, Circle, 
  Calendar, Trash2, Edit3, Loader2 
} from 'lucide-react';
import AddTask from './AddTasks';

const UpcomingTasks = () => {
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTaskList(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id, currentStatus) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("Hapus tugas ini?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTasks();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-500 bg-red-50';
      case 'MEDIUM': return 'text-orange-500 bg-orange-50';
      case 'LOW': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <AddTask 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }} 
        onSuccess={fetchTasks}
        editData={taskToEdit}
      />

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 max-w-full mx-auto">        
        <div className='pb-3 flex justify-between items-start mb-10 border-b border-gray-100'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800 tracking-tight italic uppercase'>Operational Tasks</h2>
            <p className='text-gray-400 text-[10px] font-black mt-1 uppercase flex items-center gap-2 tracking-widest'>
              <Calendar size={14} />
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>    

        {loading ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[3px]">Syncing Tasks...</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {taskList.map((task)=> (
              <div key={task.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all group ${task.completed ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'}`}>
                <div className='flex items-center gap-6'>
                  <div className='cursor-pointer transition-transform active:scale-90' onClick={() => toggleTask(task.id, task.completed)}>
                    {task.completed ? <CheckCircle2 className='text-green-500' size={28} /> : <Circle className='text-gray-300' size={28} />}
                  </div>

                  <div className='space-y-2'>
                    <h3 className={`font-bold text-lg ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.title}</h3>
                    <div className='flex flex-wrap items-center gap-3'>
                      <span className='flex items-center gap-1.5 text-xs font-semibold text-gray-400'>
                        <Clock size={14} /> {task.time}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className='flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100'>
                        <Tag size={12} /> {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-6'>
                  <div className='flex flex-col items-center gap-1'>
                    <div className='w-10 h-10 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center'>
                      <User size={20} className='text-gray-400' />
                    </div>
                    <span className='text-[10px] font-bold text-gray-400 uppercase'>{task.assignee}</span>
                  </div>
                  
                  {/* Control Buttons (Muncul saat hover) */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-50 flex justify-between items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Progress: {taskList.filter(t => t.completed).length}/{taskList.length} Tasks Done
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTasks;