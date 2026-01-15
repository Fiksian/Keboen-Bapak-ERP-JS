"use client";
import Link from 'next/link';
import WeatherCard from './WeatherCard'; 
import DashboardChart from './DashboardChart';
import UpcomingTasks from '@/app/(Main)/Tasks/page';

export default function DashboardPage() {

  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase">Dashboard Overview</h1>
          <p className="text-gray-600 font-bold italic">Sistem ERP Keboen Bapak v0.2</p>
        </div>
        <Link href="/Staff" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-sm shadow-md hover:bg-blue-700 transition-all">
          MANAGE STAFF
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-full"><WeatherCard /></div>
        <div className="lg:col-span-8 h-full"><DashboardChart /></div>
      </div>

      <div>
        <UpcomingTasks />
      </div>
    </div>
  );
}