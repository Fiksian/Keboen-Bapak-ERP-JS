import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const FinanceStats = ({ summary }) => {
  const cards = [
    { label: 'Total Saldo', value: summary.totalBalance, icon: Wallet, color: 'text-gray-900', bg: 'bg-gray-100' },
    { label: 'Pemasukan', value: summary.totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pengeluaran', value: summary.totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
      {cards.map((item, i) => (
        <div key={i} className={`bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`${item.bg} ${item.color} p-4 rounded-2xl`}><item.icon size={24} /></div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
              <p className={`text-xl md:text-2xl font-black ${item.color} tabular-nums`}>
                Rp {item.value?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceStats;