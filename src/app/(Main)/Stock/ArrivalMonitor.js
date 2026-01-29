
import React, { useState } from 'react';
import { 
  Clock, PackageCheck, X, FileText, 
  Truck, ClipboardCheck, Loader2, AlertCircle,
  Lock
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const ArrivalMonitor = ({ arrivals, onRefresh }) => {
  const { data: session } = useSession();
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPO, setConfirmPO] = useState('');
  const [formData, setFormData] = useState({
    suratJalan: '',
    vehicleNo: '',
    condition: 'GOOD',
    notes: ''
  });

  const isAuthorized = ["Admin", "Supervisor", "Test"].includes(session?.user?.role);

  if (!arrivals || arrivals.length === 0) return null;

  const handleOpenModal = (arrival) => {
    if (!isAuthorized) return; 
    
    setSelectedArrival(arrival);
    setConfirmPO('');
    setFormData({
      suratJalan: '',
      vehicleNo: '',
      condition: 'GOOD',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (confirmPO.trim().toUpperCase() !== selectedArrival.noPO.toUpperCase()) {
      return alert("NOMOR PO TIDAK SESUAI! Harap periksa kembali dokumen fisik PO Anda.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/purchasing/${selectedArrival.id}/receive`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          receivedBy: session?.user?.name || 'Warehouse Staff',
          receivedQty: parseFloat(selectedArrival.qty) || 0
        }) 
      });

      if (res.ok) {
        setSelectedArrival(null);
        onRefresh();
      } else {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.message}`);
      }
    } catch (error) {
      console.error("RECEIVE_ERROR:", error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top duration-700 bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-orange-500 rounded-lg text-white shadow-lg shadow-orange-200">
          <Clock size={16} />
        </div>
        <div className="text-left">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest italic leading-none">Arrival Monitor</h3>
          <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">{arrivals.length} In-Transit</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {arrivals.map((arrival) => (
          <div key={arrival.id} className="bg-white p-5 rounded-[24px] flex justify-between items-center shadow-sm border border-transparent hover:border-orange-500 transition-all group">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <PackageCheck size={14} className="text-orange-500" />
                <p className="font-black text-gray-800 uppercase text-xs tracking-tight">{arrival.item}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{arrival.qty}</span>
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-tighter self-center">{arrival.supplier || 'Vendor'}</span>
              </div>
            </div>

            {isAuthorized ? (
              <button 
                onClick={() => handleOpenModal(arrival)} 
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black rounded-xl cursor-pointer transition-colors shadow-md shadow-orange-100 uppercase"
              >
                Terima
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase italic border border-slate-200">
                <Lock size={12} /> Restricted
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedArrival && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => !isSubmitting && setSelectedArrival(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">Confirm Receipt</h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                    <AlertCircle size={10} /> Blind Verification Required
                  </p>
                </div>
                <button onClick={() => setSelectedArrival(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-red-600 tracking-widest flex justify-between">
                    Input No. PO Manual <span>*Verifikasi Dokumen</span>
                  </label>
                  <div className="relative">
                    <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={16} />
                    <input 
                      required
                      type="text"
                      placeholder="Ketik Nomor PO di sini..."
                      className="w-full text-slate-600 bg-red-50/50 border border-red-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-black focus:ring-2 focus:ring-red-500 outline-none"
                      value={confirmPO}
                      onChange={(e) => setConfirmPO(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Surat Jalan</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text"
                        placeholder="No. SJ Vendor"
                        className="w-full text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none"
                        value={formData.suratJalan}
                        onChange={(e) => setFormData({...formData, suratJalan: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">No. Kendaraan</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        required
                        type="text"
                        placeholder="Plat Nomor"
                        className="w-full text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold outline-none"
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Physical Condition</label>
                  <select 
                    className="w-full text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-xs font-black uppercase cursor-pointer"
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  >
                    <option value="GOOD">✅ GOOD (NORMAL)</option>
                    <option value="DAMAGED">❌ DAMAGED (RUSAK)</option>
                    <option value="PARTIAL">⚠️ PARTIAL (TIDAK LENGKAP)</option>
                  </select>
                </div>

                <button 
                  disabled={isSubmitting || !confirmPO || !formData.suratJalan || !formData.vehicleNo}
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-orange-600 disabled:bg-slate-200 text-white py-4 mt-4 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Process Receipt"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrivalMonitor;