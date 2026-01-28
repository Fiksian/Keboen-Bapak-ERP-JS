'use client'

import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Sun, Wind, Droplets, Eye, 
  CloudLightning, Navigation, Thermometer, Leaf, Cloud, Loader2,
  Calendar, Clock, MapPin
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useWeather } from '@/context/WeatherContext'; // Pastikan path ini sesuai struktur folder Anda

const Cuaca = () => {
  // Mengambil data terpusat dari Context
  const { weather, loading } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Timer untuk jam digital tetap berjalan lokal agar akurat per detik
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

  // State loading dari Context
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400">
      <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
      <p className="font-black uppercase tracking-widest text-[10px]">Sinkronisasi Data Satelit...</p>
    </div>
  );

  if (!weather?.hourly || !weather?.daily) return null;

  // Logika pengolahan data untuk Chart
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
  const daily = weather.daily;
  const currentDetails = getWeatherDetails(current.weather_code, current.is_day);

  // Dynamic Theme based on Temperature & Day Cycle
  const isHot = current.temperature_2m > 30;
  const heroGradient = current.is_day 
    ? (isHot ? "from-orange-500 via-red-500 to-orange-600" : currentDetails.color)
    : "from-slate-800 via-indigo-950 to-black";

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-6 animate-in fade-in duration-700 text-gray-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
            <Navigation size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Weather Analytics</h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest italic">
              <MapPin size={10} /> Bandung, West Java • Context Integrated
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Current Time</p>
                <p className="text-sm font-black text-gray-800 tabular-nums">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
            </div>
            <Clock className="text-blue-600" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hero Card */}
          <div className={`relative bg-gradient-to-br ${heroGradient} rounded-[40px] p-10 text-white overflow-hidden shadow-2xl transition-all duration-1000`}>
            <div className="absolute top-[-30px] right-[-30px] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4">
                <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full w-fit text-[10px] font-black uppercase tracking-[2px] border border-white/20">
                  {current.is_day ? '☀️ Day Cycle' : '🌙 Night Cycle'}
                </div>
                <div className="flex items-baseline gap-2">
                    <h1 className="text-8xl font-black tracking-tighter drop-shadow-md tabular-nums">
                        {Math.round(current.temperature_2m)}°
                    </h1>
                    <span className="text-2xl font-black opacity-50 uppercase italic">Celsius</span>
                </div>
                <div className="text-2xl font-bold opacity-95 flex items-center gap-3 uppercase italic tracking-tight">
                   {currentDetails.label} <span className="w-1.5 h-1.5 bg-white rounded-full"></span> {current.relative_humidity_2m}% Humidity
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[32px] border border-white/20 shadow-inner group transition-transform hover:scale-110">
                {React.cloneElement(currentDetails.icon, { 
                  size: 100, 
                  className: `drop-shadow-2xl ${current.is_day ? 'text-yellow-300 fill-yellow-300' : 'text-blue-200 fill-blue-100'}` 
                })}
              </div>
            </div>
          </div>

          {/* Grafik Fluktuasi */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Thermometer size={16} className="text-blue-600" /> Temperature Trend (24H)
                </h3>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} interval={3} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#cbd5e1'}} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Kolom Kanan */}
        <div className="space-y-6">
          {/* 7-Day Forecast */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-6">
                 <Calendar size={16} className="text-blue-600" /> Weekly Forecast
            </h3>
            <div className="space-y-1">
              {daily.time.map((date, idx) => {
                const dayDetails = getWeatherDetails(daily.weather_code[idx]);
                return (
                  <div key={idx} className="flex items-center justify-between py-3 px-4 hover:bg-blue-50/50 rounded-2xl transition-all group border border-transparent hover:border-blue-50">
                    <div className="w-20 text-[11px] font-black text-gray-800 uppercase">
                      {idx === 0 ? "Hari Ini" : new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                    </div>
                    <div className="flex items-center gap-3 flex-1 px-4">
                      {React.cloneElement(dayDetails.icon, { size: 16, className: "group-hover:scale-125 transition-transform" })}
                      <span className="text-[9px] font-black text-gray-400 uppercase truncate">{dayDetails.label}</span>
                    </div>
                    <div className="text-[11px] font-black text-gray-800 tabular-nums">
                      {Math.round(daily.temperature_2m_max[idx])}° <span className="text-gray-300 mx-1">|</span> <span className="text-gray-400">{Math.round(daily.temperature_2m_min[idx])}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">Environment Metrics</h3>
            <div className="space-y-5">
              <ConditionItem icon={<Wind size={18} />} label="Wind Speed" value={`${current.wind_speed_10m} km/h`} color="text-blue-400" />
              <ConditionItem icon={<Droplets size={18} />} label="Humidity" value={`${current.relative_humidity_2m}%`} color="text-cyan-500" />
              <ConditionItem icon={<Eye size={18} />} label="Visibility" value={`${(current.visibility / 1000).toFixed(0)} km`} color="text-emerald-500" />
              <ConditionItem icon={<Thermometer size={18} />} label="Feels Like" value={`${Math.round(current.apparent_temperature)}°C`} color="text-orange-400" />
            </div>
          </div>

          <div className="bg-[#99A675] rounded-[32px] p-8 text-white shadow-xl shadow-green-100/50 relative overflow-hidden group">
             <Leaf className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-black/10 -rotate-12 group-hover:rotate-12 transition-transform duration-700" />
             <div className="relative z-10 text-[13px] font-bold leading-relaxed italic opacity-95">
                {current.temperature_2m > 28 
                    ? "🌡️ Suhu terdeteksi tinggi. Aktifkan sistem misting dan pastikan sirkulasi udara maksimal di dalam greenhouse." 
                    : "✅ Parameter lingkungan ideal. Tetap pantau grafik kelembaban untuk mencegah jamur pada tanaman."}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConditionItem = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-4">
      <div className={`p-2 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-gray-800">{value}</span>
  </div>
);

export default Cuaca;