import React, {useState} from 'react';
import { 
  ShoppingCart, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  MoreVertical,
  ChevronRight,
  FileText
} from 'lucide-react';
import AddPurchasing from './AddPurchasing';

const Purchasing = () => {
  // Data Placeholder: ERP Peternakan Sapi
  const purchasingStats = [
    {
      title: "TOTAL REQUEST MADE",
      value: "142",
      trend: "↑ 12 more than last year",
      icon: <ShoppingCart className="text-blue-500" size={20} />,
      bgIcon: "bg-blue-50"
    },
    {
      title: "TOTAL COST INCURRED",
      value: "420.000.000",
      trend: "↑ Calculated monthly",
      icon: <Wallet className="text-purple-500" size={20} />,
      bgIcon: "bg-purple-50"
    },
    {
      title: "PENDING REQUEST",
      value: "8",
      trend: "↑ Action required",
      icon: <Clock className="text-orange-500" size={20} />,
      bgIcon: "bg-orange-50"
    },
    {
      title: "APPROVED REQUEST",
      value: "134",
      trend: "↑ 5% more than last year",
      icon: <CheckCircle2 className="text-green-500" size={20} />,
      bgIcon: "bg-green-50"
    }
  ];

  const recentRequests = [
    {
      sn: "01",
      item: "Pakan Konsentrat Sapi",
      qty: "50 Sacks",
      amount: "12.500.000",
      requestedBy: "Drh. Bambang",
      date: "08/01/2026",
      status: "PENDING"
    },
    {
      sn: "02",
      item: "Vaksin PMK (Dosis)",
      qty: "200 Pcs",
      amount: "45.000.000",
      requestedBy: "Siti Aminah",
      date: "07/01/2026",
      status: "PENDING"
    },
    {
      sn: "03",
      item: "Bibit Rumput Gajah",
      qty: "1000 Stek",
      amount: "5.000.000",
      requestedBy: "Budi Santoso",
      date: "05/01/2026",
      status: "APPROVED"
    },
    {
      sn: "04",
      item: "Vitamin B-Complex 100ml",
      qty: "24 Bottles",
      amount: "3.600.000",
      requestedBy: "Drh. Bambang",
      date: "02/01/2026",
      status: "APPROVED"
    }
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState(recentRequests); // Inisialisasi dengan data dummy Anda

  const handleAddRequest = (newData) => {
    setRequests([newData, ...requests]);
  };


  return (
    <div className="p-6 bg-[#f8f9fa] min-h-full space-y-8">
      
      <AddPurchasing 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      onAdd={handleAddRequest} 
    />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {purchasingStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex justify-between items-start group hover:shadow-md transition-all">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-3xl font-black text-gray-800 tracking-tight">
                {stat.value.includes('.') ? `Rp ${stat.value}` : stat.value}
              </h3>
              <p className={`text-[10px] font-bold ${stat.trend.includes('required') ? 'text-orange-500' : 'text-green-500'}`}>
                {stat.trend}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${stat.bgIcon} transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Hero Section / Banner */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tight">
            PROCUREMENT REQUEST
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Manage and track all purchase orders for farm supplies.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 font-bold text-sm">
          <Plus size={18} strokeWidth={3} />
          Make Procurement Request
        </button>
      </div>

      {/* Recent Requests Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-gray-50">
          <h3 className="font-bold text-gray-700 text-lg">Recent Requests</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">S/N</th>
                <th className="px-6 py-6">Item</th>
                <th className="px-6 py-6">Qty</th>
                <th className="px-6 py-6 text-center">Amount (Rp)</th>
                <th className="px-6 py-6 text-center">Requested By</th>
                <th className="px-6 py-6 text-center">Date</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentRequests.map((req, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-8 py-6 text-sm text-gray-400 font-medium">{req.sn}</td>
                  <td className="px-6 py-6 font-bold text-gray-800">{req.item}</td>
                  <td className="px-6 py-6 text-sm text-gray-600 font-semibold">{req.qty}</td>
                  <td className="px-6 py-6 text-sm text-gray-800 font-bold text-center">{req.amount}</td>
                  <td className="px-6 py-6 text-sm text-gray-500 font-medium text-center">{req.requestedBy}</td>
                  <td className="px-6 py-6 text-sm text-gray-400 font-medium text-center">{req.date}</td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black border ${
                      req.status === 'PENDING' 
                      ? 'bg-orange-50 text-orange-500 border-orange-100' 
                      : 'bg-green-50 text-green-500 border-green-100'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline transition-all">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;