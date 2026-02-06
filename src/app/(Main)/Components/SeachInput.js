'use client';

import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = "Search data..." }) => {
  return (
    <div className="relative w-full md:max-w-xs lg:max-w-md group transition-all duration-300">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
        <Search 
          size={18} 
          className="text-gray-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all duration-300" 
        />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-white border border-gray-100 md:border-gray-200 rounded-xl md:rounded-2xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100/30 transition-all text-sm font-bold text-gray-700 shadow-sm hover:shadow-md placeholder:text-gray-300 placeholder:font-medium"
      />

      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500 transition-colors"
        >
          <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 px-1.5 py-0.5 rounded-md">Esc</span>
        </button>
      )}
    </div>
  );
};

export default SearchInput;