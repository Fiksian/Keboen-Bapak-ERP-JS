'use client'

import React, { useState, useEffect } from 'react'
import AddStaff from './AddStaff';
import StaffProfile from './StaffProfile';
import { Plus, Loader2 } from 'lucide-react';

const StaffManager = () => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewState, setViewState] = useState('LIST');

  // 1. Fungsi Mengambil Data dari Database
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffData(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // 2. Handler untuk melihat detail
  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setViewState('DETAILS');
  };

  // --- LOGIKA RENDER DINAMIS ---

  // Jika sedang melihat detail profil
  if (viewState === 'DETAILS' && selectedStaff) {
    return (
      <StaffProfile 
        staff={selectedStaff} 
        onBack={() => {
          setViewState('LIST');
          setSelectedStaff(null);
        }} 
        onUpdate={() => {
          fetchStaff(); 
        }} 
      />
    );
  }

  // Jika sedang dalam mode edit (Placeholder)
  if (viewState === 'EDIT' && selectedStaff) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl m-6 border border-dashed border-gray-200">
        <h2 className="text-xl font-bold mb-4">Edit Mode: {selectedStaff.firstName}</h2>
        <p className="text-gray-500 mb-6">Gunakan form di halaman Profil untuk melakukan pengeditan.</p>
        <button 
          onClick={() => setViewState('DETAILS')}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          Kembali ke Profil
        </button>
      </div>
    );
  }

  // Tampilan Utama (Daftar Staff)
  return (
    <div className="bg-gray-50 min-h-full p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-8 w-full max-w-full mx-auto border border-gray-100">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">All Staff</h2>
            <p className="text-sm text-gray-500">Total: {staffData.length} Staff terdaftar</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-100 transition-all active:scale-95 cursor-pointer">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <AddStaff 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            fetchStaff(); 
          }} 
        />
      
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
            <p className="text-gray-500 font-medium">Memuat data staff...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-50 custom-scrollbar">
            <table className="w-full min-w-[800px] text-left text-xs md:text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 font-semibold uppercase">No</th>
                  <th className="px-4 py-3 font-semibold uppercase">Name</th>
                  <th className="px-4 py-3 font-semibold uppercase text-center">Gender</th>
                  <th className="px-4 py-3 font-semibold uppercase">Staff ID</th>
                  <th className="px-4 py-3 font-semibold uppercase">Phone</th>
                  <th className="px-4 py-3 font-semibold uppercase">Role</th>
                  <th className="px-4 py-3 font-semibold uppercase">Designation</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffData.length > 0 ? (
                  staffData.map((staff, index) => (
                    <tr key={staff.id || index} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-4 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4 text-gray-800 font-bold">
                        {staff.firstName} {staff.lastName}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-center">{staff.gender}</td>
                      <td className="px-4 py-4 text-gray-500 font-mono text-[11px]">{staff.staffId}</td>
                      <td className="px-4 py-4 text-gray-500">{staff.phone || '-'}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[12px] font-bold">
                            {staff.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500">{staff.designation}</td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => handleViewDetails(staff)}
                          className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer transition-all hover:underline"
                        >
                          View more
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-500">Tidak ada data staff.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && staffData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-8 md:mt-12">
            <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded bg-blue-600 text-white shadow-lg shadow-blue-200 text-sm font-bold">1</button>
            <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-all cursor-pointer">
              <span className="text-xs">&gt;&gt;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffManager