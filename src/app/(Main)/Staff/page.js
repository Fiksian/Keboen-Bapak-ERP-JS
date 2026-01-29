'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AddStaff from './AddStaff';
import StaffProfile from './StaffProfile';
import SearchInput from '@/app/(Main)/Components/SeachInput'; 
import Pagination from '@/app/(Main)/Components/Pagination';   
import { Plus, Loader2, Users, RefreshCw, UserCircle } from 'lucide-react';
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
            console.log("Staff Data Received:", data); 
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
        <p className="text-gray-500 font-bold mt-4 tracking-widest animate-pulse uppercase text-[10px]">
          Loading Your Profile...
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
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Directory</h1>
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2 uppercase text-[11px] tracking-[0.2em]">
              Administrator View: Managing {filteredStaff.length} records
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            {/* GLOBAL SEARCH COMPONENT */}
            <SearchInput 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by name or ID..."
            />

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={fetchData}
                className="p-4 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all active:rotate-180 duration-500"
              >
                <RefreshCw size={20} />
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-blue-200 transition-all active:scale-95 group"
              >
                <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                <span className="font-bold">Add Staff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-4xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.1em]">No</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.1em]">Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.1em] text-center">Gender</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.1em]">Position</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.1em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentStaffTableData.map((staff, index) => (
                  <tr key={staff.id} className="hover:bg-blue-50/20 transition-all duration-300">
                    <td className="px-8 py-6 text-gray-600 font-mono text-xs">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold text-base">
                          {staff.firstName} {staff.lastName}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                          {staff.staffId}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        staff.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                      }`}>
                        {staff.gender}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded w-fit font-black mb-1">
                          {staff.role}
                        </span>
                        <span className="text-xs text-gray-500">{staff.designation}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleViewDetails(staff)}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                      >
                        MANAGE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GLOBAL PAGINATION COMPONENT */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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