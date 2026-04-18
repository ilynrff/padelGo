"use client";

import { useState, useEffect } from "react";
import { BookingManager } from "@/components/admin/BookingManager";
import { CourtManager } from "@/components/admin/CourtManager";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"bookings" | "courts">("bookings");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setBookings(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const bookingsToday = bookings.filter(b => b.date.startsWith(todayStr)).length;
  const pendingCount = bookings.filter(b => b.status === "PENDING").length;
  const paidCount = bookings.filter(b => b.status === "CONFIRMED").length;
  const expiredCount = bookings.filter(b => b.status === "CANCELLED").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar Admin */}
      <div className="bg-slate-900 text-white sticky top-0 z-[50]">
         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <span className="bg-blue-600 px-3 py-1 rounded-md font-black text-xs uppercase tracking-widest">Admin PadelGo</span>
              <h1 className="font-bold hidden md:block">Management Dashboard</h1>
           </div>
           <div className="flex items-center gap-4 text-sm font-bold opacity-80">
              User: Superadmin
           </div>
         </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-20">
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hari Ini</p>
              <p className="text-3xl font-black text-slate-900">{bookingsToday}</p>
           </div>
           <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Needs Action / Pending</p>
              <p className="text-3xl font-black text-orange-700">{pendingCount}</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Paid / Selesai</p>
              <p className="text-3xl font-black text-emerald-600">{paidCount}</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expired / Batal</p>
              <p className="text-3xl font-black text-red-600">{expiredCount}</p>
           </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 hide-scrollbar overflow-x-auto">
           <button 
             className={`px-6 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === 'bookings' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
             onClick={() => setActiveTab("bookings")}
           >
             Kelola Booking
           </button>
           <button 
             className={`px-6 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === 'courts' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
             onClick={() => setActiveTab("courts")}
           >
             Setelan Lapangan
           </button>
        </div>

        {/* TAB CONTENT */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           {activeTab === "bookings" && <BookingManager />}
           {activeTab === "courts" && <CourtManager />}
        </div>
      </div>
    </div>
  );
}
