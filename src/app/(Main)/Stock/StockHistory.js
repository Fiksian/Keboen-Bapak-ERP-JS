'use client'

import React, { useState, useEffect } from 'react';
import { 
  X, History, ArrowDownLeft, Calendar, FileText, 
  Hash, Loader2, UserCheck, Clock, Printer 
} from 'lucide-react';
import PrintSTTB from '@/app/(Main)/Components/Stock/PrintSTTB'; // Pastikan path ini benar

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
              .filter(item => item.isReceived)
              .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
            setHistory(receivedLogs);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  // Fungsi untuk menangani pencetakan STTB dari log history
  const handlePrintLog = (log) => {
    setSelectedLog(log);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full z-[100] flex justify-end overflow-hidden">
      <PrintSTTB data={selectedLog} />

      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity print:hidden" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#f8f9fa] h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col print:hidden">
        
        {/* Header */}
        <div className="p-8 bg-white border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Receipt Logs</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inbound Tracking Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors group">
            <X size={24} className="text-gray-400 group-hover:text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Logs...</p>
            </div>
          ) : history.length > 0 ? (
            history.map((log) => (
              <div key={log.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-blue-500 transition-all duration-300">
                
                {/* Bagian Atas: Item, Qty & Action */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl h-fit">
                      <ArrowDownLeft size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 uppercase text-sm tracking-tight">{log.item}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-blue-600 font-black text-[10px] uppercase italic bg-blue-50 px-2 py-0.5 rounded">
                          <Hash size={10} /> {log.noPO}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400 font-bold text-[10px] uppercase italic">
                          <FileText size={10} /> SJ: {log.suratJalan || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-2xl text-xs font-black italic shadow-lg shadow-green-100">
                      + {log.qty}
                    </div>
                    {/* TOMBOL PRINT STTB */}
                    <button 
                      onClick={() => handlePrintLog(log)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-100 text-blue-600 rounded-xl text-[9px] font-black uppercase italic hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      <Printer size={12} /> Print STTB
                    </button>
                  </div>
                </div>

                {/* Bagian Bawah: Metadata (Waktu & Penerima) */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Arrival Date & Time</p>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={12} className="text-blue-500" />
                      <span className="text-[11px] font-bold">
                        {new Date(log.receivedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                        <Clock size={10} /> {new Date(log.receivedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Warehouse Staff (PIC)</p>
                    <div className="flex items-center gap-2 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCheck size={12} className="text-blue-600" />
                      </div>
                      <span className="text-[11px] font-black uppercase italic truncate">{log.receivedBy || 'System/Admin'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-20">
              <History size={48} className="mb-4 opacity-20" />
              <p className="font-bold uppercase text-xs tracking-widest">Records not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistory;