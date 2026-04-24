"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMinutesToHHmm, buildDailySlotLabels, rangesOverlap } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";

type Court = { id: string; name: string; location: string };

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  user?: { name?: string; email?: string } | null;
  court?: { id?: string; name?: string } | null;
  courtId?: string;
};

const SLOT_STATUSES = {
  AVAILABLE:        { label: "Tersedia",          bg: "bg-emerald-50",  border: "border-emerald-200",  text: "text-emerald-700", dot: "🟢" },
  CONFIRMED:        { label: "Confirmed",          bg: "bg-blue-100",    border: "border-blue-300",     text: "text-blue-800",    dot: "🔵" },
  RESCHEDULE_APPROVED: { label: "Reschedule ✓",  bg: "bg-teal-100",    border: "border-teal-300",     text: "text-teal-800",    dot: "🟦" },
  PENDING:          { label: "Menunggu Bayar",    bg: "bg-amber-50",    border: "border-amber-200",    text: "text-amber-800",   dot: "🟡" },
  PERLU_VERIFIKASI: { label: "Verifikasi",        bg: "bg-orange-100",  border: "border-orange-300",   text: "text-orange-800",  dot: "🟠" },
  RESCHEDULE_REQUESTED: { label: "Reschedule ⏳", bg: "bg-violet-100", border: "border-violet-300",   text: "text-violet-800",  dot: "🟣" },
};

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PERLU_VERIFIKASI", "RESCHEDULE_REQUESTED", "RESCHEDULE_APPROVED"];

function todayISOLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CourtSchedule() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(todayISOLocal());
  const [selectedCourtId, setSelectedCourtId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  const slots = useMemo(() => buildDailySlotLabels(8 * 60, 22 * 60, 60), []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [courtsData, bookingsData] = await Promise.all([
        fetch("/api/courts").then((r) => r.json()),
        fetch(`/api/bookings`).then((r) => r.json()),
      ]);
      setCourts(Array.isArray(courtsData) ? courtsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visibleCourts = useMemo(() =>
    selectedCourtId === "all" ? courts : courts.filter((c) => c.id === selectedCourtId),
    [courts, selectedCourtId],
  );

  // Filter bookings to the selected date
  const dayBookings = useMemo(() =>
    bookings.filter((b) => {
      const bDate = String(b.date).slice(0, 10);
      return bDate === date && ACTIVE_STATUSES.includes(b.status);
    }),
    [bookings, date],
  );

  function getCell(court: Court, slot: { start: number; end: number }) {
    const booking = dayBookings.find(
      (b) =>
        (b.court?.id === court.id || b.courtId === court.id) &&
        rangesOverlap({ start: b.startTime, end: b.endTime }, slot),
    );
    return booking ?? null;
  }

  const statusConfig = (status: string) =>
    SLOT_STATUSES[status as keyof typeof SLOT_STATUSES] ?? SLOT_STATUSES.AVAILABLE;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lapangan</label>
          <select
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">Semua Lapangan</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition-colors ml-auto"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        {Object.entries(SLOT_STATUSES).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className={`w-3 h-3 rounded ${cfg.bg} border ${cfg.border} inline-block`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {visibleCourts.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 font-bold">
          Tidak ada lapangan.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {/* Time header */}
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-28 border-r border-slate-200">
                  Jam
                </th>
                {visibleCourts.map((court) => (
                  <th key={court.id} className="px-3 py-3 text-center min-w-[140px]">
                    <div className="text-sm font-black text-slate-800">{court.name}</div>
                    <div className="text-[11px] font-medium text-slate-400">{court.location}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const now = new Date();
                const slotDateStr = `${date}T00:00:00.000Z`;
                const slotStart = new Date(slotDateStr);
                slotStart.setUTCMinutes(slot.start);
                const isPast = slotStart < now;

                return (
                  <tr key={slot.label} className={`border-b border-slate-100 last:border-b-0 ${isPast ? "opacity-50" : ""}`}>
                    {/* Time label */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-slate-100">
                      <span className="text-xs font-black text-slate-500">
                        {formatMinutesToHHmm(slot.start)}
                      </span>
                      <span className="text-[10px] text-slate-300 ml-1">
                        – {formatMinutesToHHmm(slot.end)}
                      </span>
                    </td>
                    {/* Cells per court */}
                    {visibleCourts.map((court) => {
                      const booking = getCell(court, slot);
                      if (!booking) {
                        return (
                          <td key={court.id} className="px-2 py-1.5 text-center">
                            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 h-9 flex items-center justify-center">
                              <span className="text-[11px] font-bold text-emerald-500">Tersedia</span>
                            </div>
                          </td>
                        );
                      }
                      const cfg = statusConfig(booking.status);
                      return (
                        <td key={court.id} className="px-2 py-1.5 text-center">
                          <div
                            className={`relative rounded-xl border ${cfg.bg} ${cfg.border} h-9 flex items-center justify-center px-2 cursor-pointer group transition-all hover:shadow-md hover:scale-[1.02]`}
                            onMouseEnter={(e) =>
                              setTooltip({
                                booking,
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <span className={`text-[11px] font-black ${cfg.text} truncate`}>
                              {booking.user?.name ?? "—"}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 text-xs font-medium pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-black text-sm mb-1">{tooltip.booking.user?.name ?? "—"}</p>
          <p className="text-slate-300">{tooltip.booking.user?.email ?? ""}</p>
          <p className="text-slate-300 mt-1">
            {formatMinutesToHHmm(tooltip.booking.startTime)} – {formatMinutesToHHmm(tooltip.booking.endTime)}
          </p>
          <p className="mt-1">
            <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 font-black">
              {SLOT_STATUSES[tooltip.booking.status as keyof typeof SLOT_STATUSES]?.label ?? tooltip.booking.status}
            </span>
          </p>
          <p className="text-slate-400 mt-1">
            Rp {Number(tooltip.booking.totalPrice || 0).toLocaleString("id-ID")}
          </p>
        </div>
      )}
    </div>
  );
}
