'use client'
import Header from '@/app/(Main)/Components/Layout/Header';
import Sidebar from '@/app/(Main)/Components/Layout/Sidebar';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession(); 
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

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
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <div className="print:hidden">
        <Header 
          user={session?.user} 
          isMobileMenuOpen={isOpenMobile}
          toggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
          onLogout={() => signOut({ callbackUrl: '/Login' })}
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className="print:hidden h-full">
          <Sidebar 
            userRole={userRole}
            isCollapsed={isCollapsed} 
            toggleSidebar={() => setIsCollapsed(!isCollapsed)}
            isOpenMobile={isOpenMobile}
            onCloseMobile={() => setIsOpenMobile(false)}
          />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-6 print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-[1600px] mx-auto print:max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}