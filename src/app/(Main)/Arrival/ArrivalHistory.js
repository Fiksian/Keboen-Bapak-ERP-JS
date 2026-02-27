'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, History, ArrowDownLeft, Calendar, FileText, 
  Hash, Loader2, UserCheck, Clock, Printer, Truck, Scale 
} from 'lucide-react';

const PrintSTTB = dynamic(() => import('@/app/(Main)/Components/Arrival/PrintSTTB'), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
        <Loader2 className="animate-spin text-blue-600" />
        <p className="text-xs font-black uppercase italic">Menyiapkan Preview PDF...</p>
      </div>
    </div>
  )
});

const StockHistory = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/purchasing');
          if (res.ok) {
            const data = await res.json();
            const receivedLogs = data
              .filter(item => item.isReceived && item.receipts?.length > 0)
              .sort((a, b) => {
                const dateA = new Date(a.receipts[0].receivedAt);
                const dateB = new Date(b.receipts[0].receivedAt);
                return dateB - dateA;
              });
            setHistory(receivedLogs);
          }
        } catch (error) {
          console.error("FETCH_HISTORY_ERROR:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  const handleOpenPreview = (log) => {
    const mainReceipt = log.receipts[0];
    const printData = {
      ...log,
      suratJalan: mainReceipt.suratJalan,
      vehicleNo: mainReceipt.vehicleNo,
      receivedBy: mainReceipt.receivedBy,
      receivedAt: mainReceipt.receivedAt,
      condition: mainReceipt.condition,
      notes: mainReceipt.notes,
      grossWeight: mainReceipt.grossWeight,
      tareWeight: mainReceipt.tareWeight,
      netWeight: mainReceipt.netWeight,
      imageUrl: mainReceipt.imageUrl
    };
    setSelectedLog(printData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full z-[250] flex justify-end overflow-hidden">
      
      {selectedLog && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setSelectedLog(null)}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest bg-white/10 px-3 py-1.5 rounded-full"
              >
                Tutup <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl">
                <PrintSTTB data={selectedLog} />
            </div>
          </div>
        </div>
      )}

      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col text-left">
        <div className="p-5 md:p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 shrink-0">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Log Penerimaan</h2>
              <p className="text-[9px] md:text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Inbound Tracking & Proofs</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-all group active:scale-90"
          >
            <X size={24} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 py-20">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-center">Synchronizing Logs...</p>
            </div>
          ) : history.length > 0 ? (
            history.map((log) => {
              const mainReceipt = log.receipts[0];
              return (
                <div key={log.id} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-blue-500 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex gap-3 md:gap-4 w-full sm:w-auto min-w-0 flex-1">
                      <div className="p-3 bg-green-50 text-green-600 rounded-2xl h-fit shrink-0">
                        <ArrowDownLeft size={20} strokeWidth={3} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-tight leading-tight truncate">
                          {log.item}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="flex items-center gap-1 text-blue-600 font-black text-[9px] uppercase italic bg-blue-50 px-2 py-0.5 rounded">
                            <Hash size={10} /> {log.noPO}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 font-bold text-[9px] uppercase italic">
                            <FileText size={10} /> {mainReceipt.suratJalan}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <div className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black italic">
                        + {mainReceipt.receivedQty} {log.unit || 'UNIT'}
                      </div>
                      <button 
                        onClick={() => handleOpenPreview(log)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase italic hover:bg-blue-600 transition-all active:scale-95 whitespace-nowrap shadow-sm"
                      >
                        <Printer size={14} /> Preview & PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                    <div className="text-left">
                      <p className="text-[7px] font-black text-orange-400 uppercase mb-1 leading-none">Gross</p>
                      <p className="text-[10px] font-black text-slate-700 leading-none">{mainReceipt.grossWeight || 0} kg</p>
                    </div>
                    <div className="text-left border-x border-orange-100 px-2">
                      <p className="text-[7px] font-black text-orange-400 uppercase mb-1 leading-none">Tare</p>
                      <p className="text-[10px] font-black text-slate-700 leading-none">{mainReceipt.tareWeight || 0} kg</p>
                    </div>
                    <div className="text-left pl-1">
                      <p className="text-[7px] font-black text-orange-600 uppercase mb-1 leading-none italic">Netto</p>
                      <p className="text-[10px] font-black text-orange-700 leading-none underline underline-offset-2">{mainReceipt.netWeight || 0} kg</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 mt-2 text-left">
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Arrival Info</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                          <Calendar size={10} className="text-blue-500" />
                          {new Date(mainReceipt.receivedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-black text-orange-700 bg-orange-50 w-fit px-1.5 rounded flex items-center gap-1.5">
                          <Truck size={10} />
                          {mainReceipt.vehicleNo}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Receiver PIC</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase italic text-slate-700 flex items-center gap-1.5">
                          <UserCheck size={10} className="text-blue-600" />
                          {mainReceipt.receivedBy}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Clock size={10} />
                          {new Date(mainReceipt.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-20 px-10">
              <History size={40} className="opacity-20 mb-4" />
              <p className="font-bold uppercase text-[10px] tracking-[0.2em] text-center">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistory;