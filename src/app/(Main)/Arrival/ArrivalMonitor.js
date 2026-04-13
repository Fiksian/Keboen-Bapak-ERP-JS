'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Activity } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ArrivalCard from './ArrivalCard';
import ArrivalModal from './ArrivalModal';

// INITIAL_FORM: tidak ada warehouseId — gudang ditentukan saat Approval STTB
const INITIAL_FORM = {
  sttbNo:       '',
  suratJalan:   '',
  vehicleNo:    '',
  condition:    'GOOD',
  notes:        '',
  beratIsi:     '',
  beratKosong:  '',
  netto:        '0.00',
  refraksi:     '0.00',
  receivedQty:  0,
  sourceUnit:   'KG',
  warehouseUnit:'KG',
  image:        null,
};

const ArrivalMonitor = ({ arrivals = [], onRefresh }) => {
  const { data: session }    = useSession();
  const [selectedArrival,   setSelectedArrival]   = useState(null);
  const [isSubmitting,      setIsSubmitting]       = useState(false);
  const [formData,          setFormData]           = useState(INITIAL_FORM);

  const isAuthorized = ['SuperAdmin',"Admin", "Supervisor", "Staff"].includes(session?.user?.role);

  if (!arrivals || arrivals.length === 0) return null;

  const handleOpenReceipt = async (arrival) => {
    setSelectedArrival(arrival);
    // Sync warehouseUnit dari DB jika item sudah ada di Stock
    try {
      const res    = await fetch('/api/stock');
      const stocks = await res.json();
      const found  = stocks.find(s => s.name.toLowerCase() === arrival.item.toLowerCase());
      const unit   = found?.unit || arrival.unit || 'KG';
      setFormData(prev => ({ ...prev, warehouseUnit: unit }));
    } catch {
      setFormData(prev => ({ ...prev, warehouseUnit: arrival.unit || 'KG' }));
    }
  };

  const handleClose = () => {
    setSelectedArrival(null);
    setFormData(INITIAL_FORM);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('suratJalan',  formData.suratJalan);
      payload.append('vehicleNo',   formData.vehicleNo);
      payload.append('condition',   formData.condition);
      payload.append('notes',       formData.notes || '');
      payload.append('receivedBy',  session?.user?.name || 'Warehouse Staff');
      payload.append('receivedQty', parseFloat(formData.receivedQty));

      // Kirim data timbang jika ada
      if (formData.beratIsi) {
        payload.append('beratIsi',    formData.beratIsi);
        payload.append('beratKosong', formData.beratKosong);
        payload.append('refraksi',    formData.refraksi);
        payload.append('netto',       formData.netto);
      }

      // Tidak kirim warehouseId — ditentukan nanti di Approval STTB
      payload.append('file', formData.image);

      const res = await fetch(`/api/purchasing/${selectedArrival.id}/receive`, {
        method: 'PATCH',
        body:   payload,
      });

      if (res.ok) {
        handleClose();
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message}`);
      }
    } catch (err) {
      console.error("SUBMIT_RECEIPT_ERROR:", err);
      alert("Terjadi kesalahan sistem.");
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

      {/* Modal: tidak perlu prop warehouses lagi */}
      <ArrivalModal
        arrival={selectedArrival}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        onClose={handleClose}
        onSubmit={handleFinalSubmit}
      />
    </div>
  );
};

export default ArrivalMonitor;
