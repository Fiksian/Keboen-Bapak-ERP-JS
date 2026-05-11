import React from 'react';
import { ShoppingCart, Wallet, Clock, PackageCheck } from 'lucide-react';

const PurchasingStats = ({ requests }) => {
  const totalRequests = requests?.length || 0;
  const totalPending = requests?.filter(r => r?.status === 'PENDING').length || 0;
  const totalReceived = requests?.filter(r => r?.isReceived).length || 0;
  
  const totalCostValue = requests?.reduce((acc, curr) => {
    if (curr?.status !== 'APPROVED' && curr?.status !== 'RECEIVED' && curr?.status !== 'COMPLETED') return acc;
    
    const qtyNum = parseFloat(curr.qty) || 0;
    const unitPrice = parseInt(curr.price) || 0;
    
    return acc + (qtyNum * unitPrice);
  }, 0) || 0;

  const stats = [
    { 
      title: "TOTAL PO", 
      value: totalRequests.toString(), 
      trend: "Semua pengajuan", 
      icon: <ShoppingCart size={20} />, 
      color: "text-blue-500",
      bgIcon: "bg-blue-50" 
    },
    { 
      title: "APPROVED VALUE", 
      value: totalCostValue.toLocaleString('id-ID'), 
      trend: "Nilai PO valid", 
      icon: <Wallet size={20} />, 
      color: "text-purple-500",
      bgIcon: "bg-purple-50" 
    },
    { 
      title: "WAITING", 
      value: totalPending.toString(), 
      trend: "Butuh approval", 
      icon: <Clock size={20} />, 
      color: "text-orange-500",
      bgIcon: "bg-orange-50" 
    },
    { 
      title: "RECEIVED", 
      value: totalReceived.toString(), 
      trend: "Sudah di gudang", 
      icon: <PackageCheck size={20} />, 
      color: "text-green-500",
      bgIcon: "bg-green-50" 
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 print:hidden">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start group hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="space-y-1 md:space-y-4 text-left z-10">
            <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">
              {stat.title}
            </p>
            
            <div className="flex flex-col">
               <h3 className="text-sm md:text-2xl font-black text-gray-800 tracking-tighter truncate max-w-full">
                {stat.title.includes('VALUE') ? (
                  <span className="flex flex-col sm:flex-row sm:items-baseline">
                    <span className="text-[10px] md:text-xs mr-1 opacity-50 not-italic">Rp</span>
                    {stat.value}
                  </span>
                ) : stat.value}
              </h3>
            </div>

            <p className={`text-[8px] md:text-[10px] font-bold italic leading-none truncate ${
              stat.value !== '0' && stat.title === 'WAITING' ? 'text-orange-500' : 'text-green-500'
            }`}>
              {stat.trend}
            </p>
          </div>

          <div className={`
            p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 transition-transform group-hover:scale-110
            ${stat.bgIcon} ${stat.color}
            absolute top-4 right-4 sm:relative sm:top-0 sm:right-0
          `}>
            {React.cloneElement(stat.icon, { 
              size: typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 20 
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PurchasingStats;