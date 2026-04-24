"use client";

import { useState } from "react";
import { BookingManager } from "./BookingManager";
import { CourtManager } from "./CourtManager";
import { CourtSchedule } from "./CourtSchedule";

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  paymentProofUrl?: string;
  rescheduleDate?: string | null;
  rescheduleStartTime?: number | null;
  rescheduleEndTime?: number | null;
  rescheduleNote?: string | null;
  user?: { name?: string; email?: string };
  court?: { name?: string; location?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

type StatItem = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
};

type Props = {
  initialBookings: Booking[];
  stats: StatItem[];
};

const TABS = [
  { id: "overview",  label: "Dashboard",         icon: "📊" },
  { id: "schedule",  label: "Jadwal Lapangan",   icon: "📅" },
  { id: "bookings",  label: "Manajemen Booking",  icon: "📋" },
  { id: "courts",    label: "Kelola Lapangan",    icon: "🏟️" },
] as const;

type TabId = typeof TABS[number]["id"];

function StatCard({ item }: { item: StatItem }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
    green:  { bg: "bg-emerald-50",text: "text-emerald-600",border: "border-emerald-100" },
    yellow: { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
    purple: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
  };
  const c = colorMap[item.color] ?? colorMap.blue;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
        {item.icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">{item.label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5 truncate">{item.value}</p>
        {item.trend && <p className="text-xs text-slate-400 font-medium mt-0.5">{item.trend}</p>}
      </div>
    </div>
  );
}

export function AdminDashboard({ initialBookings, stats }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-0">
      {/* Tab Navbar */}
      <div className="sticky top-[73px] z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Admin navigation">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all duration-150
                    ${isActive
                      ? "border-blue-600 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"}
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Overview</h2>
              <p className="text-slate-500 font-medium mt-1">Ringkasan aktivitas booking hari ini</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <StatCard key={s.label} item={s} />
              ))}
            </div>

            {/* Quick: recent bookings needing action */}
            <div>
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                ⚡ Membutuhkan Tindakan
              </h3>
              <BookingManager
                initialBookings={initialBookings}
                defaultFilter="RESCHEDULE_REQUESTED"
              />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800 mb-4">
                🕐 Menunggu Verifikasi Pembayaran
              </h3>
              <BookingManager
                initialBookings={initialBookings}
                defaultFilter="PERLU_VERIFIKASI"
              />
            </div>
          </div>
        )}

        {/* ── JADWAL LAPANGAN ── */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Jadwal Lapangan</h2>
              <p className="text-slate-500 font-medium mt-1">
                Grid ketersediaan lapangan per jam dan per hari
              </p>
            </div>
            <CourtSchedule />
          </div>
        )}

        {/* ── MANAJEMEN BOOKING ── */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Manajemen Booking</h2>
              <p className="text-slate-500 font-medium mt-1">
                Kelola semua reservasi — approve, reject, atau reschedule
              </p>
            </div>
            <BookingManager initialBookings={initialBookings} />
          </div>
        )}

        {/* ── KELOLA LAPANGAN ── */}
        {activeTab === "courts" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Kelola Lapangan</h2>
              <p className="text-slate-500 font-medium mt-1">
                Tambah, edit, atau hapus data lapangan padel
              </p>
            </div>
            <CourtManager />
          </div>
        )}
      </div>
    </div>
  );
}
