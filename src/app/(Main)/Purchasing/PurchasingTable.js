'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { 
  Hash, Building2, CalendarDays, User, ShieldCheck, 
  Truck, Printer, RotateCcw, Trash2, PackageCheck, Info
} from 'lucide-react';

const PurchasingTable = ({ data, onStatusUpdate, onDelete, onPrint }) => {
  const { data: session } = useSession();
  const isAuthorized = ["Admin", "Supervisor", "Test"].includes(session?.user?.role);

  return (
    <div className="w-full">
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse table-fixed lg:table-auto">
          <thead>
            <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50 bg-gray-50/30">
              <th className="px-8 py-6 w-[25%]">PO & Timeline</th>
              <th className="px-6 py-6 w-[25%]">Item Specification</th>
              <th className="px-6 py-6 w-[20%] text-center">Stakeholders</th>
              <th className="px-6 py-6 w-[15%] text-center">Subtotal</th>
              <th className="px-8 py-6 w-[15%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? data.map((req) => {
              const qtyNum = parseFloat(req.qty) || 0;
              const unitPrice = parseInt(req.price) || 0;
              const totalRow = qtyNum * unitPrice;
              const dateCreated = new Date(req.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
              });
              const receiverName = req.receipts?.[0]?.receivedBy || req.receivedBy;

              return (
                <tr key={req.id} className="hover:bg-blue-50/10 transition-colors group">
                  <td className="px-8 py-6 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-black text-blue-600 text-[11px] italic tracking-tight uppercase bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                        <Hash size={12} /> {req.noPO || "TANPA-REF"}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-gray-800 text-[11px] uppercase mt-1">
                        <Building2 size={12} className="text-gray-400 shrink-0" /> 
                        <span className="truncate">{req.supplier || "Supplier Umum"}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold italic mt-1">
                        <CalendarDays size={11} /> {dateCreated}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-6 align-middle">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-800 uppercase text-xs truncate max-w-[200px]">{req.item}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-black">
                          {qtyNum.toLocaleString('id-ID')} {req.unit || 'UNIT'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                          req.type === 'STOCKS' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-purple-600 border-purple-100 bg-purple-50'
                        }`}>
                          {req.type || 'STOCKS'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 align-middle">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <User size={10} className="text-blue-500" />
                        <span className="uppercase truncate">REQ: {req.requestedBy}</span>
                      </div>
                      {req.status !== 'PENDING' && (
                        <div className={`flex items-center gap-2 text-[9px] font-bold px-2 py-1 rounded-lg border ${
                          (req.status === 'APPROVED' || req.status === 'RECEIVED') ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                          <ShieldCheck size={10} />
                          <span className="uppercase truncate">ACC: {req.approvedBy || "Admin"}</span>
                        </div>
                      )}
                      {req.isReceived && (
                        <div className="flex items-center gap-2 text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg">
                          <Truck size={10} />
                          <span className="uppercase truncate italic">REC: {receiverName || "Gudang"}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-6 text-center align-middle">
                    <span className="text-xs font-black text-gray-800 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 whitespace-nowrap">
                      Rp {totalRow.toLocaleString('id-ID')}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      {(req.status === 'APPROVED' || req.isReceived) && (
                        <button onClick={() => onPrint(req)} className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100 bg-white">
                          <Printer size={16} />
                        </button>
                      )}
                      {req.isReceived ? (
                        <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 uppercase italic">
                          <PackageCheck size={14} /> RECEIVED
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isAuthorized ? (
                            <>
                              {req.status === 'APPROVED' ? (
                                <button onClick={() => onStatusUpdate(req.id, 'PENDING')} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-all shadow-sm">
                                  <RotateCcw size={14} strokeWidth={3} />
                                </button>
                              ) : (
                                <button onClick={() => onStatusUpdate(req.id, 'APPROVED')} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black rounded-lg transition-all shadow-sm uppercase italic">
                                  APPROVE
                                </button>
                              )}
                              <button onClick={() => onDelete(req.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] font-black uppercase text-gray-400 italic bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{req.status}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="p-20 text-center text-gray-400 italic font-bold uppercase text-[10px] tracking-widest">
                  No procurement records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-100 bg-white">
        {data.length > 0 ? data.map((req) => {
          const qtyNum = parseFloat(req.qty) || 0;
          const unitPrice = parseInt(req.price) || 0;
          const totalRow = qtyNum * unitPrice;
          const dateCreated = new Date(req.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
          });

          return (
            <div key={req.id} className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-blue-600 font-black text-[10px] uppercase italic bg-blue-50 px-2 py-0.5 rounded w-fit">
                    {req.noPO}
                  </span>
                  <h4 className="font-black text-gray-800 text-[13px] uppercase mt-1">{req.item}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{req.supplier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-blue-600 italic">Rp {totalRow.toLocaleString('id-ID')}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">{dateCreated}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => onPrint(req)} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                  <Printer size={14} /> Print
                </button>
                {isAuthorized && !req.isReceived && (
                  <button onClick={() => onStatusUpdate(req.id, req.status === 'APPROVED' ? 'PENDING' : 'APPROVED')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase ${req.status === 'APPROVED' ? 'bg-orange-50 text-orange-600' : 'bg-green-600 text-white'}`}>
                    {req.status === 'APPROVED' ? 'Revoke' : 'Approve'}
                  </button>
                )}
                <button onClick={() => onDelete(req.id)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="p-20 text-center text-gray-400 text-[10px] font-black">Empty Records</div>
        )}
      </div>
    </div>
  );
};

export default PurchasingTable;