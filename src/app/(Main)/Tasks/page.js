'use client'

import {useState} from 'react';
import { Plus, Clock, Tag, User, CheckCircle2, Circle, Calendar } from 'lucide-react';
import AddTask from './AddTasks';


const UpcomingTasks = () => {
  
  const [taskList, setTaskList] = useState([
    {
      id: 1,
      title: "Pemberian Vaksin AB Mix",
      time: "09:00 AM",
      priority: "HIGH",
      category: "Vaksin",
      assignee: "Budi",
      completed: false
    },
    {
      id: 2,
      title: "Cek pH Meter & Kalibrasi Sensor",
      time: "11:30 AM",
      priority: "MEDIUM",
      category: "Maintenance",
      assignee: "Ani",
      completed: true
    },
    {
      id: 3,
      title: "Pembersihan Alga di Tangki Utama",
      time: "02:00 PM",
      priority: "LOW",
      category: "Cleaning",
      assignee: "Budi",
      completed: false
    },
    {
      id: 4,
      title: "Cek Kandang A",
      time: "04:00 PM",
      priority: "HIGH",
      category: "Maintenance",
      assignee: "Siti",
      completed: false
    }
  ]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-red-500 bg-red-50';
      case 'MEDIUM': return 'text-orange-500 bg-orange-50';
      case 'LOW': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const toggleTask = (id) => {
    setTaskList(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? {...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = taskList.filter(t => t.completed).length;
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addTask = (newValues) => {
    setTaskList(prev => [newValues, ...prev]);
  };


  
  return (
    <div className="p-6 bg-gray-50 min-h-full">

      <AddTask 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      onAddTask={addTask} 
    />

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 max-w-full mx-auto">        
        {/* Header Section */}
        <div className='pb-3 flex justify-between items-start mb-10 border-b border-gray-100'>
          <div>
            <h2 className='text-2xl font-bold text-gray-800 tracking-tight'>Upcoming Tasks</h2>
            <p className='text-gray-400 text-sm font-medium mt-1 uppercase flex items-center gap-2'>
              <Calendar size={16} />
              HARI INI, 6 JAN 2006
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 duration-75 cursor-pointer">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>    

        {/* Task List */}
        <div className='space-y-4'>
          {taskList.map((task)=> (
            <div 
              key={task.id}
              className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                task.completed ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5'
              }`}
            >
              <div className='flex items-center gap-6'>
                {/* Status Checkbox */}
                <div className='cursor-pointer transition-transform active:scale-90' onClick={() => toggleTask(task.id)}>
                  {task.completed ? (
                    <CheckCircle2 className='text-green-500' size={28} />
                  ) : (
                    <Circle className='text-gray-300' size={28} />
                  )}
                </div>

                {/* Task Info */}
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
                      <Tag size={12} className='fill-blue-500' /> {task.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignee Avatar */}
              <div className='flex flex-col items-center gap-1'>
                <div className='w-10 h-10 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden'>
                  <User size={20} className='text-gray-400' />
                </div>
                <span className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter'>{task.assignee}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-12 pt-6 border-t border-gray-50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Selesai: {completedCount}/{taskList.length}
          </span>
          <button className="text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer">
            Lihat Semua Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTasks;