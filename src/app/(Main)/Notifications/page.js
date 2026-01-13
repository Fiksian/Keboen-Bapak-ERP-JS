'use client'

import { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Settings, 
  Clock, 
  MoreVertical,
  Thermometer,
  Droplet,

} from 'lucide-react';

const Notifications = () => {
  // Data Dummy Notifikasi Peternakan & Hidroponik
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'ALERT',
      title: 'Suhu Air Melebihi Batas',
      message: 'Suhu air pada Pot A - Selada mencapai 28.5°C. Segera nyalakan sistem pendingin.',
      time: '2 menit yang lalu',
      read: false,
      category: 'System',
      icon: <Thermometer size={20} />,
      color: 'text-red-500',
      bg: 'bg-red-50'
    },
    {
      id: 2,
      type: 'INFO',
      title: 'Pemberian Nutrisi Berhasil',
      message: 'Dosing otomatis untuk Kandang A telah selesai dilaksanakan oleh sistem.',
      time: '1 jam yang lalu',
      read: false,
      category: 'Automation',
      icon: <Droplet size={20} />,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'WARNING',
      title: 'Stok Pakan Rendah',
      message: 'Stok pakan konsentrat sisa 50kg. Segera lakukan pemesanan ulang (Purchasing).',
      time: '3 jam yang lalu',
      read: true,
      category: 'Inventory',
      icon: <AlertTriangle size={20} />,
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    },
    {
      id: 4,
      type: 'UPDATE',
      title: 'Vaksinasi Sapi Selesai',
      message: 'Drh. Bambang telah memperbarui status kesehatan untuk 10 ekor sapi Limousin.',
      time: 'Kemarin, 14:20',
      read: true,
      category: 'Staff',
      icon: <CheckCheck size={20} />,
      color: 'text-green-500',
      bg: 'bg-green-50'
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
              NOTIFICATIONS Center
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1 font-medium">Pantau aktivitas sistem dan pembaruan penting di peternakan Anda.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <CheckCheck size={16} className="text-green-500" />
            Tandai Semua Dibaca
          </button>
          <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Notification List Container */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Filter Bar */}
        <div className="px-8 py-4 border-b border-gray-50 flex gap-6">
          <button className="text-xs font-black text-blue-600 border-b-2 border-blue-600 pb-1">SEMUA</button>
          <button className="text-xs font-bold text-gray-400 hover:text-gray-600 pb-1 transition-colors">BELUM DIBACA</button>
          <button className="text-xs font-bold text-gray-400 hover:text-gray-600 pb-1 transition-colors">PENTING</button>
        </div>

        <div className="divide-y divide-gray-50">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-6 md:p-8 flex items-start gap-6 transition-all hover:bg-gray-50/50 group relative ${!notif.read ? 'bg-blue-50/20' : ''}`}
              >
                {/* Dot status untuk notifikasi baru */}
                {!notif.read && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  </div>
                )}

                {/* Icon Column */}
                <div className={`p-4 rounded-2xl ${notif.bg} ${notif.color} shrink-0`}>
                  {notif.icon}
                </div>

                {/* Content Column */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border border-current opacity-70 ${notif.color}`}>
                        {notif.type}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {notif.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {notif.time}
                    </span>
                  </div>
                  
                  <h3 className={`text-base font-bold transition-all ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                    {notif.message}
                  </p>
                </div>

                {/* Action Column */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2 text-gray-300 hover:text-blue-500 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                <Bell size={40} />
              </div>
              <p className="text-gray-400 font-bold">Tidak ada notifikasi baru untuk saat ini.</p>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-gray-50/50 text-center">
          <button className="text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-all">
            Lihat Riwayat Notifikasi Lama
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;