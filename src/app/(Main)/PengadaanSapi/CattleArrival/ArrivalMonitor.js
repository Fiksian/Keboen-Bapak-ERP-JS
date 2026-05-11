'use client';

import React, { useState } from 'react';
import { Clock, Activity, Beef } from 'lucide-react';
import { useSession } from 'next-auth/react';
import CattleArrivalCard from './ArrivalCard';
import CattleArrivalModal from './ArrivalModal';

const CattleArrivalMonitor = ({ arrivals = [], onRefresh }) => {
  const { data: session }         = useSession();
  const [selected,  setSelected]  = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAuthorized = ['SuperAdmin', 'Admin', 'Supervisor', 'Staff'].includes(session?.user?.role);

  if (!arrivals || arrivals.length === 0) return null;

  const handleOpen  = (arrival) => setSelected(arrival);
  const handleClose = () => setSelected(null);

  const handleSubmit = async (e, payload) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/cattle/arrival', { method: 'POST', body: payload });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        handleClose();
        onRefresh?.();
      } else {
        alert(`Gagal: ${data.message}`);
      }
    } catch (err) {
      console.error('CATTLE_ARRIVAL_SUBMIT:', err);
      alert('Kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-[#8da070]/5 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-[#8da070]/20 mb-8">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#8da070] rounded-xl text-white shadow-lg shadow-[#8da070]/20 shrink-0">
            <Beef size={18} />
          </div>
          <div>
            <h3 className="text-[11px] md:text-xs font-black text-gray-800 uppercase tracking-widest italic leading-none">
              Cattle Arrival Monitor
            </h3>
            <p className="text-[9px] md:text-[10px] text-[#8da070] font-bold mt-1 uppercase tracking-tighter">
              {arrivals.length} PO Menunggu Penerimaan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-[#8da070]/20">
          <Activity size={12} className="text-[#8da070] animate-pulse" />
          <span className="text-[8px] font-black text-[#8da070] uppercase italic tracking-widest">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {arrivals.map((arrival) => (
          <CattleArrivalCard
            key={arrival.id}
            arrival={arrival}
            isAuthorized={isAuthorized}
            onOpen={handleOpen}
          />
        ))}
      </div>

      <CattleArrivalModal
        arrival={selected}
        isSubmitting={submitting}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CattleArrivalMonitor;
