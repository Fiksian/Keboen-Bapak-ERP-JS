'use client';

import React from 'react';
import { 
  Hash, Building2, CalendarDays, User, ShieldCheck, 
  Truck, Printer, RotateCcw, Trash2, PackageCheck 
} from 'lucide-react';

const PurchasingTable = ({ data, onStatusUpdate, onDelete, onPrint }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
            <th className="px-8 py-6">PO & Timeline</th>
            <th className="px-6 py-6">Item Specification</th>
            <th className="px-6 py-6 text-center">Stakeholders Traceability</th>
            <th className="px-6 py-6 text-center">Subtotal</th>
            <th className="px-8 py-6 text-right">Approval Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length > 0 ? data.map((req) => {
            const qtyNum = parseFloat(req.qty?.split(' ')[0]) || 0;
            const unitPrice = parseInt(req.amount) || 0;
            const totalRow = qtyNum * unitPrice;
            const dateCreated = new Date(req.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric'
            });

            const receiverName = req.receipts?.[0]?.receivedBy || req.receivedBy;

            return (
              <tr key={req.id} className="hover:bg-blue-50/10 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="flex items-center gap-1.5 font-black text-blue-600 text-[11px] italic tracking-tight uppercase bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100">
                      <Hash size={12} /> {req.noPO || "TANPA-REF"}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-gray-800 text-[11px] uppercase mt-0.5">
                      <Building2 size={12} className="text-gray-400" /> {req.supplier || "Supplier Umum"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold italic mt-1">
                      <CalendarDays size={11} /> {dateCreated}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-6 text-left">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 uppercase text-xs">{req.item}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-black">{req.qty}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                        req.type === 'STOCKS' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-purple-600 border-purple-100 bg-purple-50'
                      }`}>
                        {req.type || 'STOCKS'}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <User size={10} className="text-blue-500" />
                      <span className="uppercase truncate text-left">REQ: {req.requestedBy}</span>
                    </div>
                    {req.status !== 'PENDING' && (
                      <div className={`flex items-center gap-2 text-[9px] font-bold px-2 py-1 rounded-lg border ${
                        (req.status === 'APPROVED' || req.status === 'RECEIVED') ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        <ShieldCheck size={10} />
                        <span className="uppercase truncate text-left">
                          {(req.status === 'APPROVED' || req.status === 'RECEIVED') ? 'ACC: ' : 'REJ: '}
                          {req.approvedBy || "Admin"}
                        </span>
                      </div>
                    )}
                    {req.isReceived && (
                      <div className="flex items-center gap-2 text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg shadow-sm">
                        <Truck size={10} />
                        <span className="uppercase truncate italic text-left">REC: {receiverName || "Gudang"}</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-6 text-center">
                  <span className="text-xs font-black text-gray-800 italic bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    Rp {totalRow.toLocaleString('id-ID')}
                  </span>
                </td>

                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3 items-center">
                    {(req.status === 'APPROVED' || req.isReceived) && (
                      <button onClick={() => onPrint(req)} className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-100 cursor-pointer">
                        <Printer size={18} />
                      </button>
                    )}

                    {req.isReceived ? (
                      <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase italic">
                        <PackageCheck size={14} /> IN WAREHOUSE
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {req.status === 'APPROVED' ? (
                          <button onClick={() => onStatusUpdate(req.id, 'PENDING')} className="flex items-center gap-1.5 px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all text-[9px] font-black uppercase italic cursor-pointer shadow-sm">
                            <RotateCcw size={13} strokeWidth={3} /> REVOKE
                          </button>
                        ) : (
                          <>
                            <button onClick={() => onStatusUpdate(req.id, 'APPROVED')} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black rounded-xl transition-all shadow-md uppercase italic cursor-pointer">
                              APPROVE
                            </button>
                            <button onClick={() => onStatusUpdate(req.id, req.status === 'REJECTED' ? 'PENDING' : 'REJECTED')} className={`px-4 py-2 text-[9px] font-black rounded-xl transition-all border uppercase italic cursor-pointer ${req.status === 'REJECTED' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-white text-red-500 border-red-100 hover:bg-red-50'}`}>
                              {req.status === 'REJECTED' ? 'UNDO' : 'REJECT'}
                            </button>
                          </>
                        )}
                        <button onClick={() => onDelete(req.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">No procurement records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PurchasingTable;