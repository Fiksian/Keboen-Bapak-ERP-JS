"use client";
import Link from 'next/link';
import WeatherCard from './WeatherCard'; 
import StockCard from '@/app/(Main)/Stock/StatCard';
import { useSession } from "next-auth/react";
import { Loader2, Users, PackageSearch, ShoppingCart } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import PurchasingCards from '@/app/(Main)/Purchasing/PurchasingStats';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('stocks'); 
  const [allData, setAllData] = useState([]);
  const [purchasingData, setPurchasingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [stockRes, purchasingRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/purchasing')
      ]);

      if (stockRes.ok) {
        const sData = await stockRes.json();
        setAllData(sData);
      }

      if (purchasingRes.ok) {
        const pData = await purchasingRes.json();
        setPurchasingData(Array.isArray(pData) ? pData : []);
      }

    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDashboardData(); 
  }, []);

  const filteredStockData = allData.filter(item => {
    const matchesTab = item.type?.toLowerCase() === activeTab.toLowerCase();
    const query = searchQuery.toLowerCase();
    const itemName = (item.name || item.item || "").toLowerCase();
    const category = (item.category || "").toLowerCase();
    const matchesSearch = itemName.includes(query) || category.includes(query);
    
    return matchesTab && matchesSearch;
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const isAuthorized = ["Admin"].includes(session?.user?.role);

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1600px] m-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4 md:mb-8">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-gray-500 text-xs md:text-sm font-bold italic">
            Sistem ERP Keboen Bapak
          </p>
        </div>

        {isAuthorized && (
          <Link 
            href="/Staff" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[11px] md:text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Users size={16} />
            Manage Staff
          </Link>
        )}
      </div>

      

      <div className="space-y-4">
        <div className="flex items-center gap-3 ml-2">
          <div className="p-2 bg-slate-800 rounded-lg text-white">
            <PackageSearch size={16} />
          </div>
          <h2 className="text-sm font-black uppercase italic tracking-widest text-slate-700">
            Stock Overview
          </h2>
          {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>
        
        <StockCard data={filteredStockData} />
      </div>


      <div className="space-y-4">
        <div className="flex items-center gap-3 ml-2">
          <div className="p-2 bg-slate-800 rounded-lg text-white">
            <ShoppingCart size={16} />
          </div>
          <h2 className="text-sm font-black uppercase italic tracking-widest text-slate-700">
            Procurement Overview
          </h2>
          {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>
        
        <PurchasingCards requests={purchasingData} />
      </div>
      
      <div className="grid grid-cols-1">
        <div className="w-full">
          <div className="h-full bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
            <WeatherCard />
          </div>
        </div>
      </div>
      
    </div>
  );
}