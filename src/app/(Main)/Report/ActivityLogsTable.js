import React from 'react';
import Link from 'next/link';
import { History, User, Clock, ChevronRight } from 'lucide-react';

const ActivityLogsTable = ({ logs = [], showViewAll = true }) => (
  <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-5 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
          <History size={18} />
        </div>
        <div>
          <h3 className="font-black text-gray-800 uppercase tracking-tighter md:tracking-tight text-sm md:text-base italic md:not-italic">
            System Activity Logs
          </h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest md:hidden">Recent Audit Trail</p>
        </div>
      </div>
      {showViewAll && (
        <Link 
          href="/History" 
          className="w-full sm:w-auto text-center flex items-center justify-center gap-1 text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white border border-blue-100 bg-blue-50/50 px-4 py-2.5 rounded-xl transition-all active:scale-95"
        >
          View Full Audit <ChevronRight size={14} />
        </Link>
      )}
    </div>

    <div className="w-full">
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
              <th className="px-8 py-5">Activity & Item</th>
              <th className="px-6 py-5">Category</th>
              <th className="px-6 py-5 text-center">User Trace</th>
              <th className="px-6 py-5 text-center">Timestamp</th>
              <th className="px-8 py-5 text-right">Reference Notes</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="divide-y divide-gray-50">
        {logs.length > 0 ? logs.map((log, idx) => (
          <div 
            key={idx} 
            className="group flex flex-col md:flex-row md:items-center hover:bg-blue-50/10 transition-all p-5 md:p-0"
          >
            <div className="md:table-cell md:w-[25%] md:px-8 md:py-5 text-left">
              <div className="flex flex-col">
                <span className="text-[13px] md:text-sm font-black text-gray-800 tracking-tight uppercase italic md:not-italic">
                  {log.action.replace('_', ' ')}
                </span>
                <span className="text-[9px] md:text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">
                  {log.item}
                </span>
              </div>
            </div>

            <div className="md:table-cell md:w-[15%] md:px-6 md:py-5 mt-3 md:mt-0">
              <span className="w-fit px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-tighter">
                {log.category}
              </span>
            </div>

            <div className="md:table-cell md:w-[20%] md:px-6 md:py-5 mt-4 md:mt-0">
              <div className="flex flex-row md:flex-col items-center md:items-center justify-between md:justify-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold italic">
                  <User size={12} className="text-gray-300 md:hidden" />
                  <span className="truncate max-w-[120px]">{log.user}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-400 font-medium">
                  <Clock size={12} className="text-gray-300 md:hidden" />
                  {new Date(log.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </div>
              </div>
            </div>

            <div className="md:table-cell md:w-[40%] md:px-8 md:py-5 text-left md:text-right mt-4 md:mt-0 bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
              <span className="md:hidden text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Notes:</span>
              <p className="text-[11px] text-gray-500 font-medium italic leading-relaxed md:truncate md:max-w-[300px] ml-auto">
                {log.notes || '-'}
              </p>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-40">
            <History size={40} className="text-gray-200 mb-2" />
            <p className="text-gray-400 font-black italic uppercase tracking-widest text-[10px]">No recent activities logged</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ActivityLogsTable;