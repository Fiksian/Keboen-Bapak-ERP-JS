'use client'

import React from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, 
  Wind, Droplets, MapPin, Loader2, Clock 
} from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';

const WeatherCard = () => {
  const { weather: weatherData, loading } = useWeather();

  if (loading || !weatherData) {
    return (
      <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[350px] lg:h-full space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Syncing Satellite...</p>
      </div>
    );
  }

  const { current, hourly } = weatherData;

  const getWeatherIcon = (code, size = 48) => {
    const iconSize = size; 
    if (code === 0) return <Sun size={iconSize} className="text-yellow-400 fill-yellow-400" />;
    if (code <= 3) return <Cloud size={iconSize} className="text-gray-400 fill-gray-50" />;
    if (code <= 67) return <CloudRain size={iconSize} className="text-blue-400" />;
    if (code <= 99) return <CloudLightning size={iconSize} className="text-purple-500" />;
    return <Sun size={iconSize} className="text-yellow-400" />;
  };

  const now = new Date();
  
  const nextHours = hourly.time
    .map((time, index) => ({
      rawTime: new Date(time),
      timeLabel: new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly.temperature_2m[index]),
      code: hourly.weather_code ? hourly.weather_code[index] : 0
    }))
    .filter(item => item.rawTime > now)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-xl hover:shadow-blue-50/30 transition-all duration-500 group h-full w-full">
      
      <div className="flex flex-col items-center w-full mb-4 lg:mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full mb-2">
          <MapPin size={10} className="text-blue-600" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-600">Bandung Station</span>
        </div>
        <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter italic text-center">
          {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 mb-6 lg:mb-8 transition-transform duration-500 group-hover:scale-105 w-full">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-800 tracking-tighter tabular-nums italic">
          {Math.round(current.temperature_2m)}°
        </h1>
        <div className="p-3 sm:p-4 lg:p-5 bg-gray-50 rounded-[20px] sm:rounded-[24px] lg:rounded-[32px] group-hover:bg-yellow-50 transition-colors duration-500 shadow-inner">
          <div className="scale-75 sm:scale-90 lg:scale-100">
            {getWeatherIcon(current.weather_code)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 text-[8px] sm:text-[9px] font-black text-gray-400 uppercase mb-6 lg:mb-10 tracking-[0.1em] w-full sm:w-auto">
        <span className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 rounded-xl italic border border-transparent hover:border-blue-100 transition-colors">
          <Wind size={12} className="text-blue-500" /> 
          <span className="truncate">{current.wind_speed_10m} KM/H</span>
        </span>
        <span className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 rounded-xl italic border border-transparent hover:border-cyan-100 transition-colors">
          <Droplets size={12} className="text-cyan-500" /> 
          <span className="truncate">{current.relative_humidity_2m}% HUM</span>
        </span>
      </div>

      <div className="w-full space-y-2 mb-4 lg:mb-8 flex-1">
        <div className="flex items-center gap-2 mb-2 lg:mb-4 border-b border-gray-50 pb-2">
          <Clock size={12} className="text-blue-600" />
          <span className="text-[9px] sm:text-[10px] font-black text-gray-800 uppercase italic tracking-widest">Upcoming Forecast</span>
        </div>
        
        <div className="flex flex-col gap-1 overflow-hidden">
          {nextHours.map((item, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center py-2 px-3 sm:py-3 sm:px-4 border-b border-gray-100 last:border-0 hover:bg-blue-50/40 hover:rounded-xl transition-all group/item cursor-default"
            >
              <span className="text-[10px] sm:text-[11px] font-black text-gray-600 group-hover/item:text-blue-600 transition-colors">
                {item.timeLabel}
              </span>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[11px] sm:text-sm font-black text-gray-700 italic tabular-nums">
                  {item.temp}°C
                </span>
                <div className="scale-90 group-hover/item:scale-110 transition-all opacity-60 group-hover/item:opacity-100">
                  {getWeatherIcon(item.code, 16)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50 w-full text-center">
        <a 
          href="https://open-meteo.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[7px] sm:text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-blue-400 transition-colors italic block"
        >
          Data Provided by Open-Meteo
        </a>
      </div>
    </div>
  );
};

export default WeatherCard;