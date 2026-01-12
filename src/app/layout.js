"use client";

import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Import Komponen Autentikasi
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgetPassword from './Auth/ForgetPassword';
// Import Komponen Dashboard
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
  // --- STATE INTERAKSI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Status Login
  const [authPage, setAuthPage] = useState('login');   // Navigasi Login vs Register
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false); 

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // --- LOGIKA RENDER ---
  const renderContent = () => {
  if (!isLoggedIn) {
    switch (authPage) {
      case 'register':
        return <Register onNavigate={() => setAuthPage('login')} />;
      
      // Pastikan case ini sama dengan string yang dikirim dari Login
      case 'forget': 
        return <ForgetPassword onNavigate={() => setAuthPage('login')} />;
      
      default:
        return (
          <Login 
            onLogin={() => setIsLoggedIn(true)} 
            // Pastikan prop onNavigate digunakan untuk Register sesuai file Login.js kita
            onNavigate={() => setAuthPage('register')} 
            onNavigateForgot={() => setAuthPage('forget')} 
          />
        );
    }
  }

  // Jika sudah login, tampilkan Menu Utama
  switch (activeMenu) {
    case 'Dashboard': return <Dashboard />; 
    case 'Staff': return <StaffManager />;
    case 'Tasks': return <Tasks />; 
    case 'Kandang': return <Kandang />;
    case 'Stock': return <Stock />; 
    case 'Purchasing': return <Purchasing />;
    case 'Report': return <Report />; 
    case 'Cuaca': return <Cuaca />;
    case 'Notifications': return <Notification />;
    default: return children;
  }
};

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Jika belum login, tampilkan full screen (tanpa sidebar/header) */}
        {!isLoggedIn ? (
          <div className="h-screen bg-[#f0f2f5]">
            {renderContent()}
          </div>
        ) : (
          /* Jika sudah login, tampilkan Layout Dashboard Lengkap */
          <div className="flex flex-col h-screen">
            <Header onLogout={() => setIsLoggedIn(false)} />
            <div className="flex flex-1 h-[calc(100vh-60px)] overflow-hidden">
              <Sidebar 
                activeMenu={activeMenu} 
                setActiveMenu={setActiveMenu} 
                isCollapsed={isCollapsed} 
                toggleSidebar={toggleSidebar}
              />
              <main className="flex-1 overflow-y-auto bg-white">
                {renderContent()}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}