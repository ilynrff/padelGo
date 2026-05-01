"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { PaymentDeadlineCountdown } from "@/components/dashboard/PaymentDeadlineCountdown";
import { PaymentDeadlineBadge } from "@/components/dashboard/PaymentDeadlineBadge";
import { RescheduleModal } from "@/components/dashboard/RescheduleModal";
import { BookingTimeAwareness } from "@/components/dashboard/BookingTimeAwareness";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
  bookingCode?: string | null;
  date: string;
  startTime: number;
  endTime: number;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "EXPIRED"
    | "COMPLETED"
    | "PERLU_VERIFIKASI"
    | "RESCHEDULE_REQUESTED"
    | "RESCHEDULE_APPROVED"
    | "RESCHEDULE_REJECTED"
    | string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  court?: { id?: string; name?: string };
  payment?: { status?: string } | null;
};

import React from "react";

const BookingRow = React.memo(({ 
  b, 
  file, 
  onFileChange, 
  onUpload, 
  isUploading, 
  onReschedule,
  onShowDetail
}: { 
  b: Booking, 
  file: File | null, 
  onFileChange: (f: File | null) => void, 
  onUpload: () => void, 
  isUploading: boolean,
  onReschedule: (b: Booking) => void,
  onShowDetail: (b: Booking) => void
}) => {
  const bookingStart = new Date(b.date);
  bookingStart.setUTCMinutes(bookingStart.getUTCMinutes() + b.startTime);
  const hoursUntil = (bookingStart.getTime() - Date.now()) / 3600000;
  const canReschedule = hoursUntil > 12;
  const isExpiredByTime = b.expiresAt ? new Date(b.expiresAt) < new Date() : false;

  const isClickable = b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED" || b.status === "CHECKED_IN";

  return (
    <Card 
      className={`p-6 rounded-[2rem] border-slate-100 shadow-sm overflow-hidden transition-all ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5' : ''}`}
      onClick={() => isClickable && onShowDetail(b)}
    >
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
            {b.bookingCode || b.id.slice(0, 8)}
          </div>
          <div className="text-sm font-black text-slate-900">{b.court?.name}</div>
          <div className="text-sm font-bold text-slate-500">
            {String(b.date).slice(0, 10)} •{" "}
            {formatMinutesToHHmm(b.startTime)} – {formatMinutesToHHmm(b.endTime)}
          </div>
          <div className="text-sm font-bold text-slate-500">
            Total:{" "}
            <span className="text-slate-900">
              Rp {Number(b.totalPrice || 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
            <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : b.status === "EXPIRED" || b.status === "CANCELLED"
                  ? "bg-red-100 text-red-700"
                  : b.status === "PERLU_VERIFIKASI"
                    ? "bg-amber-100 text-amber-700"
                    : b.status === "RESCHEDULE_REQUESTED"
                      ? "bg-violet-100 text-violet-700"
                      : b.status === "RESCHEDULE_REJECTED"
                        ? "bg-rose-100 text-rose-700"
                        : b.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-700"
                          : b.status === "CHECKED_IN"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-700"
            }`}>
              {b.status === "PERLU_VERIFIKASI" ? "Perlu Verifikasi"
                : b.status === "PENDING" ? "Menunggu Bayar"
                : b.status === "RESCHEDULE_REQUESTED" ? "Reschedule ⏳"
                : b.status === "RESCHEDULE_APPROVED" ? "Reschedule ✓"
                : b.status === "RESCHEDULE_REJECTED" ? "Reschedule ✕"
                : b.status === "CHECKED_IN" ? "Checked In"
                : b.status}
            </div>
            {b.status === "PENDING" && b.expiresAt && (
              <PaymentDeadlineBadge
                expiresAt={b.expiresAt}
                bookingStatus={b.status}
                compact={true}
              />
            )}
          </div>
          <div className="text-xs font-bold text-slate-500">
            Payment: {b.payment?.status ?? "NOT_SUBMITTED"}
          </div>
        </div>
      </div>

      {/* PENDING: payment deadline + file upload */}
      {b.status === "PENDING" && !b.payment && (
        <div className="mt-5 space-y-3">
          {b.expiresAt && (
            <PaymentDeadlineCountdown
              expiresAt={b.expiresAt}
              bookingStatus={b.status}
              onExpired={() => {}} // Handle at parent level if needed
            />
          )}
          {!isExpiredByTime && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onUpload();
              }}
              className="grid md:grid-cols-[1fr_auto] gap-3 items-end"
            >
              <div className="relative group">
                {file ? (
                  <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xl shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">File terpilih</p>
                        <p className="text-sm font-bold text-blue-700 truncate">{file.name}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onFileChange(null)}
                      className="ml-2 text-blue-400 hover:text-red-500 font-bold transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <Input
                    label="Upload Bukti Pembayaran (JPG/PNG, max 2MB)"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      onFileChange(f);
                    }}
                  />
                )}
              </div>
              <Button
                type="submit"
                isLoading={isUploading}
                disabled={!file}
              >
                Kirim Bukti
              </Button>
            </form>
          )}
        </div>
      )}

      {/* PERLU VERIFIKASI */}
      {(b.status === "PERLU_VERIFIKASI" || b.payment?.status === "PENDING") && (
        <div className="mt-4 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <span>Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.</span>
        </div>
      )}

      {/* Time Awareness: Countdowns and Warnings */}
      <BookingTimeAwareness booking={b as any} />

      {/* CONFIRMED: reschedule button */}
      {(b.status === "CONFIRMED" || b.status === "RESCHEDULE_APPROVED") && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onReschedule(b); }}
            disabled={!canReschedule}
            title={!canReschedule ? "Hanya bisa reschedule > 12 jam sebelum jadwal" : ""}
            className="text-sm font-bold text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-xl px-4 py-2 w-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            📅 Ajukan Reschedule{!canReschedule && " (< 12 jam)"}
          </button>
        </div>
      )}

      {/* Reschedule status messages */}
      {b.status === "RESCHEDULE_REQUESTED" && (
        <div className="mt-4 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-2xl p-4">
          ⏳ Permintaan reschedule sedang menunggu persetujuan admin.
        </div>
      )}
      {b.status === "RESCHEDULE_APPROVED" && (
        <div className="mt-4 text-sm font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-2xl p-4">
          ✅ Reschedule disetujui! Jadwal baru sudah aktif.
        </div>
      )}
      {b.status === "RESCHEDULE_REJECTED" && (
        <div className="mt-4 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          ❌ Reschedule ditolak admin. Jadwal lama tetap berlaku.
        </div>
      )}

      {/* EXPIRED / CANCELLED */}
      {(b.status === "EXPIRED" || b.status === "CANCELLED") && (
        <div className="mt-4 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4">
          Booking {b.status.toLowerCase()}. Silakan booking ulang.
        </div>
      )}
    </Card>
  );
});

BookingRow.displayName = "BookingRow";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileByBookingId, setFileByBookingId] = useState<Record<string, File | null>>({});
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const canFetch = status === "authenticated";
  const isInteracting = !!rescheduleBooking || !!detailBooking || !!uploadingBookingId || Object.values(fileByBookingId).some(f => !!f);

  // Redirect ADMIN to /admin
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [session?.user?.role, router]);

  const refresh = async (manageLifecycle = false, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      if (manageLifecycle) {
        await fetch("/api/bookings/expire", { method: "POST" });
      }
      const data = await fetchJson<Booking[]>("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canFetch) return;
    refresh(true); // Manage lifecycle on initial load
    const interval = setInterval(() => {
      if (!isInteracting && !isLoading) {
        refresh(false, true); // Silent refresh in background
      }
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, isInteracting]);

  const pending = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").length,
    [bookings],
  );
  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED").length,
    [bookings],
  );

  const submitProof = async (bookingId: string) => {
    const file = fileByBookingId[bookingId];
    if (!file) {
      setToast({ msg: "Mohon pilih file gambar bukti pembayaran.", type: "error" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setToast({ msg: "File harus berupa gambar (JPG, PNG, WebP).", type: "error" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ msg: "Ukuran file maksimal 2MB.", type: "error" });
      return;
    }

    setUploadingBookingId(bookingId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingId", bookingId);

      const uploadResponse = await fetch("/api/upload-proof", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        if (uploadResponse.status === 410) {
          setToast({
            msg: errorData.error || "Waktu pembayaran telah habis. Silakan lakukan booking baru.",
            type: "error",
          });
          await refresh();
        } else {
          throw new Error(errorData.error || "Gagal mengunggah file.");
        }
        return;
      }

      setToast({ msg: "Bukti pembayaran terkirim. Menunggu verifikasi admin.", type: "success" });
      setFileByBookingId((prev) => ({ ...prev, [bookingId]: null }));
      await refresh(false, true); // Silent refresh to update status
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    } finally {
      setUploadingBookingId(null);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
        <Card className="w-full max-w-lg p-8 rounded-[2rem] shadow-xl">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-500 font-medium mb-6">
            Silakan login untuk melihat booking Anda.
          </p>
          <Link href="/login">
            <Button size="full">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-6 min-h-[calc(100vh-64px)]">
      {toast && (
        <Toast
          isOpen={true}
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Dashboard</h1>
            <p className="text-slate-500 font-medium">
              Hai, {session?.user.name || "Player"} — ini daftar booking kamu.
            </p>
          </div>
          <Button variant="outline" onClick={refresh} isLoading={isLoading}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-3xl font-black text-slate-900">{bookings.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-3xl font-black text-orange-700">{pending}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmed</p>
            <p className="text-3xl font-black text-emerald-600">{confirmed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Role</p>
            <p className="text-3xl font-black text-slate-900">{session?.user.role || "USER"}</p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 animate-pulse">
              Loading…
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 font-bold">
              Belum ada booking.
            </div>
          ) : (
            bookings.map((b) => (
              <BookingRow
                key={b.id}
                b={b}
                file={fileByBookingId[b.id] || null}
                onFileChange={(f) => setFileByBookingId(prev => ({ ...prev, [b.id]: f }))}
                onUpload={() => submitProof(b.id)}
                isUploading={uploadingBookingId === b.id}
                onReschedule={setRescheduleBooking}
                onShowDetail={setDetailBooking}
              />
            ))
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking as any}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={() => {
            setToast({
              msg: "Permintaan reschedule berhasil dikirim. Menunggu persetujuan admin.",
              type: "success",
            });
            refresh();
          }}
          onError={(msg) => setToast({ msg, type: "error" })}
        />
      )}

      {/* Detail Modal for Check-in */}
      {detailBooking && (
        <div 
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setDetailBooking(null)}
        >
          <div 
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-blue-600 px-6 py-8 text-center relative">
              <button 
                onClick={() => setDetailBooking(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              >
                ✕
              </button>
              <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Kode Booking</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {detailBooking.bookingCode || detailBooking.id.slice(0,8)}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 inline-block">
                  Tunjukkan kode booking ini ke admin saat tiba di lokasi.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lapangan</span>
                  <span className="text-sm font-black text-slate-800">{detailBooking.court?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                  <span className="text-sm font-black text-slate-800">{String(detailBooking.date).slice(0,10)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                  <span className="text-sm font-black text-slate-800">
                    {formatMinutesToHHmm(detailBooking.startTime)} - {formatMinutesToHHmm(detailBooking.endTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                    detailBooking.status === "CHECKED_IN" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {detailBooking.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}
                  </span>
                </div>
              </div>

              <Button size="full" onClick={() => setDetailBooking(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
