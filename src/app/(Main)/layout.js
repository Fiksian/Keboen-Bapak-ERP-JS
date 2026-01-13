'use client'
import Header from '@/app/(Main)/Components/Header';
import Sidebar from '@/app/(Main)/Components/Sidebar';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const userLoggedIn = true; // Ganti dengan logika cek auth sesungguhnya
    if (!userLoggedIn) {
      router.push('/Login');
    }
  }, [router]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}