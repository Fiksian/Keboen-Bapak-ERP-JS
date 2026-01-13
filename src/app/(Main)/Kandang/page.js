'use client'

import { ChevronDown, Droplet, Leaf, RefreshCcw, Warehouse, Wind, Droplets, Thermometer} from 'lucide-react'
import  {useState} from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';


const Plants = () => {

  const [pumpStatus, setPumpStatus] = useState(true);

  // Data dummy untuk chart (Riwayat Analitik)
  const chartData = [
    { time: '08:00', tds: 820, ph: 6.2 },
    { time: '08:30', tds: 840, ph: 6.3 },
    { time: '09:00', tds: 870, ph: 6.4 },
    { time: '09:30', tds: 860, ph: 6.4 },
    { time: '10:00', tds: 855, ph: 6.3 },
  ];

  const statusCards = [
    { title: 'Suhu Udara', value: '25', unit: '°C', icon: <Thermometer size={20} />, status: 'IDEAL', status_color: 'text-green-500', color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Kualitas Udara (Amonia)', value: '5', unit: 'ppm', icon: <Wind size={20} />, status: 'NORMAL', status_color: 'text-blue-500', color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Kualitas Air(pH)', value: '6,8', unit: '', icon: <Droplet size={20} />, status: 'OPTIMAL', status_color: 'text-purple-500', color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Makanan dan Air', value: '80', unit: '%', icon: <Leaf size={20} />, status: 'CUKUP', status_color: 'text-orange-500', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];
  
  return (
    <div className='p-4 md:p-6 bg-gray-50 min-h-full space-y-6'>
      
    <span className='text-gray-800 font-bold p-2 mb-4'>Status Kandang</span>

      <div className='bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4'>
        <div className='space-y-1 w-full md:w-auto'>
          <label className='text-gray-600 font-semibold text-[10px] uppercase'>Pilih Kandang</label>
          <div className='flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all'>
            <div className='p-2 bg-blue-100 text-blue-600 rounded-lg'>
              <Warehouse size={18}/>
            </div>
            <span className='font-bold text-gray-700'>Kandang A</span>
            <ChevronDown size={18} className='text-gray-400 ml-auto md:ml-4' />
          </div>
        </div>

        <div className='flex items-center gap-6 self-end md:self-center '>
          <div className='text-right'>
            <p className='text-[14px] font-bold text-gray-400'>Status Sistem : <span className='text-green-500 uppercase tracking-tighter'>Online</span></p>
            <p className='text-[12px] text-gray-300'>Last sync: 2 menit yang lalu</p>
          </div>
          <button className='p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-gray-100'>
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      {/* Sensor Card */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statusCards.map((card,idx) => (
          <div key={idx} className='bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4'>
            <div className='flex justify-between items-start'>
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-md border border-current opacity-70 ${card.status_color}`}>
                {card.status}
              </span>
            </div>
            <div>
              <p className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter'>{card.title}</p>
              <h3 className='text-3xl font-black text-gray-800'>
                {card.value} <span className='text-sm font-medium text-gray-400'>{card.unit}</span>
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Analytic Card Section */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

        {/* Chart Container */}
        <div className='lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100'>
          <div className='flex justify-between items-center mb-8'>
            <h3 className='font-bold text-gray-700'>Riwayat Analitik</h3>
            <div className='flex gap-4 text-[10px] font-bold uppercase tracking-widest'>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> TDS</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> PH</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Line
                  type="monotone" 
                  dataKey="tds" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="ph" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controls Section */}
        <div className='space-y-6'>
          {/* Toggle Switch */}
          <div className="p-8 bg-white rounded-[32px] shadow-sm border border-gray-100 space-y-6">
            <h3 className='font-bold text-gray-700 flex items-center gap-2'>
               <RefreshCcw size={18} className='text-blue-500' /> Kendali Unit
            </h3>
            <div className="p-5 border border-gray-50 rounded-3xl bg-gray-50/30 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">Pompa Utama</span>
              <button 
                onClick={() => setPumpStatus(!pumpStatus)}
                className={`w-12 h-6 rounded-full transition-all relative ${pumpStatus ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${pumpStatus ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            {/* Dosing Action Card */}
            <div className="border-2 border-dashed border-blue-100 rounded-3xl p-1">
               <div className="bg-blue-50/30 rounded-[22px] p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pemberian Nutrisi</span>
                    <Droplets size={16} className="text-blue-400" />
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Plants;