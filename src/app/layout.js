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

export default function RootLayout({ children }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col h-full overflow-hidden">
          <Header activeMenu={activeMenu} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            <main className="flex-1 overflow-auto bg-white">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}