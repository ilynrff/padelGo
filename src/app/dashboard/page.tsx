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
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | string;
  totalPrice: number;
  createdAt: string;
  expiresAt?: string;
  court?: { name?: string };
  payment?: { status?: string } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Note: proofByBookingId and setProofByBookingId were unused
  const [fileByBookingId, setFileByBookingId] = useState<
    Record<string, File | null>
  >({});
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const canFetch = status === "authenticated";

  // Redirect ADMIN to /admin
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [session?.user?.role, router]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Booking[]>("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canFetch) return;
    refresh();
    // Auto-refresh every 10 seconds to update countdown timer and check for expiry
    const interval = setInterval(async () => {
      refresh();
      // Also call check-expiry endpoint to sync expired status
      try {
        await fetch("/api/bookings/check-expiry", { method: "POST" });
      } catch (e) {
        console.error("Failed to check expiry:", e);
      }
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

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
      setToast({
        msg: "Mohon pilih file gambar bukti pembayaran.",
        type: "error",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({
        msg: "File harus berupa gambar (JPG, PNG, WebP).",
        type: "error",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ msg: "Ukuran file maksimal 2MB.", type: "error" });
      return;
    }

    setUploadingBookingId(bookingId);
    console.log("DEBUG: Uploading:", file);
    try {
      // Upload file to /api/upload-proof (this API now also updates the database status)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingId", bookingId);

      const uploadResponse = await fetch("/api/upload-proof", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("DEBUG: Upload failed response:", errorData);

        if (uploadResponse.status === 410) {
          // Booking expired
          setToast({
            msg:
              errorData.error ||
              "Waktu pembayaran telah habis. Silakan lakukan booking baru.",
            type: "error",
          });
          await refresh();
        } else {
          throw new Error(errorData.error || "Gagal mengunggah file.");
        }
        return;
      }

      console.log("DEBUG: Upload success");
      setToast({
        msg: "Bukti pembayaran terkirim. Menunggu verifikasi admin.",
        type: "success",
      });
      setFileByBookingId((prev) => ({ ...prev, [bookingId]: null }));
      await refresh();
    } catch (e: unknown) {
      console.error("DEBUG: Submit error:", e);
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total
            </p>
            <p className="text-3xl font-black text-slate-900">
              {bookings.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 p-5 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
              Pending
            </p>
            <p className="text-3xl font-black text-orange-700">{pending}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Confirmed
            </p>
            <p className="text-3xl font-black text-emerald-600">{confirmed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Role
            </p>
            <p className="text-3xl font-black text-slate-900">
              {session?.user.role || "USER"}
            </p>
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
              <Card
                key={b.id}
                className="p-6 rounded-[2rem] border-slate-100 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900">
                      {b.court?.name}
                    </div>
                    <div className="text-sm font-bold text-slate-500">
                      {String(b.date).slice(0, 10)} •{" "}
                      {formatMinutesToHHmm(b.startTime)} -{" "}
                      {formatMinutesToHHmm(b.endTime)}
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
                        b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                        b.status === "EXPIRED" || b.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                        b.status === "PERLU_VERIFIKASI" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {b.status === "PERLU_VERIFIKASI" ? "Perlu Verifikasi" :
                         b.status === "PENDING" ? "Menunggu Bayar" :
                         b.status}
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
                      Payment:{" "}
                      {b.payment?.status ? b.payment.status : "NOT_SUBMITTED"}
                    </div>
                  </div>
                </div>

                {b.status === "PENDING" && !b.payment && (() => {
                  const isExpiredByTime = b.expiresAt ? new Date(b.expiresAt) < new Date() : false;
                  return (
                    <div className="mt-5 space-y-3">
                      {b.expiresAt && (
                        <PaymentDeadlineCountdown
                          expiresAt={b.expiresAt}
                          bookingStatus={b.status}
                          onExpired={refresh}
                        />
                      )}
                      {!isExpiredByTime && (
                        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                          <Input
                            label="Upload Bukti Pembayaran (JPG/PNG, max 2MB)"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFileByBookingId((prev) => ({
                                ...prev,
                                [b.id]: file,
                              }));
                            }}
                          />
                          <Button
                            onClick={() => submitProof(b.id)}
                            isLoading={uploadingBookingId === b.id}
                            disabled={!fileByBookingId[b.id]}
                          >
                            Kirim Bukti
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(b.status === "PERLU_VERIFIKASI" ||
                  b.payment?.status === "PENDING") && (
                  <div className="mt-4 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    Bukti pembayaran sudah dikirim (Verifikasi: {b.status}).
                    Menunggu verifikasi admin.
                  </div>
                )}

                {(b.status === "EXPIRED" || b.status === "CANCELLED") && (
                  <div className="mt-4 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4">
                    Booking {b.status.toLowerCase()}. Silakan booking ulang.
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
