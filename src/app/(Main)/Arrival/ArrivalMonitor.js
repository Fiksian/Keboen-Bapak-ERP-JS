'use client'

import React, { useState } from 'react';
import { Clock, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ArrivalCard from './ArrivalCard';
import ArrivalModal from './ArrivalModal';

const ArrivalMonitor = ({ arrivals = [], onRefresh }) => {
  const { data: session } = useSession();
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPO, setConfirmPO] = useState('');
  
  const [formData, setFormData] = useState({
    suratJalan: '',
    vehicleNo: '',
    condition: 'GOOD',
    notes: '',
    beratIsi: '',
    beratKosong: '',
    netto: '0.00'
  });

  const isAuthorized = ["Admin", "Supervisor", "Test"].includes(session?.user?.role);

  if (!arrivals || arrivals.length === 0) return null;

  const handleOpenReceipt = (arrival) => {
    setSelectedArrival(arrival);
    setConfirmPO('');
    setFormData({ 
      suratJalan: '', 
      vehicleNo: '', 
      condition: 'GOOD', 
      notes: '',
      beratIsi: '',
      beratKosong: '',
      netto: '0.00'
    });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (confirmPO.trim().toUpperCase() !== selectedArrival.noPO.toUpperCase()) {
      return alert("NOMOR PO TIDAK SESUAI! Silahkan periksa kembali dokumen fisik.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/purchasing/${selectedArrival.id}/receive`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receivedBy: session?.user?.name || 'Warehouse Staff',
          receivedQty: formData.netto > 0 ? parseFloat(formData.netto) : (parseFloat(selectedArrival.qty) || 0)
        }) 
      });

      if (res.ok) {
        setSelectedArrival(null);
        if (onRefresh) onRefresh();
      } else {
        const error = await res.json();
        alert(`Gagal: ${error.message}`);
      }
    } catch (err) {
      console.error("SUBMIT_RECEIPT_ERROR:", err);
      alert("Terjadi kesalahan sistem saat memproses data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-orange-50/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-orange-100 mb-8">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200 shrink-0">
            <Clock size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-[11px] md:text-xs font-black text-gray-800 uppercase tracking-widest italic leading-none">
              Arrival Monitor
            </h3>
            <p className="text-[9px] md:text-[10px] text-orange-600 font-bold mt-1 uppercase tracking-tighter">
              {arrivals.length} Units Pending Receipt
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-orange-100">
          <Activity size={12} className="text-orange-500 animate-pulse" />
          <span className="text-[8px] font-black text-orange-700 uppercase italic tracking-widest">Live System</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {arrivals.map((arrival) => (
          <ArrivalCard 
            key={arrival.id} 
            arrival={arrival} 
            isAuthorized={isAuthorized} 
            onOpen={handleOpenReceipt} 
          />
        ))}
      </div>

      <ArrivalModal 
        arrival={selectedArrival}
        confirmPO={confirmPO}
        setConfirmPO={setConfirmPO}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        onClose={() => setSelectedArrival(null)}
        onSubmit={handleFinalSubmit}
      />
    </div>
  );
};

export default ArrivalMonitor;