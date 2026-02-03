import React from 'react';
import { ShoppingCart, Wallet, Clock, PackageCheck } from 'lucide-react';

const PurchasingStats = ({ requests }) => {
  const totalRequests = requests?.length || 0;
  const totalPending = requests?.filter(r => r?.status === 'PENDING').length || 0;
  const totalReceived = requests?.filter(r => r?.isReceived).length || 0;
  
  const totalCostValue = requests?.reduce((acc, curr) => {
    if (curr?.status !== 'APPROVED' && curr?.status !== 'RECEIVED') return acc;
    
    const qtyNum = parseFloat(curr.qty) || 0;
    const unitPrice = parseInt(curr.price) || 0;
    
    return acc + (qtyNum * unitPrice);
  }, 0) || 0;

  const stats = [
    { 
      title: "TOTAL PO", 
      value: totalRequests.toString(), 
      trend: "Semua pengajuan", 
      icon: <ShoppingCart className="text-blue-500" size={20} />, 
      bgIcon: "bg-blue-50" 
    },
    { 
      title: "APPROVED VALUE", 
      value: totalCostValue.toLocaleString('id-ID'), 
      trend: "Nilai PO valid", 
      icon: <Wallet className="text-purple-500" size={20} />, 
      bgIcon: "bg-purple-50" 
    },
    { 
      title: "WAITING", 
      value: totalPending.toString(), 
      trend: "Butuh persetujuan", 
      icon: <Clock className="text-orange-500" size={20} />, 
      bgIcon: "bg-orange-50" 
    },
    { 
      title: "RECEIVED", 
      value: totalReceived.toString(), 
      trend: "Sudah di gudang", 
      icon: <PackageCheck className="text-green-500" size={20} />, 
      bgIcon: "bg-green-50" 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-start group hover:shadow-md transition-all">
          <div className="space-y-4 text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">
              {stat.title.includes('VALUE') ? `Rp ${stat.value}` : stat.value}
            </h3>
            <p className={`text-[10px] font-bold ${stat.value !== '0' && stat.title === 'WAITING' ? 'text-orange-500' : 'text-green-500'}`}>
              {stat.trend}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${stat.bgIcon} transition-transform group-hover:scale-110`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PurchasingStats;