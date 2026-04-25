"use client";

import { useState, useEffect, useMemo } from "react";

interface CalendarViewProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  courtId: string | null;
}

interface DayAvailability {
  date: string;
  availableSlots: number;
  totalSlots: number;
}

export function CalendarView({ selectedDate, onSelectDate, courtId }: CalendarViewProps) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  const monthStart = useMemo(() => {
    return new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1));
  }, [currentViewDate]);

  const monthEnd = useMemo(() => {
    return new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0));
  }, [currentViewDate]);

  const isNextMonthAvailable = useMemo(() => {
    const now = new Date();
    const nextMonthLimit = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    return currentViewDate < nextMonthLimit;
  }, [currentViewDate]);

  const isPrevMonthAvailable = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    return currentViewDate > currentMonthStart;
  }, [currentViewDate]);

  useEffect(() => {
    if (!courtId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const month = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}`;
        const res = await fetch(`/api/courts/availability/monthly?courtId=${courtId}&month=${month}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAvailability(data);
        }
      } catch (error) {
        console.error("Failed to fetch monthly availability:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [courtId, currentViewDate]);

  const daysInMonth = monthEnd.getUTCDate();
  const firstDayOfWeek = monthStart.getUTCDay(); // 0 (Sun) to 6 (Sat)

  const calendarDays = [];
  // Padding for start of month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => {
    if (isPrevMonthAvailable) {
      setCurrentViewDate(new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1)));
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthAvailable) {
      setCurrentViewDate(new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1)));
    }
  };

  const getDayStatus = (day: number) => {
    const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const avail = availability.find(a => a.date === dateStr);
    if (!avail) return "unknown";
    
    const ratio = avail.availableSlots / avail.totalSlots;
    if (ratio === 0) return "full";
    if (ratio < 0.3) return "low";
    return "high";
  };

  const getAvailableCount = (day: number) => {
    const dateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const avail = availability.find(a => a.date === dateStr);
    return avail ? `${avail.availableSlots} / ${avail.totalSlots}` : "";
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-slate-900">
          {currentViewDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={!isPrevMonthAvailable}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <button
            onClick={handleNextMonth}
            disabled={!isNextMonthAvailable}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 relative min-h-[280px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-500">Memuat Jadwal...</span>
            </div>
          </div>
        )}
        
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          
          const date = new Date(Date.UTC(currentViewDate.getFullYear(), currentViewDate.getMonth(), day));
          const isPast = date < today;
          const isSelected = selectedDate?.getUTCDate() === day && 
                             selectedDate?.getUTCMonth() === currentViewDate.getMonth() &&
                             selectedDate?.getUTCFullYear() === currentViewDate.getFullYear();
          const isToday = today.getUTCDate() === day && 
                          today.getUTCMonth() === currentViewDate.getMonth() &&
                          today.getUTCFullYear() === currentViewDate.getFullYear();
          
          const status = getDayStatus(day);
          
          return (
            <button
              key={day}
              disabled={isPast || !courtId}
              onClick={() => onSelectDate(date)}
              className={`
                group relative flex flex-col items-center justify-center h-12 rounded-xl transition-all
                ${isPast ? "opacity-20 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                ${isSelected ? "bg-slate-900 text-white shadow-lg z-10" : "bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md"}
                ${isToday && !isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
              `}
              title={isPast ? "Masa lalu" : `Tersedia ${getAvailableCount(day)} slot`}
            >
              <span className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-900"}`}>{day}</span>
              
              {!isPast && courtId && (
                <div className="flex gap-0.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    status === "high" ? "bg-emerald-500" : 
                    status === "low" ? "bg-amber-500" : 
                    status === "full" ? "bg-red-500" : "bg-slate-300"
                  }`} />
                </div>
              )}
              
              {!isPast && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl">
                  {getAvailableCount(day)} Slot
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hampir Penuh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Penuh</span>
        </div>
      </div>
    </div>
  );
}
