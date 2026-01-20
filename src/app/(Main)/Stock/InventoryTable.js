import React from 'react';
import { Database, Trash2 } from 'lucide-react';

const InventoryTable = ({ data, onEdit, onRefresh }) => {

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'READY': return 'bg-green-50 text-green-600 border-green-100';
      case 'LIMITED': return 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse';
      case 'SOLD OUT': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Hapus item inventaris secara permanen?")) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
            <th className="px-8 py-6">Logistik & Bahan</th>
            <th className="px-6 py-6 text-center">Jumlah</th>
            <th className="px-6 py-6 text-center">Status (DB Sync)</th>
            <th className="px-8 py-6 text-right">Manajemen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length > 0 ? data.map((item) => {
            const status = item.status || 'READY';

            return (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                    <Database size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 uppercase tracking-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center font-black">
                  <span className={`text-lg ${status === 'READY' ? 'text-blue-600' : status === 'LIMITED' ? 'text-orange-500' : 'text-red-500'}`}>
                    {item.stock}
                  </span> 
                  <span className="ml-1 text-[10px] text-gray-400 uppercase font-black">{item.unit}</span>
                </td>
                <td className="px-6 py-6 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase ${getStatusStyle(status)}`}>
                    {status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <button 
                      onClick={() => onEdit(item)} 
                      className="px-5 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                      Edit Alat
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="4" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">
                No inventory registered in database.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;