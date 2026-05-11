'use client';

import React from 'react';
import { Hash, Scale, TrendingUp, Clock, PackageCheck, AlertTriangle, DollarSign } from 'lucide-react';

const fmtRp = (v) => new Intl.NumberFormat('id-ID').format(Math.round(parseFloat(v)||0));

const StatCard = ({ title, value, prefix, trend, icon, color, bgIcon, alert }) => (
  <div className="bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start group hover:shadow-md transition-all relative overflow-hidden">
    <div className="space-y-1 md:space-y-4 text-left z-10 min-w-0 flex-1">
      <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none truncate">
        {title}
      </p>
      <h3 className="text-sm md:text-2xl font-black text-gray-800 tracking-tighter truncate max-w-full">
        {prefix && <span className="text-[10px] md:text-xs mr-1 opacity-50 not-italic">{prefix}</span>}
        {value}
      </h3>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${alert ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
        <p className={`text-[8px] md:text-[10px] font-bold italic leading-none truncate ${alert ? 'text-amber-500' : 'text-green-500'}`}>
          {trend}
        </p>
      </div>
    </div>
    <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${bgIcon} ${color} absolute top-4 right-4 sm:relative sm:top-0 sm:right-0`}>
      {icon}
    </div>
  </div>
);

const CattlePurchasingStats = ({ requests = [] }) => {
  const totalPO       = requests.length;
  const pending       = requests.filter(r => r.status === 'PENDING').length;
  const approved      = requests.filter(r => r.status === 'APPROVED' && !r.isReceived).length;
  const received      = requests.filter(r => r.isReceived).length;

  const totalHead     = requests.reduce((s, r) => s + (parseInt(r.totalHeadOrdered)||0), 0);
  const totalWeight   = requests.reduce((s, r) => s + (parseFloat(r.totalWeightKg)||0), 0);

  // Nilai HPP (hanya PO yang approved/received)
  const totalHpp = requests
    .filter(r => ['APPROVED','RECEIVED'].includes(r.status))
    .reduce((s, r) => s + (parseFloat(r.hppTotal)||0), 0);

  // Nilai estimasi (harga × bobot, seluruh PO)
  const totalEstimasi = requests.reduce((s, r) => s + (parseFloat(r.totalEstimasi)||0), 0);

  const stats = [
    {
      title:   'Total Ekor Dipesan',
      value:   `${totalHead.toLocaleString('id-ID')} ekor`,
      trend:   `${totalPO} PO · ${totalWeight.toLocaleString('id-ID')} kg`,
      icon:    <Hash size={20} />,
      color:   'text-[#8da070]',
      bgIcon:  'bg-[#8da070]/10',
    },
    {
      title:   'Nilai Estimasi (All PO)',
      value:   fmtRp(totalEstimasi),
      prefix:  'Rp',
      trend:   `${approved} PO approved · ${received} received`,
      icon:    <DollarSign size={20} />,
      color:   'text-purple-500',
      bgIcon:  'bg-purple-50',
    },
    {
      title:   'Menunggu Approval',
      value:   pending.toString(),
      trend:   pending > 0 ? 'Butuh approval segera' : 'Semua terproses',
      icon:    pending > 0 ? <AlertTriangle size={20} /> : <PackageCheck size={20} />,
      color:   pending > 0 ? 'text-amber-500' : 'text-green-500',
      bgIcon:  pending > 0 ? 'bg-amber-50'    : 'bg-green-50',
      alert:   pending > 0,
    },
    {
      title:   'HPP Total (Approved)',
      value:   totalHpp >= 1_000_000_000
        ? `${(totalHpp / 1_000_000_000).toFixed(2)} M`
        : fmtRp(totalHpp),
      prefix:  'Rp',
      trend:   `${totalWeight.toLocaleString('id-ID')} kg total bobot`,
      icon:    <TrendingUp size={20} />,
      color:   'text-blue-500',
      bgIcon:  'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 print:hidden">
      {stats.map((s, i) => <StatCard key={i} {...s} />)}
    </div>
  );
};

export default CattlePurchasingStats;
