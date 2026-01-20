import React from 'react';
import { Clock } from 'lucide-react';

const ArrivalMonitor = ({ arrivals, onRefresh }) => {
  if (arrivals.length === 0) return null;

  const handleReceiveItem = async (purchaseId) => {
    if (!confirm("Konfirmasi barang telah diterima fisik di gudang?")) return;
    const res = await fetch(`/api/stock/${purchaseId}/receive`, { method: 'PATCH' });
    if (res.ok) {
      alert("Barang berhasil masuk gudang!");
      onRefresh();
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-orange-50/50 p-6 rounded-[32px] border border-orange-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-200">
          <Clock size={16} />
        </div>
        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest italic">
          Arrival Monitor <span className="text-orange-500">({arrivals.length} Pending)</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arrivals.map((arrival) => (
          <div key={arrival.id} className="bg-white p-5 rounded-[24px] flex justify-between items-center shadow-sm border border-transparent hover:border-orange-500 transition-all group">
            <div className="space-y-1">
              <p className="font-black text-gray-800 uppercase text-xs tracking-tight">{arrival.item}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{arrival.qty} • {arrival.category}</p>
            </div>
            <button onClick={() => handleReceiveItem(arrival.id)} className="px-4 py-2 bg-orange-500 text-white text-[10px] font-black rounded-xl cursor-pointer">TERIMA</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArrivalMonitor;