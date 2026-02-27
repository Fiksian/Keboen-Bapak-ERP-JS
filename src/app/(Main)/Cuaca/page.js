'use client'

import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Clock, Leaf, Loader2, Sun, Cloud, CloudRain, CloudLightning } from 'lucide-react';
import { useWeather } from '@/context/WeatherContext';
import WeatherHero from './WeatherHero';
import WeatherChart from './WeatherChart';
import WeatherForecast from './WeatherForecast';
import EnvironmentMetrics from './EnvironmentMetrics';

const Cuaca = () => {
  const { weather, loading } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherDetails = (code, isDay = 1) => {
    if (code === 0) return { label: "Cerah", icon: <Sun className="text-yellow-400" />, color: "from-blue-400 to-blue-600" };
    if (code <= 3) return { label: "Berawan", icon: <Cloud className="text-gray-400" />, color: "from-slate-400 to-slate-600" };
    if (code <= 48) return { label: "Kabut", icon: <Cloud className="text-gray-200" />, color: "from-gray-300 to-gray-500" };
    if (code <= 67) return { label: "Hujan Gerimis", icon: <CloudRain className="text-blue-300" />, color: "from-blue-500 to-indigo-700" };
    if (code <= 82) return { label: "Hujan Deras", icon: <CloudRain className="text-blue-500" />, color: "from-indigo-600 to-blue-900" };
    if (code <= 99) return { label: "Badai Petir", icon: <CloudLightning className="text-purple-400" />, color: "from-purple-700 to-slate-900" };
    return { label: "Cerah", icon: <Sun className="text-yellow-400" />, color: "from-blue-500 to-blue-700" };
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400">
      <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
      <p className="font-black uppercase tracking-widest text-[10px]">Sinkronisasi Data Satelit...</p>
    </div>
  );

  if (!weather?.hourly || !weather?.daily) return null;

  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  const chartData = weather.hourly.time
    .map((time, index) => ({
      rawTime: new Date(time),
      timeLabel: new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      temp: weather.hourly.temperature_2m[index],
    }))
    .filter(item => item.rawTime >= currentHour)
    .slice(0, 24);

  const current = weather.current;
  const currentDetails = getWeatherDetails(current.weather_code, current.is_day);
  const isHot = current.temperature_2m > 30;
  const heroGradient = current.is_day 
    ? (isHot ? "from-orange-500 via-red-500 to-orange-600" : currentDetails.color)
    : "from-slate-800 via-indigo-950 to-black";

  return (
    <div className="p-4 md:p-6 bg-[#f8f9fa] min-h-full space-y-6 animate-in fade-in duration-700 text-gray-800">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
            <Navigation size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tight text-nowrap">Weather Analytics</h2>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest italic">
              <MapPin size={10} /> Bandung, West Java
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto bg-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between sm:justify-end gap-4">
            <div className="text-left sm:text-right">
                <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-0.5">Current Time</p>
                <p className="text-xs md:text-sm font-black text-gray-800 tabular-nums">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
            </div>
            <Clock className="text-blue-600" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeatherHero current={current} currentDetails={currentDetails} heroGradient={heroGradient} />
          <WeatherChart data={chartData} />
        </div>

        <div className="space-y-6">
          <WeatherForecast daily={weather.daily} getWeatherDetails={getWeatherDetails} />
          <EnvironmentMetrics current={current} />
          <div className="w-full text-center pb-4">
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-400 transition-colors italic">
              Data Provided by Open-Meteo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cuaca;