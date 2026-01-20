'use client';

import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = "Search data..." }) => {
  return (
    <div className="relative w-full lg:w-96 group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400 group-focus-within:text-blue-600 transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold text-gray-700 shadow-sm shadow-gray-100"
      />
    </div>
  );
};

export default SearchInput;