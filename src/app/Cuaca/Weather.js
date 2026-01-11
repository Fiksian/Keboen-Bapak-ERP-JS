import React from 'react';
import { 
  CloudRain, Sun, Wind, Droplets, Eye, 
  CloudLightning, Navigation, MoreHorizontal,
  ChevronRight, Thermometer, Leaf
} from 'lucide-react';

const Cuaca = () => {
  const forecast = [
    { day: "Besok", date: "20 DES", status: "Hujan Ringan", icon: <CloudRain className="text-blue-400" />, temp: "26°C / 22°C" },
    { day: "Minggu", date: "21 DES", status: "Cerah Berawan", icon: <Sun className="text-yellow-400" />, temp: "28°C / 23°C" },
    { day: "Senin", date: "22 DES", status: "Badai Petir", icon: <CloudLightning className="text-purple-400" />, temp: "25°C / 21°C" },
    { day: "Selasa", date: "23 DES", status: "Hujan Deras", icon: <CloudRain className="text-blue-600" />, temp: "27°C / 22°C" },
    { day: "Rabu", date: "24 DES", status: "Cerah", icon: <Sun className="text-orange-400" />, temp: "29°C / 24°C" },
  ];

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-blue-600">
          <Navigation size={20} className="fill-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Weather Content</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Main Weather & Forecast */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card (Blue Gradient) */}
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-[32px] p-10 text-white overflow-hidden shadow-lg shadow-blue-200">
            {/* Background Decoration */}
            <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex justify-between items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-90 text-sm font-medium">
                  <Navigation size={14} fill="currentColor" />
                  Bandung, Indonesia
                </div>
                <h1 className="text-7xl font-black tracking-tighter">25°C</h1>
                <div className="text-xl font-semibold opacity-95">
                  Sebagian Berawan • Terasa seperti 27°C
                </div>
                <div className="flex gap-6 pt-4 opacity-80 text-sm font-bold">
                  <span className="flex items-center gap-2"><Wind size={16} /> 10 km/h</span>
                  <span className="flex items-center gap-2"><Thermometer size={16} /> 18:12</span>
                </div>
              </div>

              {/* Sun Icon Illustration */}
              <div className="hidden md:block">
                <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Sun size={80} className="text-yellow-200 fill-yellow-200 drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* 7 Days Forecast */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Ramalan 7 Hari Ke Depan</h3>
              <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                Lihat Semua <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {forecast.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-4 group hover:bg-gray-50 px-4 rounded-2xl transition-all cursor-default">
                  <div className="flex items-center gap-6 w-32">
                    <div className="text-sm">
                      <p className="font-bold text-gray-800">{item.day}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-sm font-bold text-gray-600">{item.status}</span>
                  </div>
                  <div className="text-sm font-black text-gray-800">
                    {item.temp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Conditions & Air Quality */}
        <div className="space-y-6">
          
          {/* Detail Kondisi */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-bold text-gray-800">Detail Kondisi</h3>
            <div className="space-y-6">
              <ConditionItem icon={<Wind size={18} />} label="Angin" value="12 km/h" color="text-blue-400" />
              <ConditionItem icon={<Droplets size={18} />} label="Kelembaban" value="74%" color="text-blue-500" />
              <ConditionItem icon={<Sun size={18} />} label="Indeks UV" value="4 (Sedang)" color="text-orange-400" />
              <ConditionItem icon={<Eye size={18} />} label="Visibilitas" value="10 km" color="text-green-400" />
            </div>
          </div>

          {/* Kualitas Udara */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 text-center space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Kualitas Udara</h3>
              <Leaf size={18} className="text-green-500" />
            </div>
            
            {/* Circular Gauge Placeholder */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" strokeDashoffset="200" className="text-green-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-gray-800">42</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-black text-gray-800 uppercase tracking-wider">Sangat Baik</p>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                Kondisi udara sangat optimal untuk pertumbuhan tanaman hidroponik Anda hari ini.
              </p>
            </div>

            {/* Quality Bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full w-[42%] bg-green-500"></div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                <span>Baik</span>
                <span>Buruk</span>
              </div>
            </div>
          </div>

          {/* Rekomendasi */}
          <div className="bg-[#99A675] rounded-[32px] p-8 text-white">
            <h4 className="font-black text-[10px] uppercase tracking-[2px] mb-3">Rekomendasi</h4>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Cuaca cerah diprediksi sepanjang hari. Pastikan nutrisi tercukupi dan kontrol suhu air tetap di batas optimal.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

// Sub-component for Details
const ConditionItem = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className={`p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-all ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-black text-gray-800">{value}</span>
  </div>
);

export default Cuaca;