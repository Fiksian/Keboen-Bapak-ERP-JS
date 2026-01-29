
import React from 'react';
import { Database, Trash2 } from 'lucide-react';

const InventoryTable = ({ data, onEdit, onRefresh }) => {

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'READY': return 'bg-green-50 text-green-600 border-green-100';
      case 'LIMITED': return 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse';
      case 'EMPTY': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Hapus item inventaris secara permanen?")) return;
    try {
      const res = await fetch(`/api/stock/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        alert("Gagal menghapus data.");
      }
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
            <th className="px-6 py-6">Kategori</th>
            <th className="px-6 py-6 text-center">Kuantitas</th>
            <th className="px-6 py-6 text-center">Status</th>
            <th className="px-8 py-6 text-right">Action Control</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length > 0 ? data.map((item) => {
            const status = item.status || 'READY';
            const displayName = item.name || item.item || "Unknown Item";

            return (
              <tr 
                key={item.id} 
                className={`hover:bg-blue-50/20 transition-colors group ${status === 'EMPTY' ? 'opacity-60' : ''}`}
              >
                <td className="px-8 py-6 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    status === 'EMPTY' 
                      ? 'bg-red-50 text-red-300' 
                      : 'bg-gray-50 text-gray-400 group-hover:bg-white border border-transparent group-hover:border-gray-100'
                  }`}>
                    <Database size={18} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-gray-800 uppercase tracking-tight">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      Rp {parseInt(item.price || 0).toLocaleString('id-ID')} / {item.unit}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      ID: {item.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm text-gray-500 font-bold uppercase tracking-tighter">
                  {item.category || "General"}
                </td>
                <td className="px-6 py-6 text-center font-black">
                  <span className={`text-lg ${
                    status === 'READY' ? 'text-blue-600' : status === 'LIMITED' ? 'text-orange-500' : 'text-red-500'
                  }`}>
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
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => onEdit(item)} 
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 shadow-sm shadow-blue-100 cursor-pointer"
                    >
                      Update
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="p-2 text-gray-300 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic font-bold uppercase text-xs tracking-widest">
                No inventory records found in database.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;