'use client'

import React, {useState} from 'react'
import AddStaff from './AddStaff';
import StaffProfil from './StaffProfil';
import { Plus } from 'lucide-react';

const StaffManager = () => {
  // Dummy Data
  const staffData = [
    { sn: '01', firstName: 'Sandra', lastName: 'Williams', gender: 'Female', staffId: '0246AHR', phone: '08130000000', role: 'Admin', designation: 'Human Resources' },
    { sn: '02', firstName: 'Abubakar', lastName: 'Ibrahim', gender: 'Male', staffId: '0251ITO', phone: '07062000033', role: 'I.T', designation: 'Operations' },
    { sn: '03', firstName: 'Ikechukwu', lastName: 'Ugbonna', gender: 'Male', staffId: '0340ITO', phone: '08130000000', role: 'I.T', designation: 'Operations' },
    { sn: '04', firstName: 'Joshua', lastName: 'Adewale', gender: 'Male', staffId: '0146APM', phone: '07038126632', role: 'Admin', designation: 'Project Management' },
    { sn: '05', firstName: 'Fatimah', lastName: 'Nasir', gender: 'Female', staffId: '0226ACS', phone: '08130000000', role: 'Admin', designation: 'Customer Service' },
    { sn: '06', firstName: 'Hauwa', lastName: 'Lateef', gender: 'Female', staffId: '0124HR', phone: '08130000000', role: 'I.T', designation: 'Human Resources' },
  ];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
    const [viewState, setViewState] = useState('LIST');


  const handleSave = (updatedData) => {
    console.log("Data diperbarui:", updatedData);
    // Logika simpan data ke database/API di sini
    setViewState('DETAILS'); 
  };

  if (viewState === 'DETAILS') {
    return <StaffProfile 
              staff={selectedStaff} 
              onBack={() => setViewState('LIST')} 
              onEdit={() => setViewState('EDIT')} // Tambahkan prop ini ke StaffProfile
           />;
  }

  if (selectedStaff) {
      return (
        <StaffProfil
          staff={selectedStaff} 
          onBack={() => setSelectedStaff(null)} 
        />
      );
    }

  if (viewState === 'EDIT') {
    return <EditStaffProfile 
              staff={selectedStaff} 
              onSave={handleSave} 
              onCancel={() => setViewState('DETAILS')} 
           />;
  }


  return (
    <div className="bg-gray-50 min-h-full p-4 md:p-8 lg:p-10">
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-8 w-full max-w-full mx-auto border border-gray-100">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">All Staff</h2>
          {/* Tombol Tambah Staff */}
          <button
            onClick={()=>setIsModalOpen(true)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-100 transition-all active:scale-95 cursor-pointer">
            <Plus size={24} strokeWidth={3} />
          </button>        </div>

      {/* Render Modal */}
      <AddStaff 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
      {/* Tabel */}
       <div className="w-full overflow-x-auto rounded-lg border border-gray-50 custom-scrollbar">
          <table className="w-full min-w-[800px] text-left text-xs md:text-sm">
          {/* Judul Tabel */}
            <thead>
              <tr className="text-gray-400 border-b border-gray-500 bg-gray-50/50">
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">S/N</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">First Name</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Last Name</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-center">Gender</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Staff ID</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Phone Number</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider">Designation</th>
                <th className="px-4 py-3 font-semibold text-center sticky right-0 bg-gray-50/50">Action</th>
              </tr>
            </thead>
            {/* Tabel Body */}
            <tbody className="divide-y divide-gray-50">
              {staffData.map((staff, index) => (
                <tr key={index} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-4 py-4 text-gray-500 font-medium">{staff.sn}</td>
                  <td className="px-4 py-4 text-gray-800 font-medium">{staff.firstName}</td>
                  <td className="px-4 py-4 text-gray-800 font-medium">{staff.lastName}</td>
                  <td className="px-4 py-4 text-gray-500 text-center">{staff.gender}</td>
                  <td className="px-4 py-4 text-gray-500 font-mono text-[11px]">{staff.staffId}</td>
                  <td className="px-4 py-4 text-gray-500">{staff.phone}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-[13px] text-gray-600">
                        {staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{staff.designation}</td>
                  <td className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-blue-50/20">
                    <button 
                      onClick={() => setSelectedStaff(staff)} // Panggil fungsi ini
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs whitespace-nowrap cursor-pointer transition-all hover:underline active:scale-95"
                    >
                      View more
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* * Pagination Placeholder */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-8 md:mt-12">
          <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded bg-blue-600 text-white shadow-lg shadow-blue-200 text-sm font-bold transition-transform hover:scale-105 active:scale-95">1</button>
          
          {[2, 3, 4, 5].map((num) => (
            <button key={num} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-sm font-medium transition-all cursor-pointer">
              {num}
            </button>
          ))}
          
          <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-all cursor-pointer">
            <span className="text-xs">&gt;&gt;</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffManager