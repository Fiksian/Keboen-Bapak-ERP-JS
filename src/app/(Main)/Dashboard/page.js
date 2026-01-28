"use client";
import Link from 'next/link';
import WeatherCard from './WeatherCard'; 
import DashboardChart from './DashboardChart';
import UpcomingTasks from '@/app/(Main)/Tasks/page';
import { useSession } from "next-auth/react";
import { Loader2 } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 font-bold italic">
            Sistem ERP Keboen Bapak v0.2
          </p>
        </div>

        {isAuthorized && (
          <Link 
            href="/Staff" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            MANAGE STAFF
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-full">
          <WeatherCard />
        </div>
        <div className="lg:col-span-8 h-full">
          <DashboardChart />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest">
            Recent Activities & Tasks
          </h2>
        </div>
        <UpcomingTasks />
      </div>
    </div>
  );
}