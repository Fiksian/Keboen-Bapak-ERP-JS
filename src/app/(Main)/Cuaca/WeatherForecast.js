import React from 'react';
import { Calendar } from 'lucide-react';

const WeatherForecast = ({ daily, getWeatherDetails }) => {
  return (
    <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100">
      <h3 className="font-black text-gray-800 uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 mb-4 md:mb-6">
        <Calendar size={14} className="text-blue-600" /> Weekly Forecast
      </h3>
      <div className="space-y-0.5 md:space-y-1">
        {daily.time.map((date, idx) => {
          const dayDetails = getWeatherDetails(daily.weather_code[idx]);
          return (
            <div key={idx} className="flex items-center justify-between py-2.5 md:py-3 px-3 md:px-4 hover:bg-blue-50/50 rounded-xl md:rounded-2xl transition-all group border border-transparent hover:border-blue-50">
              <div className="w-16 md:w-20 text-[10px] md:text-[11px] font-black text-gray-800 uppercase">
                {idx === 0 ? "Hari Ini" : new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-1 px-2 md:px-4">
                {React.cloneElement(dayDetails.icon, { size: 14, className: "group-hover:scale-125 transition-transform" })}
                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase truncate">{dayDetails.label}</span>
              </div>
              <div className="text-[10px] md:text-[11px] font-black text-gray-800 tabular-nums">
                {Math.round(daily.temperature_2m_max[idx])}° <span className="text-gray-300 mx-0.5">|</span> <span className="text-gray-400">{Math.round(daily.temperature_2m_min[idx])}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherForecast;