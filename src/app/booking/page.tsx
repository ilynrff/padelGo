"use client";

import { useBooking, MOCK_COURTS, MOCK_TIME_SLOTS } from "@/hooks/useBooking";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { CourtCard } from "@/components/booking/CourtCard";
import { TimeSlot } from "@/components/booking/TimeSlot";

export default function BookingPage() {
  const {
    dates,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    checkout,
    isLoading,
    error,
    successMsg,
    isToastOpen,
    setIsToastOpen
  } = useBooking();

  return (
    <div className="flex-1 bg-slate-50 relative pb-32 pt-8">
      
      {/* Toast Feedback */}
      <Toast 
         isOpen={isToastOpen} 
         message={error || successMsg} 
         type={error ? 'error' : 'success'} 
         onClose={() => setIsToastOpen(false)} 
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-12">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">Booking</h1>
          <p className="text-slate-500 font-bold text-lg">Pilih lapangan, tentukan tanggal, lalu amankan jam mainmu.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">
          
          <div className="space-y-12 w-full">
            {/* 1. Select Court */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black">1</div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Lapangan</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {MOCK_COURTS.slice(0,2).map((court) => (
                  <CourtCard 
                    key={court.id}
                    court={court}
                    isSelected={selectedCourt === court.id}
                    onSelect={() => { setSelectedCourt(court.id); setSelectedSlot(null); }}
                  />
                ))}
              </div>
            </div>

            {/* 2. Select Date */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black">2</div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Tanggal</h2>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
                {dates.map((d, idx) => {
                  const dayStr = d.toLocaleDateString("id-ID", { weekday: 'short' });
                  const dateNum = d.getDate();
                  const isSelected = selectedDate === dateNum;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDate(dateNum); setSelectedSlot(null); }}
                      className={`flex-shrink-0 snap-start flex flex-col items-center justify-center w-[84px] h-[100px] rounded-3xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg transform -translate-y-1' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:shadow-md hover:-translate-y-1'
                      }`}
                    >
                      <span className="text-xs font-bold text-current opacity-80 uppercase tracking-widest">{dayStr}</span>
                      <span className="text-3xl font-black mt-1 text-current">{dateNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Time Slots */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black">3</div>
                <h2 className="text-xl font-bold text-slate-900">Pilih Jam Main</h2>
              </div>
              
              {!selectedCourt ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white">
                  <p className="text-slate-500 font-bold">Pilih lapangan terlebih dahulu untuk melihat jadwal.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MOCK_TIME_SLOTS.map((slot, idx) => {
                      const courtPrice = MOCK_COURTS.find(c => c.id === selectedCourt)?.price || 0;
                      return (
                        <TimeSlot 
                          key={idx}
                          time={slot.time}
                          isAvailable={slot.available}
                          isSelected={selectedSlot === slot.time}
                          price={courtPrice}
                          onSelect={() => setSelectedSlot(slot.time)}
                        />
                      )
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar / Floating on mobile */}
          <div className="hidden lg:block sticky top-24">
             <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-black text-xl mb-6">Ringkasan</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lapangan</p>
                    <p className="font-bold text-slate-900">{MOCK_COURTS.find(c => c.id === selectedCourt)?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</p>
                    <p className="font-bold text-slate-900">{selectedDate ? `${selectedDate} Bulan Ini` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jam</p>
                    <p className="font-bold text-slate-900">{selectedSlot || "-"}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 mb-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Biaya</p>
                  <p className="text-3xl font-black text-blue-600">
                    Rp {selectedSlot ? MOCK_COURTS.find(c => c.id === selectedCourt)?.price.toLocaleString('id-ID') : "0"}
                  </p>
                </div>

                <Button 
                   size="full" 
                   disabled={!selectedSlot} 
                   onClick={checkout} 
                   isLoading={isLoading}
                >
                  Konfirmasi Booking
                </Button>
             </div>
          </div>

        </div>
      </div>

      {/* 4. Sticky Checkout Bar (Mobile Only) */}
      <div className={`lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 rounded-t-3xl p-6 px-4 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] z-40 transform transition-transform duration-300 ${selectedSlot ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-slate-500 font-bold text-xs mb-1">
              {MOCK_COURTS.find(c => c.id === selectedCourt)?.name} • {selectedSlot}
            </p>
            <p className="text-2xl font-black text-blue-600">
              Rp {MOCK_COURTS.find(c => c.id === selectedCourt)?.price.toLocaleString('id-ID')}
            </p>
          </div>
          <Button size="full" onClick={checkout} isLoading={isLoading}>
            Booking Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
