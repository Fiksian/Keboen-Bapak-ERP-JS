'use client';

import React from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, 
  Wind, Droplets, MapPin, Loader2, Clock 
} from 'lucide-react';
import { useWeather } from '@/context/WeatherContext'; // Import context

const WeatherCard = () => {
  // Mengambil data langsung dari Central Context
  const { weather: weatherData, loading } = useWeather();

  // Skeleton Loader saat data sedang sinkronisasi
  if (loading || !weatherData) {
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing Satellite...</p>
      </div>
    );
  }

  const { current, hourly } = weatherData;

  // Helper untuk Icon Dinamis
  const getWeatherIcon = (code, size = 48) => {
    if (code === 0) return <Sun size={size} className="text-yellow-400 fill-yellow-400" />;
    if (code <= 3) return <Cloud size={size} className="text-gray-400 fill-gray-50" />;
    if (code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code <= 99) return <CloudLightning size={size} className="text-purple-500" />;
    return <Sun size={size} className="text-yellow-400" />;
  };

  const now = new Date();
  
  // Filter 4 jam ke depan dari data hourly context
  const nextHours = hourly.time
    .map((time, index) => ({
      rawTime: new Date(time),
      timeLabel: new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly.temperature_2m[index]),
    }))
    .filter(item => item.rawTime > now)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 group h-full">
      
      {/* Location Badge */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full mb-2">
          <MapPin size={10} className="text-blue-600" />
          <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Bandung Station</span>
        </div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter italic">
          {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      
      {/* Temperature Display */}
      <div className="flex items-center gap-6 mb-8 transition-transform duration-500 group-hover:scale-110">
        <h1 className="text-7xl font-black text-gray-800 tracking-tighter tabular-nums italic">
          {Math.round(current.temperature_2m)}°
        </h1>
        <div className="p-5 bg-gray-50 rounded-[32px] group-hover:bg-yellow-50 transition-colors duration-500 shadow-inner">
          {getWeatherIcon(current.weather_code)}
        </div>
      </div>

      {/* Metrics Section */}
      <div className="flex gap-4 text-[9px] font-black text-gray-400 uppercase mb-10 tracking-[0.1em]">
        <span className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl italic border border-transparent hover:border-blue-100 transition-colors">
          <Wind size={14} className="text-blue-500" /> {current.wind_speed_10m} KM/H
        </span>
        <span className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl italic border border-transparent hover:border-cyan-100 transition-colors">
          <Droplets size={14} className="text-cyan-500" /> {current.relative_humidity_2m}%
        </span>
      </div>

      {/* Hourly Forecast List */}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
          <Clock size={12} className="text-blue-600" />
          <span className="text-[10px] font-black text-gray-800 uppercase italic tracking-widest">Upcoming Forecast</span>
        </div>
        
        {nextHours.map((item, idx) => (
          <div 
            key={idx} 
            className="flex justify-between items-center py-3 px-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 hover:rounded-2xl transition-all group/item cursor-default"
          >
            <span className="text-[11px] font-black text-gray-400 group-hover/item:text-blue-600 transition-colors">
              {item.timeLabel}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-black text-gray-700 italic tabular-nums">
                {item.temp}°C
              </span>
              <div className="opacity-40 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100">
                {getWeatherIcon(0, 16)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;