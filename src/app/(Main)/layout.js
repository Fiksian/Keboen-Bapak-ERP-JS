'use client'
import Header from '@/app/(Main)/Components/Header';
import Sidebar from '@/app/(Main)/Components/Sidebar';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession(); // Ambil data session & status loading
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/Login');
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#8da070]" size={40} />
        <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
          Verifying Access...
        </p>
      </div>
    );
  }

  const userRole = session?.user?.role || 'Staff';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        user={session?.user}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          userRole={userRole}
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