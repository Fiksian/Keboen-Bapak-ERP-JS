"use client";

import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from './components/Header';
import Sidebar from './components/Sidebar';

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
        return <div>Ini Halaman Dashboard</div>; // Ganti dengan <Dashboard />
      case 'Profil':
        return <div>Ini Halaman Profil</div>;
      case 'Tasks':
        return <div>Ini Halaman Daftar Tugas</div>;
      case 'Plants':
        return <div>Ini Halaman Tanaman</div>;
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