'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, History, ArrowDownLeft, Calendar, FileText, 
  Hash, Loader2, UserCheck, Clock, Printer, Truck 
} from 'lucide-react';
import PrintSTTB from '@/app/(Main)/Components/Stock/PrintSTTB';

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

  const handlePrintLog = (log) => {
    const mainReceipt = log.receipts[0];
    const printData = {
      ...log,
      suratJalan: mainReceipt.suratJalan,
      vehicleNo: mainReceipt.vehicleNo,
      receivedBy: mainReceipt.receivedBy,
      receivedAt: mainReceipt.receivedAt,
      condition: mainReceipt.condition,
      notes: mainReceipt.notes
    };
    
    setSelectedLog(printData);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full z-[250] flex justify-end overflow-hidden">
      {selectedLog && <PrintSTTB data={selectedLog} />}

      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={onClose} 
      />
      
      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col print:hidden">
        
        <div className="p-5 md:p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 shrink-0">
              <History size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Log Penerimaan</h2>
              <p className="text-[9px] md:text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">Inbound Tracking</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-all group active:scale-90"
          >
            <X size={24} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50 py-20">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Logs...</p>
            </div>
          ) : history.length > 0 ? (
            history.map((log) => {
              const mainReceipt = log.receipts[0];
              
              return (
                <div key={log.id} className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-blue-500 transition-all duration-300">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                      <div className="p-3 bg-green-50 text-green-600 rounded-2xl h-fit shrink-0">
                        <ArrowDownLeft size={20} strokeWidth={3} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
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
                      <div className="bg-green-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black italic shadow-lg shadow-green-100">
                        + {log.qty} {log.unit || 'UNIT'}
                      </div>
                      <button 
                        onClick={() => handlePrintLog(log)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 sm:bg-white border border-slate-900 sm:border-blue-100 text-white sm:text-blue-600 rounded-xl text-[9px] font-black uppercase italic hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <Printer size={12} /> <span className="sm:inline">Print STTB</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-left">
                    <div className="space-y-2">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Arrival Info</p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar size={12} className="text-blue-500 shrink-0" />
                          <span className="text-[10px] md:text-[11px] font-bold">
                            {new Date(mainReceipt.receivedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Truck size={12} className="text-orange-500 shrink-0" />
                          <span className="text-[10px] md:text-[11px] font-black bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded truncate">
                            {mainReceipt.vehicleNo}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Receiver PIC</p>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <UserCheck size={10} className="text-blue-600" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black uppercase italic truncate">
                            {mainReceipt.receivedBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock size={12} className="text-blue-400 shrink-0" />
                          <span className="text-[10px] font-bold">
                             {new Date(mainReceipt.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-20 px-10 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <History size={40} className="opacity-20" />
              </div>
              <p className="font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">No receipt records found in database</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistory;