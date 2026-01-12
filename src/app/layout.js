"use client";

import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './Dashboard/Dashboard';
import StaffManager from './Staff/StaffManager';
import Tasks from './Tasks/Tasks';
import Kandang from './Kandang/Kandang';
import Stock from './Stock/Stock';
import Purchasing from './Purchasing/Purchasing';
import Report from './Report/Report';
import Cuaca from './Cuaca/Weather';
import Notification from './Notifications/Notification';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Layout({ children }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false); 

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return <Dashboard />; 
      case 'Staff':
        return <StaffManager />
      case 'Tasks':
        return <Tasks />; 
      case 'Kandang':
        return <Kandang />;
      case 'Stock':
        return <Stock />; 
      case 'Purchasing':
        return <Purchasing />;
      case 'Report':
        return <Report />; 
      case 'Cuaca':
        return <Cuaca />;
      case 'Notifications':
        return <Notification />;
      default:
        return children; // Menampilkan isi dari page.js bawaan Next.js
    }
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col h-screen">
          <Header />
          <div className="flex flex-1 h-[calc(100vh-60px)] overflow-hidden">
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}/>
            <main className="flex-1 overflow-y-auto bg-white">
              {renderContent()}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
