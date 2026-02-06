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
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen text-left">
      <AddTask 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }} 
        onSuccess={fetchTasks}
        editData={taskToEdit}
      />

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 p-5 md:p-8 max-w-5xl mx-auto transition-all">        
        <div className='pb-6 flex justify-between items-center mb-6 md:mb-10 border-b border-gray-100'>
          <div className="text-left">
            <h2 className='text-xl md:text-2xl font-black text-gray-800 tracking-tight italic uppercase leading-none'>Operational Tasks</h2>
            <p className='text-gray-400 text-[9px] md:text-[10px] font-black mt-2 uppercase flex items-center gap-2 tracking-[2px]'>
              <Calendar size={14} className="text-blue-500" />
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>    

        {loading ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[3px]">Syncing Tasks...</p>
          </div>
        ) : (
          <div className='space-y-3 md:space-y-4'>
            {taskList.length > 0 ? taskList.map((task)=> (
              <div key={task.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all group ${task.completed ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'}`}>
                
                <div className='flex items-start md:items-center gap-4 md:gap-6 text-left'>
                  <div className='mt-1 md:mt-0 cursor-pointer transition-transform active:scale-90 shrink-0' onClick={() => toggleTask(task.id, task.completed)}>
                    {task.completed ? (
                      <CheckCircle2 className='text-green-500 w-6 h-6 md:w-7 md:h-7' />
                    ) : (
                      <Circle className='text-gray-300 w-6 h-6 md:w-7 md:h-7' />
                    )}
                  </div>

                  <div className='space-y-1 md:space-y-2'>
                    <h3 className={`font-bold text-sm md:text-lg leading-tight ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {task.title}
                    </h3>
                    <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                      <span className='flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-gray-400'>
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> {task.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className='flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100'>
                        <Tag className="w-2.5 h-2.5 md:w-3 md:h-3" /> {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between sm:justify-end gap-4 md:gap-6 mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-gray-50'>
                  <div className='flex items-center gap-2 text-left'>
                    <div className='w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center shrink-0'>
                      <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                    <div className='flex flex-col'>
                      <span className='text-[8px] text-gray-400 font-black uppercase leading-none'>PIC</span>
                      <span className='text-[10px] md:text-[11px] font-bold text-gray-600 uppercase'>{task.assignee}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 md:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl transition-all cursor-pointer active:bg-blue-100">
                      <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg md:rounded-xl transition-all cursor-pointer active:bg-red-100">
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">No upcoming tasks found</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 md:mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2 w-full sm:w-auto text-left">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Task Progress: {taskList.filter(t => t.completed).length}/{taskList.length} Done
            </span>
            <div className="w-full sm:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${taskList.length > 0 ? (taskList.filter(t => t.completed).length / taskList.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <p className="text-[9px] font-bold text-gray-300 italic uppercase">System Verified • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTasks;