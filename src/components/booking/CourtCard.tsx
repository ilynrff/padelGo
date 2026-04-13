import React from 'react';

interface CourtCardProps {
  court: { id: number; name: string; location: string; price: number };
  isSelected: boolean;
  onSelect: () => void;
}

export function CourtCard({ court, isSelected, onSelect }: CourtCardProps) {
  return (
    <div 
      onClick={onSelect}
      className={`bg-white rounded-[2rem] p-5 border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? 'border-blue-600 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.25)] transform -translate-y-1.5' 
          : 'border-slate-100 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      <div className="h-32 bg-slate-200 rounded-2xl mb-5 w-full flex flex-col justify-end p-3 relative overflow-hidden">
         {/* Decorative gradient for dummy img */}
         <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-200"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
         <span className="relative text-white font-bold text-xs bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg w-max tracking-wide">
           {court.location}
         </span>
      </div>
      <h3 className={`font-black text-xl mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{court.name}</h3>
      <p className="text-sm font-bold text-slate-500">Rp {court.price.toLocaleString('id-ID')} / jam</p>
    </div>
  );
}
