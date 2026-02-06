'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AddStaff from './AddStaff';
import StaffProfile from './StaffProfile';
import SearchInput from '@/app/(Main)/Components/SeachInput'; 
import Pagination from '@/app/(Main)/Components/Pagination';   
import { Plus, Loader2, Users, RefreshCw, UserCircle, Shield, ChevronRight } from 'lucide-react';
import { useSession } from "next-auth/react";

const StaffManager = () => {
  const { data: session, status } = useSession();
  const [staffData, setStaffData] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewState, setViewState] = useState('LIST');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;
    
    setLoading(true);
    try {
      const resMe = await fetch('/api/staff/me');
      const profile = await resMe.json();
      
      if (resMe.ok) {
        setUserProfile(profile);

        if (profile.role !== 'Admin') {
          setSelectedStaff(profile);
          setViewState('DETAILS');
        } else {
          const resStaff = await fetch('/api/staff');
          const data = await resStaff.json();
          
          if (resStaff.ok) {
            setStaffData(Array.isArray(data) ? data : data.data || []);
          }
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStaff = useMemo(() => {
    return staffData.filter(staff => {
      const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
      const staffId = staff.staffId?.toLowerCase() || '';
      return fullName.includes(searchQuery.toLowerCase()) || staffId.includes(searchQuery.toLowerCase());
    });
  }, [staffData, searchQuery]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  
  const currentStaffTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setViewState('DETAILS');
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#f8fafc]">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={50} />
          <UserCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={20} />
        </div>
        <p className="text-gray-500 font-black mt-4 tracking-widest animate-pulse uppercase text-[10px]">
          Synchronizing Data...
        </p>
      </div>
    );
  }

  if (viewState === 'DETAILS' && selectedStaff) {
    return (
      <StaffProfile 
        staff={selectedStaff} 
        currentUserRole={userProfile?.role}
        onBack={userProfile?.role === 'Admin' ? () => {
          setViewState('LIST');
          setSelectedStaff(null);
        } : null} 
        onUpdate={fetchData} 
      />
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 md:mb-12">
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100">
                <Users size={24} />
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
                Staff <span className="text-blue-600">Directory</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
               <Shield size={12} className="text-green-500" />
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">
                 Admin: {filteredStaff.length} Employees Active
               </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Find by name/ID..."
            />

            <div className="flex items-center gap-2">
              <button 
                onClick={fetchData}
                className="p-4 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-blue-600 hover:border-blue-100 transition-all active:rotate-180 duration-500 shadow-sm"
              >
                <RefreshCw size={20} />
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-gray-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 group"
              >
                <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
                <span className="font-black uppercase italic text-xs tracking-widest">Add Staff</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">No</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Employee Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Gender</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Position & Role</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentStaffTableData.map((staff, index) => (
                  <tr key={staff.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-6 text-gray-400 font-mono text-[10px]">
                      {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-sm uppercase tracking-tight">
                          {staff.firstName} {staff.lastName}
                        </span>
                        <span className="text-[9px] font-bold text-blue-500 tracking-widest uppercase">
                          ID: {staff.staffId}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        staff.gender === 'Male' ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-pink-50 text-pink-500 border border-pink-100'
                      }`}>
                        {staff.gender}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="bg-gray-900 text-white text-[8px] px-2 py-0.5 rounded w-fit font-black mb-1 uppercase italic">
                          {staff.role}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">{staff.designation}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleViewDetails(staff)}
                        className="px-5 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl text-[10px] font-black uppercase italic hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-90"
                      >
                        MANAGE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-50">
            {currentStaffTableData.map((staff, index) => (
              <div 
                key={staff.id} 
                onClick={() => handleViewDetails(staff)}
                className="p-5 active:bg-blue-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-black text-[13px] uppercase tracking-tight">
                      {staff.firstName} {staff.lastName}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase italic">
                        {staff.role}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {staff.designation}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>

          <div className="bg-gray-50/30 border-t border-gray-100 p-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <AddStaff 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchData(); 
        }} 
      />
    </div>
  )
}

export default StaffManager