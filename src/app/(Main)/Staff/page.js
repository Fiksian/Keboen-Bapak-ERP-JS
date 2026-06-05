'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AddStaff from './AddStaff';
import StaffProfile from './StaffProfile';
import SearchInput from '@/app/(Main)/Components/SeachInput';
import Pagination from '@/app/(Main)/Components/Pagination';
import {
  Plus, Loader2, Users, RefreshCw, UserCircle,
  Shield, ChevronRight, Trash2, IdCard, ShieldAlert
} from 'lucide-react';
import { useSession } from "next-auth/react";
import { usePermission } from '@/lib/usePermission';
import withPermission from '@/lib/withPermission';

const StaffManagerContent = () => {
  const { data: session, status } = useSession();
  const { hasPermission, isSuperAdmin, loading: permissionLoading, userRole } = usePermission();
  
  const [staffData, setStaffData] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewState, setViewState] = useState('LIST');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canAccessStaff = isSuperAdmin || hasPermission('staff');
  const canAddStaff = isSuperAdmin || hasPermission('staff');
  const canEditStaff = isSuperAdmin || hasPermission('staff');
  const canDeleteStaff = isSuperAdmin || hasPermission('staff');

  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return;
    if (!canAccessStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resMe = await fetch('/api/staff/me');
      const profile = await resMe.json();

      if (resMe.ok) {
        setUserProfile(profile);

        if (!isSuperAdmin && profile.role !== 'SuperAdmin') {
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
  }, [status, canAccessStaff, isSuperAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, name) => {
    if (!canDeleteStaff) {
      alert("Anda tidak memiliki izin untuk menghapus staff");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStaffData(prev => prev.filter(s => s.id !== id));
        if (currentStaffTableData.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to delete staff.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("An error occurred while deleting staff.");
    }
  };

  const filteredStaff = useMemo(() =>
    staffData.filter(s => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const staffId = s.staffId?.toLowerCase() || '';
      const identity = s.identityNo?.toLowerCase() || '';
      const q = searchQuery.toLowerCase();
      return fullName.includes(q) || staffId.includes(q) || identity.includes(q);
    }),
    [staffData, searchQuery]
  );

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const currentStaffTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const handleViewDetails = (staff) => {
    if (!canEditStaff && !isSuperAdmin && staff.id !== userProfile?.id) {
      alert("Anda hanya dapat melihat profile Anda sendiri");
      return;
    }
    setSelectedStaff(staff);
    setViewState('DETAILS');
  };

  // Loading state untuk permission
  if (permissionLoading || status === "loading") {
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

  // Access denied state
  if (!canAccessStaff) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] p-8 text-center max-w-md shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase italic mb-2">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-500">
            Anda tidak memiliki izin untuk mengakses modul <span className="font-bold text-red-500">Staff Directory</span>.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400">
              Role Anda: <span className="font-mono font-bold text-gray-600">{userRole || 'Tidak terdeteksi'}</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">
            Hubungi Administrator untuk mendapatkan akses.
          </p>
        </div>
      </div>
    );
  }

  if (viewState === 'DETAILS' && selectedStaff) {
    return (
      <StaffProfile
        staff={selectedStaff}
        currentUserRole={userProfile?.role}
        onBack={(isSuperAdmin || canEditStaff) ? () => {
          setViewState('LIST');
          setSelectedStaff(null);
        } : null}
        onUpdate={fetchData}
        canEdit={canEditStaff || isSuperAdmin}
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
            <div className="flex items-center gap-2 flex-wrap">
              <Shield size={12} className="text-green-500" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">
                {filteredStaff.length} Employees Active
              </p>
              {isSuperAdmin && (
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                   SUPERADMIN
                </span>
              )}
              {userRole === 'Admin' && !isSuperAdmin && (
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                   ADMIN
                </span>
              )}
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                Staff: {canEditStaff ? 'Full Access' : 'Read Only'}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Find by name / ID / KTP..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-4 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:text-blue-600 hover:border-blue-100 transition-all active:rotate-180 duration-500 shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              
              {canAddStaff && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-gray-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95 group"
                >
                  <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
                  <span className="font-black uppercase italic text-xs tracking-widest">Add Staff</span>
                </button>
              )}
              
              {!canAddStaff && canAccessStaff && (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-2xl text-[10px] font-bold text-gray-500">
                  <ShieldAlert size={14} />
                  Read Only
                </div>
              )}
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
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">No. KTP</th>
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
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <IdCard size={12} className="text-gray-300" />
                        <span className="font-mono text-[11px] text-gray-500">
                          {staff.identityNo || <span className="text-gray-300 italic">—</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        staff.gender === 'Male'
                          ? 'bg-blue-50 text-blue-500 border border-blue-100'
                          : 'bg-pink-50 text-pink-500 border border-pink-100'
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
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(staff)}
                          className="px-5 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl text-[10px] font-black uppercase italic hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-90"
                        >
                          MANAGE
                        </button>
                        {canDeleteStaff && (
                          <button
                            onClick={() => handleDelete(staff.id, `${staff.firstName} ${staff.lastName}`)}
                            className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                            title="Delete Staff"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {currentStaffTableData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-gray-300 text-sm font-bold italic uppercase tracking-widest">
                      No staff found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-50">
            {currentStaffTableData.map((staff, index) => (
              <div key={staff.id} className="p-5 active:bg-blue-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1" onClick={() => handleViewDetails(staff)}>
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
                    {staff.identityNo && (
                      <span className="text-[9px] font-mono text-gray-400 mt-0.5">KTP: {staff.identityNo}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canDeleteStaff && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(staff.id, `${staff.firstName} ${staff.lastName}`); }}
                      className="p-2 text-gray-300 active:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-blue-500 transition-colors"
                    onClick={() => handleViewDetails(staff)}
                  />
                </div>
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
  );
};

export default withPermission(StaffManagerContent, 'staff');