'use client';

import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-8 py-6 bg-white border-t border-gray-100 mt-auto">
      <div className="hidden sm:block">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Viewing Page <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{currentPage}</span> 
          <span className="mx-2 text-slate-200">/</span> 
          Total <span className="text-slate-900">{totalPages}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
        >
          <ChevronLeft size={16} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[36px] h-9 rounded-xl text-[10px] font-black transition-all ${
                currentPage === pageNum 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
        >
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default memo(Pagination);