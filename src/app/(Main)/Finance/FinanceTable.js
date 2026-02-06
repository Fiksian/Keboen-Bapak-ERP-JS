import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Receipt, Eye, Trash2 } from 'lucide-react';

const FinanceTable = ({ trx, activeMenu, setActiveMenu, onOpenDetail, onDelete, menuRef }) => {
  const isIncome = trx.type === 'INCOME';

  return (
    <tr className="hover:bg-gray-50/30 transition-colors group block md:table-row border-b md:border-none">
      <td className="px-6 md:px-8 py-5 block md:table-cell">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isIncome ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-none mb-1">{trx.category}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              {new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </td>
      
      <td className="px-6 md:px-8 py-2 md:py-5 text-sm font-bold text-gray-600 block md:table-cell">
        <div className="flex flex-col">
           <span className="md:hidden text-[9px] uppercase text-gray-400 font-black">Keterangan:</span>
           {trx.description || '-'}
           <p className="text-[11px] text-[#8da070] font-black mt-1 uppercase italic tracking-tighter">{trx.trxNo}</p>
        </div>
      </td>

      <td className={`px-6 md:px-8 py-2 md:py-5 text-sm font-black text-left md:text-right block md:table-cell ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
        <div className="flex flex-col md:block">
           <span className="md:hidden text-[9px] uppercase text-gray-400 font-black">Jumlah:</span>
           {isIncome ? '+' : '-'} Rp {Math.abs(trx.amount).toLocaleString('id-ID')}
        </div>
      </td>

      <td className="px-6 md:px-8 py-5 text-center relative block md:table-cell">
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === trx.id ? null : trx.id); }}
          className={`p-2 w-full md:w-auto flex justify-center items-center rounded-xl transition-all border ${activeMenu === trx.id ? 'bg-[#8da070] text-white' : 'bg-white text-gray-400 shadow-sm border-gray-100 hover:border-[#8da070]'}`}
        >
          <Receipt size={18} />
          <span className="md:hidden ml-2 font-black text-[10px] uppercase">Opsi Transaksi</span>
        </button>

        {activeMenu === trx.id && (
          <div ref={menuRef} className="absolute right-6 md:right-12 top-0 md:top-1/2 -translate-y-1/2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => onOpenDetail(trx)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50 flex items-center gap-3 uppercase tracking-wider"><Eye size={16} className="text-blue-500" /> Detail</button>
            <button onClick={() => onDelete(trx.id)} className="w-full text-left px-4 py-2.5 text-[11px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase tracking-wider"><Trash2 size={16} /> Hapus</button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default FinanceTable;