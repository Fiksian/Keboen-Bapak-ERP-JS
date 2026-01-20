import React from 'react';
import { Sun } from 'lucide-react';

const WeatherCard = () => {
  const hourlyData = [
    { time: '08.00', temp: '25°C' },
    { time: '09.00', temp: '26°C' },
    { time: '10.00', temp: '27°C' },
    { time: '11.00', temp: '28°C' },
  ];

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center">
      <h3 className="text-xl font-bold text-gray-700 border-b-2 border-blue-600 pb-1 mb-2">
        Cuaca Harian
      </h3>
      <p className="text-gray-400 text-xs mb-6">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      
      <div className="flex items-center gap-6 mb-8">
        <h1 className="text-6xl font-black text-gray-800 tracking-tighter">25° C</h1>
        <div className="p-4 bg-yellow-50 rounded-3xl">
          <Sun size={48} className="text-yellow-400 fill-yellow-400" />
        </div>
      </div>

      <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase mb-8">
        <span className="flex items-center gap-1 italic">🍃 Angin 2 KM/H</span>
        <span className="flex items-center gap-1 italic">💧 Kelembaban 25%</span>
      </div>

      <div className="w-full space-y-4">
        {hourlyData.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-2 border-t border-gray-50">
            <span className="text-sm font-medium text-gray-400">{item.time}</span>
            <span className="text-sm font-bold text-gray-700">{item.temp}</span>
            <Sun size={14} className="text-yellow-400" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;