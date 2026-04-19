"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingManager } from "@/components/admin/BookingManager";
import { CourtManager } from "@/components/admin/CourtManager";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  user?: { name?: string };
  court?: { name?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const role = session?.user.role;
  const isAdmin = role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"bookings" | "courts">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setIsLoading(true);
    fetchJson<Booking[]>("/api/bookings")
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const bookingsToday = useMemo(
    () => bookings.filter((b) => String(b.date).slice(0, 10) === todayStr).length,
    [bookings, todayStr],
  );
  const pendingCount = useMemo(() => bookings.filter((b) => b.status === "PENDING").length, [bookings]);
  const confirmedCount = useMemo(() => bookings.filter((b) => b.status === "CONFIRMED").length, [bookings]);
  const cancelledCount = useMemo(() => bookings.filter((b) => b.status === "CANCELLED").length, [bookings]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="animate-pulse w-full max-w-2xl h-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg p-8 rounded-[2rem] shadow-xl">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Admin</h1>
          <p className="text-slate-500 font-medium mb-6">Silakan login sebagai admin.</p>
          <Link href="/login">
            <Button size="full">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg p-8 rounded-[2rem] shadow-xl">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Forbidden</h1>
          <p className="text-slate-500 font-medium mb-6">Akun kamu bukan admin.</p>
          <Link href="/dashboard">
            <Button size="full">Kembali</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900 text-white sticky top-0 z-[50]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="bg-blue-600 px-3 py-1 rounded-md font-black text-xs uppercase tracking-widest">
              Admin PadelGo
            </span>
            <h1 className="font-bold hidden md:block">Management Dashboard</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold opacity-80">
            User: {session?.user.name || "Admin"}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hari Ini</p>
            <p className="text-3xl font-black text-slate-900">{bookingsToday}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-3xl font-black text-orange-700">{pendingCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmed</p>
            <p className="text-3xl font-black text-emerald-600">{confirmedCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-red-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cancelled</p>
            <p className="text-3xl font-black text-red-600">{cancelledCount}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200 hide-scrollbar overflow-x-auto">
          <button
            className={`px-6 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "bookings" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            onClick={() => setActiveTab("bookings")}
          >
            Kelola Booking
          </button>
          <button
            className={`px-6 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "courts" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
            onClick={() => setActiveTab("courts")}
          >
            Setelan Lapangan
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "bookings" && <BookingManager initialBookings={bookings} isLoading={isLoading} />}
          {activeTab === "courts" && <CourtManager />}
        </div>
      </div>
    </div>
  );
}
