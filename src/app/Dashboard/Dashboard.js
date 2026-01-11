import React from 'react';
import WeatherCard from './WeatherCard';
import DashboardChart from './DashboardChart';
import UpcomingTasks from '../Tasks/Tasks';

const Dashboard = () => {
  return (
    <div className="p-6 bg-gray-50 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Cuaca */}
        <div className="lg:col-span-4">
          <WeatherCard />
        </div>
        
        {/* Kolom Kanan: Chart */}
        <div className="lg:col-span-8">
          <DashboardChart />
        </div>
      </div>

      {/* Baris Bawah: Upcoming Tasks */}
      <div className="w-full">
        <UpcomingTasks />
      </div>
    </div>
  );
};

export default Dashboard;