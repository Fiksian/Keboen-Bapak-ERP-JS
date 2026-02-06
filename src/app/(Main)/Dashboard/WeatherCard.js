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
      <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px] md:min-h-[450px] space-y-4">
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
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-xl hover:shadow-blue-50/30 transition-all duration-500 group h-full">
      
      <div className="flex flex-col items-center mb-4 md:mb-6">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full mb-2">
          <MapPin size={10} className="text-blue-600" />
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-blue-600">Bandung Station</span>
        </div>
        <p className="text-gray-400 text-[9px] md:text-[10px] font-bold uppercase tracking-tighter italic">
          {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8 transition-transform duration-500 group-hover:scale-105">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-800 tracking-tighter tabular-nums italic">
          {Math.round(current.temperature_2m)}°
        </h1>
        <div className="p-4 md:p-5 bg-gray-50 rounded-[24px] md:rounded-[32px] group-hover:bg-yellow-50 transition-colors duration-500 shadow-inner">
          <div className="scale-75 md:scale-100">
            {getWeatherIcon(current.weather_code)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 md:gap-4 text-[8px] md:text-[9px] font-black text-gray-400 uppercase mb-8 md:mb-10 tracking-[0.1em]">
        <span className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-2 bg-slate-50 rounded-xl italic border border-transparent hover:border-blue-100 transition-colors">
          <Wind size={12} className="text-blue-500" /> {current.wind_speed_10m} <span className="hidden xs:inline">KM/H</span>
        </span>
        <span className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-2 bg-slate-50 rounded-xl italic border border-transparent hover:border-cyan-100 transition-colors">
          <Droplets size={12} className="text-cyan-500" /> {current.relative_humidity_2m}%
        </span>
      </div>

      <div className="w-full space-y-1 md:space-y-2 mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-3 md:mb-4 border-b border-gray-50 pb-2">
          <Clock size={12} className="text-blue-600" />
          <span className="text-[9px] md:text-[10px] font-black text-gray-800 uppercase italic tracking-widest">Upcoming Forecast</span>
        </div>
        
        <div className="grid grid-cols-1 gap-1">
          {nextHours.map((item, idx) => (
            <div 
              key={idx} 
              className="flex justify-between items-center py-2.5 px-3 md:py-3 md:px-4 border-b border-gray-50 last:border-0 hover:bg-blue-50/30 hover:rounded-xl transition-all group/item cursor-default"
            >
              <span className="text-[10px] md:text-[11px] font-black text-gray-400 group-hover/item:text-blue-600 transition-colors">
                {item.timeLabel}
              </span>
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-xs md:text-sm font-black text-gray-700 italic tabular-nums">
                  {item.temp}°C
                </span>
                <div className="scale-75 group-hover/item:scale-90 transition-all opacity-60 group-hover/item:opacity-100">
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
          className="text-[7px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-blue-400 transition-colors italic"
        >
          Data Provided by Open-Meteo
        </a>
      </div>
    </div>
  );
};

export default WeatherCard;