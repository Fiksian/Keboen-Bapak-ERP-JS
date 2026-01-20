'use client'

import React, { useState, useEffect } from 'react';
import { 
  CloudRain, Sun, Wind, Droplets, Eye, 
  CloudLightning, Navigation, MoreHorizontal,
  ChevronRight, Thermometer, Leaf, Cloud, Loader2,
  TrendingUp, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

const Cuaca = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const LAT = -6.9175;
  const LON = 107.6191;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Mengambil data Current, Hourly (untuk Grafik), dan Daily (untuk 7 Hari)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        
        if (!response.ok) throw new Error("Gagal mengambil data cuaca");
        
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherDetails = (code) => {
    if (code === 0) return { label: "Cerah", icon: <Sun className="text-yellow-400" /> };
    if (code <= 3) return { label: "Berawan", icon: <Cloud className="text-gray-400" /> };
    if (code <= 48) return { label: "Kabut", icon: <Cloud className="text-gray-300" /> };
    if (code <= 67) return { label: "Hujan Ringan", icon: <CloudRain className="text-blue-400" /> };
    if (code <= 99) return { label: "Badai Petir", icon: <CloudLightning className="text-purple-500" /> };
    return { label: "Cerah", icon: <Sun className="text-yellow-400" /> };
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400">
      <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
      <p className="font-black uppercase tracking-widest text-[10px]">Menganalisis Data Satelit...</p>
    </div>
  );

  if (error) return <div className="p-10 text-red-500 font-bold">Error: {error}</div>;
  if (!weather || !weather.hourly || !weather.daily) return null;

  // Data Grafik (24 Jam)
  const chartData = weather.hourly.time.slice(0, 24).map((time, index) => ({
    time: new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    temp: weather.hourly.temperature_2m[index],
  }));

  const current = weather.current;
  const daily = weather.daily;
  const currentDetails = getWeatherDetails(current.weather_code);

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-6 animate-in fade-in duration-700 text-gray-800">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
            <Navigation size={18} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">Weather Analytics</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Bandung, West Java • Real-time Sync</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Main Card & Grafik */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hero Card */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[40px] p-10 text-white overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-[-30px] right-[-30px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4">
                <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full w-fit text-[10px] font-black uppercase tracking-[2px] border border-white/20">
                  Station Active
                </div>
                <h1 className="text-8xl font-black tracking-tighter drop-shadow-md">
                  {Math.round(current.temperature_2m)}°
                </h1>
                <div className="text-2xl font-bold opacity-95 flex items-center gap-3 uppercase italic tracking-tight">
                   {currentDetails.label} <span className="w-1.5 h-1.5 bg-white rounded-full"></span> {current.relative_humidity_2m}% Humidity
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[32px] border border-white/20">
                {React.cloneElement(currentDetails.icon, { size: 100, className: "drop-shadow-2xl text-yellow-300 fill-yellow-300" })}
              </div>
            </div>
          </div>

          {/* Grafik Fluktuasi */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px] flex items-center gap-2 mb-8">
               <TrendingUp size={16} className="text-blue-600" /> Hourly Temperature Trend
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} interval={3} />
                  <YAxis hide={true} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                  <Area type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: 7 Hari & Detail */}
        <div className="space-y-6">
          
          {/* Prediksi 7 Hari */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                 <Calendar size={16} className="text-blue-600" /> 7-Day Forecast
              </h3>
            </div>
            <div className="space-y-2">
              {daily.time.map((date, idx) => {
                const dayDetails = getWeatherDetails(daily.weather_code[idx]);
                return (
                  <div key={idx} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-2xl transition-all group">
                    <div className="w-24 text-[11px] font-black text-gray-800 uppercase">
                      {idx === 0 ? "Hari Ini" : new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-all">
                        {React.cloneElement(dayDetails.icon, { size: 18 })}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[80px]">{dayDetails.label}</span>
                    </div>
                    <div className="text-[11px] font-black text-gray-800 tabular-nums">
                      {Math.round(daily.temperature_2m_max[idx])}° <span className="text-gray-300">/</span> <span className="text-gray-400">{Math.round(daily.temperature_2m_min[idx])}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kondisi Lingkungan */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">Station Details</h3>
            <div className="space-y-5">
              <ConditionItem icon={<Wind size={18} />} label="Wind Speed" value={`${current.wind_speed_10m} km/h`} color="text-blue-400" />
              <ConditionItem icon={<Droplets size={18} />} label="Humidity" value={`${current.relative_humidity_2m}%`} color="text-cyan-500" />
              <ConditionItem icon={<Eye size={18} />} label="Visibility" value={`${(current.visibility / 1000).toFixed(0)} km`} color="text-emerald-500" />
              <ConditionItem icon={<Thermometer size={18} />} label="Apparent" value={`${Math.round(current.apparent_temperature)}°C`} color="text-orange-400" />
            </div>
          </div>

          {/* Rekomendasi */}
          <div className="bg-[#99A675] rounded-[32px] p-8 text-white shadow-xl shadow-green-100/50 relative overflow-hidden">
             <Leaf className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-black/10 -rotate-12" />
             <div className="relative z-10 text-sm font-bold leading-relaxed italic opacity-95">
                {current.temperature_2m > 28 
                    ? "Suhu tinggi. Optimalkan pengabutan (misting) di area greenhouse." 
                    : "Cuaca stabil. Waktu yang tepat untuk pemberian nutrisi terjadwal."}
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