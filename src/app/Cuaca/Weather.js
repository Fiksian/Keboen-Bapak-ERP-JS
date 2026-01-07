import React from 'react'

const Weather = () => {
  return (
    <div className="w-full bg-gray-50 min-h-full p-5 md:p-10 lg:p-20">
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm p-4 md:p-8 w-full max-w-7xl mx-auto border border-gray-500/30">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Cuaca</h2>
        </div>

      </div>
    </div>  )
}

export default Weather