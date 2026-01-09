import { ChevronDown, Droplet, RefreshCcw, Warehouse } from 'lucide-react'
import React from 'react'

const Plants = () => {
  return (
    <div className='p-4 md:p-6 bg-gray-50 min-h-full space-y-6 '>
      
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
      {/* <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <SensorCard icon={<Activity />} label="pH Level" value="6.4" status="IDEAL" color="green" />
        <SensorCard icon={<Droplets />} label="TDS (Nutrisi)" value="870 ppm" status="NORMAL" color="blue" />
        <SensorCard icon={<Thermometer />} label="Suhu Air" value="25.4°C" status="OPTIMAL" color="orange" />
        <SensorCard icon={<Sun />} label="Intensitas Cahaya" value="12.000 Lux" status="CUKUP" color="yellow" />
      </div> */}

      {/* Analytic Card */}
      <div className='grid grid-cols-1 lg:gridcols-3 gap-6'>

        {/* Chart */}
        <div className='lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100'>
          
        </div>
      </div>

    </div>
  )
}

export default Plants