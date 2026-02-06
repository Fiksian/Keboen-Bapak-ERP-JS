import React from 'react';

const WeatherHero = ({ current, currentDetails, heroGradient }) => {
  return (
    <div className={`relative bg-gradient-to-br ${heroGradient} rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-white overflow-hidden shadow-2xl transition-all duration-1000`}>
      <div className="absolute top-[-30px] right-[-30px] w-48 h-48 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6 md:gap-8 text-center sm:text-left">
        <div className="space-y-2 md:space-y-4">
          <div className="mx-auto sm:mx-0 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full w-fit text-[9px] md:text-[10px] font-black uppercase tracking-[2px] border border-white/20">
            {current.is_day ? '☀️ Day Cycle' : '🌙 Night Cycle'}
          </div>
          <div className="flex items-baseline justify-center sm:justify-start gap-1 md:gap-2">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter drop-shadow-md tabular-nums">
              {Math.round(current.temperature_2m)}°
            </h1>
            <span className="text-lg md:text-2xl font-black opacity-50 uppercase italic">C</span>
          </div>
          <div className="text-lg md:text-2xl font-bold opacity-95 flex flex-wrap justify-center sm:justify-start items-center gap-2 md:gap-3 uppercase italic tracking-tight">
             {currentDetails.label} <span className="hidden sm:block w-1.5 h-1.5 bg-white rounded-full"></span> 
             <span className="block sm:inline">{current.relative_humidity_2m}% Humidity</span>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-[28px] md:rounded-[32px] border border-white/20 shadow-inner group transition-transform hover:scale-105">
          {React.cloneElement(currentDetails.icon, { 
            size: 60,
            className: `md:w-[100px] md:h-[100px] drop-shadow-2xl ${current.is_day ? 'text-yellow-300 fill-yellow-300' : 'text-blue-200 fill-blue-100'}` 
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherHero;