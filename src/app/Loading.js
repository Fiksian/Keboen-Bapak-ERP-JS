'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        <div className="absolute h-24 w-24 animate-ping rounded-full bg-[#8da070]/10"></div>
        
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-2xl border border-gray-100">
          <Loader2 
            className="animate-spin text-[#8da070]" 
            size={40} 
            strokeWidth={1.5} 
          />
        </div>

        <div className="mt-6 flex flex-col items-center gap-1">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">
            Keboen Bapak
          </h2>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8da070] [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8da070] [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8da070]"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;