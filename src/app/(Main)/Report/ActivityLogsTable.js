import React from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';

const ActivityLogsTable = ({ logs = [], showViewAll = true }) => (
  <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
      <div className="flex items-center gap-3">
        <History size={20} className="text-blue-600" />
        <h3 className="font-bold text-gray-700 uppercase tracking-tight">Recent System Logs</h3>
      </div>
      {showViewAll && (
        <Link href="/History" className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
          Lihat Semua Audit
        </Link>
      )}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
            <th className="px-8 py-5">Activity</th>
            <th className="px-6 py-5">Category</th>
            <th className="px-6 py-5 text-center">User</th>
            <th className="px-6 py-5 text-center">Date</th>
            <th className="px-8 py-5 text-right">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map((log, idx) => (
            <tr key={idx} className="group hover:bg-blue-50/20 transition-all">
              <td className="px-8 py-5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800 tracking-tight">{log.action.replace('_', ' ')}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{log.item}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase">
                    {log.category}
                </span>
              </td>
              <td className="px-6 py-5 text-sm text-gray-700 font-bold text-center italic">{log.user}</td>
              <td className="px-6 py-5 text-xs text-gray-400 font-medium text-center">
                {new Date(log.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
              </td>
              <td className="px-8 py-5 text-right text-[11px] text-gray-500 font-medium max-w-[200px] truncate">
                {log.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ActivityLogsTable;