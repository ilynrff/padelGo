"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";

// --- DUMMY DATA ---
const MOCK_ACTIVE = [
  { id: "BKG-101", court: "Indoor Panoramic Court A", location: "Semarang", date: "15 May 2026", time: "19:00 - 20:00", status: "PENDING", total: 350000, duration: 2 },
];

const MOCK_HISTORY = [
  { id: "BKG-098", court: "Outdoor Classic Court", date: "10 May 2026", time: "08:00 - 10:00", status: "SELESAI", total: 400000, duration: 2 },
  { id: "BKG-082", court: "Indoor Panoramic Court B", date: "01 May 2026", time: "16:00 - 17:00", status: "EXPIRED", total: 300000, duration: 1 },
  { id: "BKG-075", court: "Padel Court A (Premium)", date: "20 Apr 2026", time: "20:00 - 22:00", status: "SELESAI", total: 300000, duration: 2 },
];

// --- COMPONENT: STATUS BADGE ---
function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Menunggu Pembayaran</span>;
  if (status === "SELESAI" || status === "CONFIRMED") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Selesai</span>;
  if (status === "EXPIRED") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Kedaluwarsa</span>;
  return null;
}

// --- COMPONENT: ACTIVE BOOKING CARD (ACTION REQUIRED) ---
function ActiveBookingCard({ booking, onUploadClick }: { booking: any, onUploadClick: () => void }) {
  const TOTAL_TIME = 15 * 60; // 15 menit
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progressPercent = (timeLeft / TOTAL_TIME) * 100;

  if (isExpired) {
    return (
      <div className="bg-red-50/50 border-2 border-red-100 rounded-[2rem] p-6 shadow-sm flex items-start gap-4 animate-in fade-in duration-500">
        <div className="hidden md:flex w-12 h-12 bg-red-100 rounded-full items-center justify-center text-red-500 font-bold shrink-0">✕</div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-black bg-red-200 text-red-700 tracking-widest">Dibatalkan (Expired)</span>
            <span className="text-xs font-bold text-slate-400">ID: {booking.id}</span>
          </div>
          <h3 className="text-xl font-black text-slate-400 line-through decoration-slate-300">{booking.court}</h3>
          <p className="text-slate-400 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 transition-colors rounded-[2rem] p-6 md:p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group relative overflow-hidden">
      {/* Dekorasi blur di background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-10 w-full md:w-auto flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Badge textOverride="⚠️ Action Required" className="bg-orange-600 text-white border-0 shadow-sm" />
          <span className="text-sm font-bold text-orange-400">Order ID: {booking.id}</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-orange-700 transition-colors">{booking.court}</h3>
        <p className="text-slate-600 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        <p className="text-orange-600 font-black mt-3 text-2xl">Rp {booking.total.toLocaleString('id-ID')}</p>
      </div>
      
      <div className="w-full md:w-[320px] flex flex-col gap-4 relative z-10 shrink-0">
        {/* INTERAKTIF COUNTDOWN */}
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-1.5 text-orange-600 font-black text-sm">
               <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Segera Lakukan Pembayaran
             </div>
             <span className="text-sm font-bold text-slate-900 tabular-nums">{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</span>
           </div>
           {/* Progress Bar */}
           <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
             <div className={`h-full rounded-full transition-all duration-1000 ${progressPercent < 20 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>

        <Button onClick={onUploadClick} className="w-full h-12 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(249,115,22,0.5)] bg-orange-600 hover:bg-orange-700 text-white border-0 transition-all active:scale-95">
           Upload Bukti Transfer
        </Button>
      </div>
    </div>
  )
}

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("SEMUA");
  const [selectedBooking, setSelectedBooking] = useState<any>(null); // For detail modal
  const [toastQueue, setToastQueue] = useState<{msg: string, type: 'success'|'error'}[]>([]);

  useEffect(() => {
    // Simulasi memuat data
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  const totalBooking = MOCK_HISTORY.length + MOCK_ACTIVE.length;
  const activeCount = MOCK_ACTIVE.length;
  const totalSpent = MOCK_HISTORY.filter(h => h.status === "SELESAI").reduce((acc, curr) => acc + curr.total, 0);

  const filteredHistory = MOCK_HISTORY.filter(h => {
    if (filter === "SEMUA") return true;
    return h.status === filter;
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastQueue(prev => [...prev, { msg, type }]);
    setTimeout(() => setToastQueue(prev => prev.slice(1)), 3000);
  };

  const handleUploadClick = () => {
    // Simulate upload
    setTimeout(() => showToast("Bukti transfer berhasil diunggah! Menunggu verifikasi admin.", "success"), 500);
  };

  const handleRebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = '/booking'; 
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 min-h-[calc(100vh-64px)] relative">
      
      {/* Toast System */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
        {toastQueue.map((t, idx) => (
          <Toast key={idx} isOpen={true} message={t.msg} type={t.type} onClose={() => {}} />
        ))}
      </div>

      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        
        <header>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 font-bold">Manage your padel bookings and payments.</p>
        </header>

        {/* 1. MINI STATS 🔥 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Booking</p>
             <p className="text-3xl font-black text-slate-900">{totalBooking}</p>
           </div>
           <div className="bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Booking Aktif</p>
             <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-slate-900">{activeCount}</p>
                {activeCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>}
             </div>
           </div>
           <div className="col-span-2 md:col-span-1 bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
             <p className="text-3xl font-black text-blue-600">Rp {(totalSpent / 1000000).toFixed(1)} JT</p>
           </div>
        </div>

        {/* 2. ACTION REQUIRED SECTION */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
            Belum Dibayar
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{activeCount}</span>
          </h2>
          
          {isLoading ? (
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
               <div className="w-full">
                  <div className="h-6 bg-slate-200 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-48 mb-4"></div>
               </div>
               <div className="h-12 bg-slate-200 rounded-2xl w-full md:w-48 mt-4 md:mt-0"></div>
            </div>
          ) : MOCK_ACTIVE.length > 0 ? (
            <div className="space-y-4">
              {MOCK_ACTIVE.map((b) => (
                <ActiveBookingCard key={b.id} booking={b} onUploadClick={handleUploadClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-12 px-6">
              <h3 className="text-lg font-black text-slate-400 mb-2">Semua lunas! 🎉</h3>
              <p className="text-slate-400 font-medium text-sm">Tidak ada tagihan yang tertunda.</p>
            </div>
          )}
        </section>

        {/* 3. HISTORY SECTION with FILTER */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-900">Riwayat Booking</h2>
            
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-auto overflow-x-auto hide-scrollbar">
              {["SEMUA", "SELESAI", "PENDING", "EXPIRED"].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {f === "SEMUA" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
             <div className="bg-white border text-center border-slate-100 rounded-[2rem] h-64 animate-pulse"></div>
          ) : (
             <div className="grid grid-cols-1 gap-4">
               {/* Mobile: Cards | Desktop: Cards behaves like Table Rows via CSS */}
               {filteredHistory.map((item) => (
                 <div 
                   key={item.id} 
                   onClick={() => setSelectedBooking(item)}
                   className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-[1.5rem] md:rounded-full p-5 md:py-4 md:px-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
                 >
                    <div className="bg-slate-100 text-slate-500 font-black text-xs px-3 py-1.5 rounded-full shrink-0">
                      {item.id}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg md:text-base">{item.court}</h4>
                      <p className="text-slate-500 font-medium text-sm md:text-xs mt-0.5">{item.date} • {item.time}</p>
                    </div>

                    <div className="font-black text-slate-900 text-lg md:text-base w-full md:w-auto flex justify-between md:block items-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                      Rp {item.total.toLocaleString('id-ID')}
                    </div>

                    <div className="shrink-0 hidden md:block w-40 text-right">
                       <StatusBadge status={item.status} />
                    </div>

                    {/* Action on absolute right for desktop, bottom for mobile */}
                    <div className="w-full md:w-auto shrink-0 flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0">
                      <div className="md:hidden">
                        <StatusBadge status={item.status} />
                      </div>
                      <Button onClick={handleRebook} size="sm" variant="secondary" className="whitespace-nowrap px-4 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 border border-slate-200">
                         Book Again
                      </Button>
                    </div>
                 </div>
               ))}
               
               {filteredHistory.length === 0 && (
                 <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold mb-2">Tidak ada data history.</p>
                 </div>
               )}
             </div>
          )}
        </section>

      </div>

      {/* 4. DETAIL MODAL DIALOG 🔥 */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="bg-slate-900 p-6 flex justify-between items-start relative">
               <div>
                  <div className="bg-white/20 text-white backdrop-blur-md px-3 py-1 text-xs font-bold rounded-full mb-3 inline-block">
                    {selectedBooking.id}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight mb-1">{selectedBooking.court}</h3>
                  <p className="text-slate-400 font-medium text-sm">{selectedBooking.date} • {selectedBooking.time}</p>
               </div>
               <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">✕</button>
            </div>

            <div className="p-6">
               {/* Timeline Status */}
               <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Status Timeline</h4>
                 <div className="flex gap-3 relative">
                    <div className="absolute top-[10px] left-[10px] bottom-[10px] w-0.5 bg-emerald-200 -z-0"></div>
                    <div className="flex flex-col gap-4 z-10 w-full">
                       {/* Dibuat */}
                       <div className="flex gap-4 items-center">
                         <div className="w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm shrink-0"></div>
                         <div className="flex justify-between w-full items-center">
                           <span className="text-sm font-bold text-slate-900">Booking Dibuat</span>
                           <span className="text-xs font-bold text-slate-400">10 Mei 14:00</span>
                         </div>
                       </div>
                       {/* Bayar */}
                       <div className="flex gap-4 items-center opacity-100">
                         <div className="w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm shrink-0"></div>
                         <div className="flex justify-between w-full items-center">
                           <span className="text-sm font-bold text-slate-900">Pembayaran Selesai</span>
                           <span className="text-xs font-bold text-slate-400">10 Mei 14:05</span>
                         </div>
                       </div>
                       {/* Confirmed */}
                       <div className={`flex gap-4 items-center ${selectedBooking.status === "SELESAI" ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                         <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm shrink-0 ${selectedBooking.status === "SELESAI" ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                         <div className="flex justify-between w-full items-center">
                           <span className="text-sm font-bold text-slate-900">{selectedBooking.status === "SELESAI" ? "Match Selesai" : "Batal/Kedaluwarsa"}</span>
                         </div>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Info Lengkap */}
               <div className="space-y-3 mb-8 px-2">
                 <div className="flex justify-between">
                   <span className="text-slate-500 font-medium text-sm">Durasi Bermain</span>
                   <span className="font-bold text-slate-900 text-sm">{selectedBooking.duration} Jam</span>
                 </div>
                 <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                   <span className="font-bold text-slate-900">Total Dibayar</span>
                   <span className="text-xl font-black text-blue-600">Rp {selectedBooking.total.toLocaleString('id-ID')}</span>
                 </div>
               </div>

               {/* Actions */}
               <div className="flex gap-3">
                 <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-slate-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download Invoice
                 </Button>
                 <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={handleRebook}>Book Again</Button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
