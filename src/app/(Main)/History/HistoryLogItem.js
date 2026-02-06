import React from 'react';
import { ArrowUpRight, ArrowDownLeft, User, ShoppingBag, RotateCcw, Trash2, Package } from 'lucide-react';

const HistoryLogItem = ({ log }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'PENJUALAN': return <ShoppingBag size={12} className="text-orange-500" />;
      case 'PEMBATALAN': return <RotateCcw size={12} className="text-green-500" />;
      case 'PENGHAPUSAN': return <Trash2 size={12} className="text-red-500" />;
      default: return <Package size={12} className="text-blue-500" />;
    }
  };

  const isIncoming = log.type === 'INCOMING';

  return (
    <tr className="hover:bg-blue-50/10 transition-colors group block md:table-row border-b md:border-none last:border-none">
      <td className="px-6 md:px-8 py-4 md:py-6 block md:table-cell">
        <div className="flex md:flex-col justify-between items-center md:items-start">
          <span className="font-black text-gray-800 text-xs">
            {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">
            {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} WIB
          </span>
        </div>
      </td>

      <td className="px-6 md:px-6 py-2 md:py-6 block md:table-cell">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {getActionIcon(log.rawAction)}
            <span className="font-black text-gray-800 uppercase text-[11px] tracking-tight">{log.itemName}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase italic leading-tight max-w-xs">{log.description}</span>
        </div>
      </td>

      <td className="px-6 md:px-6 py-4 md:py-6 block md:table-cell text-center">
        <div className="flex md:flex-col items-center justify-between md:justify-center gap-2">
           <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center justify-center gap-1 border ${
              isIncoming ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {isIncoming ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
              {log.type}
            </span>
            <div className="flex flex-col items-end md:items-center">
              <span className={`text-sm font-black italic ${isIncoming ? 'text-blue-600' : 'text-red-500'}`}>
                {isIncoming ? '+' : '-'}{log.quantity?.toLocaleString('id-ID')}
              </span>
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">{log.unit}</span>
            </div>
        </div>
      </td>

      <td className="px-6 md:px-6 py-2 md:py-6 block md:table-cell text-center">
        <div className="flex justify-between items-center md:justify-center">
          <span className="md:hidden text-[9px] font-black text-gray-400 uppercase">User:</span>
          <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-200 w-fit">
            <User size={10} className="text-gray-500" />
            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{log.user || 'SYSTEM'}</span>
          </div>
        </div>
      </td>

      <td className="px-6 md:px-8 py-4 md:py-6 block md:table-cell text-right">
        <div className="flex justify-between items-center md:justify-end">
          <span className="md:hidden text-[9px] font-black text-gray-400 uppercase tracking-widest">Ref ID:</span>
          <span className="font-mono text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
            {log.rawAction === 'PENJUALAN' || log.rawAction === 'PEMBATALAN' ? log.referenceId : `#${log.referenceId}`}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default HistoryLogItem;