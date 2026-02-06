'use client';

import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    let range = 2;
    
    const startPage = Math.max(1, currentPage - range);
    const endPage = Math.min(totalPages, startPage + (range * 2));
    const adjustedStart = Math.max(1, Math.min(startPage, totalPages - (range * 2)));

    for (let i = adjustedStart; i <= endPage; i++) {
      if (i > 0) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-white border-t border-gray-100 mt-auto gap-4">
      <div className="order-2 sm:order-1">
        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left">
          Page <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{currentPage}</span> 
          <span className="mx-1 sm:mx-2 text-slate-200">/</span> 
          Total <span className="text-slate-900">{totalPages}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-2.5 border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
        </button>

        <div className="flex items-center gap-1 mx-1 sm:mx-2">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 rounded-lg sm:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${
                currentPage === pageNum 
                  ? 'bg-indigo-600 text-white shadow-md sm:shadow-lg shadow-indigo-100' 
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
          className="p-2 sm:p-2.5 border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90"
          aria-label="Next Page"
        >
          <ChevronRight size={14} className="sm:w-4 sm:h-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default memo(Pagination);