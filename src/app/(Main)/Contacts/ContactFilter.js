import React from 'react';
import { Search } from 'lucide-react';

const ContactFilter = ({ activeTab, setActiveTab, searchTerm, setSearchTerm }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 p-2 flex flex-col lg:flex-row gap-4 justify-between items-center">
      <div className="flex p-1 bg-gray-50 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
        {['all', 'customer', 'supplier'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 lg:flex-none px-6 md:px-8 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab 
              ? 'bg-white text-[#8da070] shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="relative w-full lg:w-96 px-2 lg:px-0">
        <Search className="absolute left-6 lg:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama, email, atau kota..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 lg:bg-transparent rounded-2xl border-none text-xs md:text-sm focus:ring-2 focus:ring-[#8da070]/20 font-black transition-all placeholder:text-gray-400 placeholder:italic"
        />
      </div>
    </div>
  );
};

export default ContactFilter;