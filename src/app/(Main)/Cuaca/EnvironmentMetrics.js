import React from 'react';
import { Wind, Droplets, Eye, Thermometer } from 'lucide-react';

const EnvironmentMetrics = ({ current }) => {
  return (
    <div className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 space-y-5 md:space-y-6">
      <h3 className="font-black text-gray-800 uppercase tracking-widest text-[9px] md:text-[10px]">Environment Metrics</h3>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
        <ConditionItem icon={<Wind size={16} />} label="Wind" value={`${current.wind_speed_10m} km/h`} color="text-blue-400" />
        <ConditionItem icon={<Droplets size={16} />} label="Hum" value={`${current.relative_humidity_2m}%`} color="text-cyan-500" />
        <ConditionItem icon={<Eye size={16} />} label="Vis" value={`${(current.visibility / 1000).toFixed(0)} km`} color="text-emerald-500" />
        <ConditionItem icon={<Thermometer size={16} />} label="Feels" value={`${Math.round(current.apparent_temperature)}°C`} color="text-orange-400" />
      </div>
    </div>
  );
};

const ConditionItem = ({ icon, label, value, color }) => (
  <div className="flex items-center justify-between group cursor-default">
    <div className="flex items-center gap-2 md:gap-4">
      <div className={`p-1.5 md:p-2 bg-gray-50 rounded-lg md:rounded-xl group-hover:bg-white group-hover:shadow-md transition-all ${color}`}>
        {React.cloneElement(icon, { size: 14, className: "md:w-[18px] md:h-[18px]" })}
      </div>
      <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs md:text-sm font-black text-gray-800">{value}</span>
  </div>
);

export default EnvironmentMetrics;