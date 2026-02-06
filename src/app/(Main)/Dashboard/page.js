"use client";
import Link from 'next/link';
import WeatherCard from './WeatherCard'; 
import DashboardChart from './DashboardChart';
import UpcomingTasks from '@/app/(Main)/Tasks/page';
import { useSession } from "next-auth/react";
import { Loader2, Users } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const isAuthorized = ["Admin"].includes(session?.user?.role);

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1600px] mx-auto p-2 sm:p-0">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 md:mb-8">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 text-xs md:text-sm font-bold italic">
            Sistem ERP Keboen Bapak <span className="text-blue-600 font-black">v0.2</span>
          </p>
        </div>

        {isAuthorized && (
          <Link 
            href="/Staff" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[11px] md:text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Users size={16} />
            MANAGE STAFF
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-4 w-full h-full">
          <div className="h-full bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
            <WeatherCard />
          </div>
        </div>

        <div className="lg:col-span-8 w-full h-full">
          <div className="h-full bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100">
             <DashboardChart />
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-10">
        <div className="flex items-center gap-3 mb-4 md:mb-6 px-1">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full hidden sm:block" />
          <h2 className="text-base md:text-lg font-black text-gray-800 uppercase tracking-[0.15em] italic">
            Recent Activities & Tasks
          </h2>
        </div>
        
        <div className="bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
             <UpcomingTasks />
          </div>
        </div>
      </div>
      
    </div>
  );
}