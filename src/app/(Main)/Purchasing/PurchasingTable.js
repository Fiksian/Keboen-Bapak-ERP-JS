'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Hash, Building2, CalendarDays, User, ShieldCheck, 
  Truck, Printer, RotateCcw, Trash2, PackageCheck, Info,
  Layers, ShoppingBag, CheckSquare, Square, Check, ArrowDownRight,
  UserCheck
} from 'lucide-react';

const PurchasingTable = ({ data, onStatusUpdate, onDelete, onPrint, onBulkStatusUpdate }) => {
  const { data: session } = useSession();
  const [selectedIds, setSelectedIds] = useState([]);
  
  const isAuthorized = ["Admin", "Supervisor", "Test"].includes(session?.user?.role);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectableItems = data.filter(req => !req.isReceived);
    if (selectedIds.length === selectableItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableItems.map(item => item.id));
    }
  };

  const getRowStyle = (noPO, isSelected) => {
    if (isSelected) return 'bg-blue-100/50 shadow-inner';
    return 'hover:bg-gray-50/50';
  };

  return (
    <div className="w-full bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all">
      
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 px-8 py-4 flex justify-between items-center animate-in slide-in-from-top duration-300 sticky top-0 z-20 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
                <Check size={14} strokeWidth={4} />
            </div>
            <div>
              <p className="text-white text-[11px] font-black uppercase italic tracking-widest">
                {selectedIds.length} Items Selected
              </p>
              <p className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter">Authorized Bulk Approval</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                onBulkStatusUpdate?.(selectedIds, 'APPROVED');
                setSelectedIds([]);
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all active:scale-95 shadow-lg shadow-green-900/40 flex items-center gap-2"
            >
              <ShieldCheck size={14} /> Bulk Approve
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] bg-gray-50/50">
              <th className="px-6 py-6 w-16 text-center border-b border-gray-100">
                <button 
                  onClick={toggleSelectAll} 
                  className="text-gray-300 hover:text-blue-600 transition-colors"
                >
                  {selectedIds.length > 0 && selectedIds.length === data.filter(r => !r.isReceived).length 
                    ? <CheckSquare size={18} className="text-blue-600" /> 
                    : <Square size={18} />
                  }
                </button>
              </th>
              <th className="px-4 py-6 border-b border-gray-100">PO & Supplier</th>
              <th className="px-6 py-6 border-b border-gray-100">Detail Item</th>
              <th className="px-6 py-6 border-b border-gray-100 text-center">Stakeholders</th>
              <th className="px-6 py-6 border-b border-gray-100 text-center">Biaya Item</th>
              <th className="px-8 py-6 border-b border-gray-100 text-right">Manajemen</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.length > 0 ? data.map((req, index) => {
              const qtyNum = parseFloat(req.qty) || 0;
              const unitPrice = parseFloat(req.price) || 0;
              const totalRow = qtyNum * unitPrice;
              const isSelected = selectedIds.includes(req.id);
              
              const dateCreated = new Date(req.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
              });
              
              const receiverName = req.receipts?.[0]?.receivedBy || req.receivedBy || "Belum Diterima";

              const isFirstInGroup = index === 0 || req.noPO !== data[index - 1].noPO;

              return (
                <tr 
                  key={req.id} 
                  className={`transition-all group ${getRowStyle(req.noPO, isSelected)} ${isFirstInGroup && index !== 0 ? 'border-t-2 border-gray-100' : ''}`}
                >
                  <td className={`px-6 py-6 text-center border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    {!req.isReceived ? (
                      <button 
                        onClick={() => toggleSelect(req.id)}
                        className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-200 group-hover:text-gray-400'}`}
                      >
                        {isSelected ? <CheckSquare size={20} strokeWidth={2.5} /> : <Square size={20} />}
                      </button>
                    ) : (
                      <div className="text-green-500/40 flex justify-center">
                        <PackageCheck size={20} />
                      </div>
                    )}
                  </td>

                  <td className={`px-4 py-6 border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    <div className="flex flex-col gap-1.5">
                      {isFirstInGroup ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-600 text-[10px] italic tracking-tighter bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase flex items-center gap-1">
                              <Hash size={10} strokeWidth={3} /> {req.noPO || "PENDING"}
                            </span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                              req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                              req.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="flex items-center gap-1.5 font-black text-gray-800 text-[12px] uppercase tracking-tight">
                            <Building2 size={13} className="text-gray-300" /> 
                            <span className="truncate max-w-[150px]">{req.supplier || "Supplier Umum"}</span>
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-300 ml-2">
                           <ArrowDownRight size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Same PO Transaction</span>
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest italic ml-1">
                        <CalendarDays size={10} /> {dateCreated}
                      </span>
                    </div>
                  </td>

                  <td className={`px-6 py-6 border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    <div className="flex flex-col gap-1.5">
                      <span className="font-black text-gray-900 uppercase text-[13px] tracking-tight group-hover:text-blue-600 transition-colors">{req.item}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-md font-black italic">
                          {qtyNum.toLocaleString('id-ID')} {req.unit || 'KG'}
                        </span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${
                          req.type === 'STOCKS' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-purple-600 border-purple-100 bg-purple-50'
                        }`}>
                          <Layers size={10} /> {req.type || 'STOCKS'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className={`px-6 py-6 text-center border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    <div className="inline-flex flex-col gap-1.5 items-center min-w-[120px]">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-100 w-full justify-start shadow-sm" title={`Requested By: ${req.requestedBy}`}>
                        <User size={10} className="text-blue-500 shrink-0" />
                        <span className="uppercase truncate">{req.requestedBy || "USER"}</span>
                      </div>
                      
                      {req.status === 'APPROVED' || req.status === 'RECEIVED' ? (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 w-full justify-start" title={`Approved By: ${req.approvedBy || "ADMIN"}`}>
                          <ShieldCheck size={10} className="shrink-0" />
                          <span className="uppercase truncate">{req.approvedBy || "ADMIN"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 animate-pulse w-full justify-center">
                          <Info size={10} className="shrink-0" />
                          <span className="uppercase">WAITING</span>
                        </div>
                      )}

                      {req.isReceived && (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-full justify-start" title={`Received By: ${receiverName}`}>
                          <UserCheck size={10} className="shrink-0" />
                          <span className="uppercase truncate">{receiverName}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className={`px-6 py-6 text-center border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    <div className="inline-flex flex-col items-center">
                      <span className="text-[14px] font-black text-gray-900 italic tracking-tighter">
                        Rp {totalRow.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                        {qtyNum.toLocaleString('id-ID')} x {unitPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </td>

                  <td className={`px-8 py-6 text-right border-b border-gray-50 ${isFirstInGroup ? 'pt-8' : 'pt-4'}`}>
                    <div className="flex justify-end items-center gap-2">
                      {(req.status === 'APPROVED' || req.isReceived) && (
                        <button 
                          onClick={() => onPrint(req)} 
                          className="p-2.5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 bg-white shadow-sm active:scale-90"
                        >
                          <Printer size={18} />
                        </button>
                      )}

                      {req.isReceived ? (
                        <div className="flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 px-4 py-2.5 rounded-2xl border border-green-100 uppercase italic shadow-sm">
                          <PackageCheck size={16} /> RECEIVED
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isAuthorized ? (
                            <>
                              <button 
                                onClick={() => onStatusUpdate(req.id, req.status === 'APPROVED' ? 'PENDING' : 'APPROVED')} 
                                className={`px-5 py-2.5 text-[10px] font-black rounded-xl transition-all shadow-sm uppercase italic active:scale-95 ${
                                  req.status === 'APPROVED' 
                                  ? 'bg-white text-orange-600 border border-orange-100 hover:bg-orange-50' 
                                  : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                                }`}
                              >
                                {req.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                              </button>
                              <button 
                                onClick={() => onDelete(req.id)} 
                                className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-gray-400 italic bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 tracking-widest">
                              {req.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" className="p-32 text-center text-gray-300 font-black uppercase tracking-widest italic">
                  No Procurement Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-50">
        {data.length > 0 ? data.map((req) => (
          <div key={req.id} className={`p-6 space-y-4 transition-all ${selectedIds.includes(req.id) ? 'bg-blue-50' : 'active:bg-gray-50'}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {!req.isReceived && (
                  <button onClick={() => toggleSelect(req.id)} className="mt-1">
                    {selectedIds.includes(req.id) ? <CheckSquare size={22} className="text-blue-600" /> : <Square size={22} className="text-gray-200" />}
                  </button>
                )}
                <div className="space-y-1">
                  <span className="text-blue-600 font-black text-[9px] uppercase italic bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {req.noPO || "PENDING"}
                  </span>
                  <h4 className="font-black text-gray-900 text-[15px] uppercase tracking-tight leading-tight">{req.item}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase italic tracking-tight">{req.supplier}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900 italic tracking-tighter">
                  Rp {((parseFloat(req.qty)||0) * (parseFloat(req.price)||0)).toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] font-black text-blue-600 uppercase mt-1">{req.qty} {req.unit}</p>
              </div>
            </div>

            {req.isReceived && (
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-blue-700 uppercase italic">Received By:</span>
                <span className="text-[10px] font-black text-gray-800 uppercase">{req.receipts?.[0]?.receivedBy || req.receivedBy}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {(req.status === 'APPROVED' || req.isReceived) && (
                <button onClick={() => onPrint(req)} className="flex-1 py-3 bg-white border border-blue-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase italic flex items-center justify-center gap-2">
                  <Printer size={14} /> Print
                </button>
              )}
              {isAuthorized && !req.isReceived && (
                <button 
                  onClick={() => onStatusUpdate(req.id, req.status === 'APPROVED' ? 'PENDING' : 'APPROVED')} 
                  className={`flex-[2] py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg ${
                    req.status === 'APPROVED' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-600 text-white shadow-green-200'
                  }`}
                >
                  {req.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                </button>
              )}
              <button onClick={() => onDelete(req.id)} className="p-3 bg-gray-50 text-gray-300 rounded-2xl border border-gray-100">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )) : (
          <div className="p-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest italic">
            Empty Records
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasingTable;