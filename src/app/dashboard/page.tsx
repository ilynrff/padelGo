"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// Dummy realistic data
const MOCK_ACTIVE = [
  { id: "BKG-101", court: "Indoor Panoramic Court A", location: "Surabaya", date: "15 May 2026", time: "19:00 - 20:00", status: "PENDING" as const, total: 350000 },
];

const MOCK_HISTORY = [
  { id: "BKG-098", court: "Outdoor Classic Court", date: "10 May 2026", time: "08:00 - 10:00", status: "CONFIRMED", total: 400000 },
  { id: "BKG-082", court: "Indoor Panoramic Court B", date: "01 May 2026", time: "16:00 - 17:00", status: "CONFIRMED", total: 300000 },
];

// Sub-komponen pintar untuk memisahkan logic penundaan
function ActiveBookingCard({ booking }: { booking: any }) {
  // Simulasi 1 menit tersisa (60 detik) untuk keperluan demo agar user cepat lihat expired state
  const [timeLeft, setTimeLeft] = useState(60 * 15); // Format asli 15 min 
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (isExpired) {
    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-[2rem] p-6 shadow-none flex items-start gap-5 animate-in fade-in duration-500">
        <div className="hidden md:flex w-12 h-12 bg-slate-200 rounded-full items-center justify-center text-slate-500 font-bold shrink-0">X</div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-black bg-slate-200 text-slate-500 tracking-widest">Batalkan Otomatis (Expired)</span>
            <span className="text-xs font-bold text-slate-400">ID: {booking.id}</span>
          </div>
          <h3 className="text-xl font-black text-slate-400 line-through decoration-slate-300">{booking.court}</h3>
          <p className="text-slate-400 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
          <div className="p-3 bg-red-50 rounded-xl mt-4 border border-red-100">
            <p className="text-xs md:text-sm font-bold text-red-500">Waktu konfirmasi pembayaran telah melebihi batas 15 menit. Sistem melepaskan reservasi ini kepada pelanggan lain.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-amber-200 hover:border-amber-400 transition-colors rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Badge status="PENDING" />
          <span className="text-sm font-bold text-slate-400">Order ID: {booking.id}</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{booking.court}</h3>
        <p className="text-slate-500 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        <p className="text-blue-600 font-black mt-3 text-xl">Rp {booking.total.toLocaleString('id-ID')}</p>
      </div>
      
      <div className="w-full md:w-auto flex flex-col gap-3 items-end">
        {/* EXPIRED TIMER FEATURE */}
        <div className="flex items-center bg-red-50 px-4 py-2 rounded-xl border border-red-200 gap-2 w-full md:w-auto justify-center shadow-inner">
           <svg className="w-4 h-4 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           <span className="text-sm font-bold text-red-600 tabular-nums">
             Sisa Waktu: {mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}
           </span>
        </div>

        <Button className="w-full md:w-auto h-12 px-8 shadow-md">
           Upload Bukti Transfer
        </Button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  useEffect(() => {
    // Simulasi memuat data dari backend
    const fetchDashboard = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 800));
      setActiveBookings(MOCK_ACTIVE);
      setIsLoading(false);
    };
    fetchDashboard();
  }, []);

  return (
    <div className="flex-1 bg-slate-50 p-6 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">My Dashboard</h1>
          <p className="text-slate-500 font-bold">Manage your padel bookings and payments.</p>
        </header>

        {/* Action Required Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-slate-900">Action Required</h2>
          </div>
          
          {isLoading ? (
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
               <div className="w-full">
                  <div className="h-6 bg-slate-200 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-48 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-32"></div>
               </div>
               <div className="h-12 bg-slate-200 rounded-2xl w-full md:w-48 mt-4 md:mt-0"></div>
            </div>
          ) : activeBookings.length > 0 ? (
            <div className="space-y-4">
              {activeBookings.map((b) => (
                <ActiveBookingCard key={b.id} booking={b} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-16 px-6 relative overflow-hidden">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                 <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10">Belum ada booking aktif</h3>
              <p className="text-slate-500 font-medium mb-6 relative z-10">Kamu belum memiliki jadwal main yang perlu dibayar ataupun konfirmasi bermain.</p>
              <Button onClick={() => window.location.href = '/booking'} className="relative z-10">Cari Lapangan Rekomendasi</Button>
            </div>
          )}
        </section>

        {/* History Section Table */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">History Booking</h2>
          {isLoading ? (
             <div className="bg-white border text-center border-slate-100 rounded-[2rem] h-64 animate-pulse"></div>
          ) : (
            <Card className="p-0 overflow-hidden border-2 rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b-2 border-slate-100">
                    <tr>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">ID Booking</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Lapangan</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tanggal & Jam</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tagihan</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-50">
                    {MOCK_HISTORY.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 px-6 font-black text-sm text-slate-900">{item.id}</td>
                        <td className="p-4 px-6 font-bold text-sm text-slate-700">{item.court}</td>
                        <td className="p-4 px-6 font-medium text-sm text-slate-500">{item.date}, {item.time}</td>
                        <td className="p-4 px-6 font-black text-sm text-blue-600">Rp {item.total.toLocaleString('id-ID')}</td>
                        <td className="p-4 px-6"><Badge status="AVAILABLE" textOverride="Selesai Dimainkan" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

      </div>
    </div>
  );
}
