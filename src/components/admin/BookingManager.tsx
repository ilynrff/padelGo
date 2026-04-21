"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { PaymentBadge } from "@/components/ui/PaymentBadge";
import { formatMinutesToHHmm } from "@/lib/bookingTime";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Booking = {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  paymentProofUrl?: string;
  user?: { name?: string };
  court?: { name?: string };
  payment?: { status?: string; proofImage?: string } | null;
};

type Props = {
  initialBookings?: Booking[];
  isLoading?: boolean;
};

function AdminBadge({ status }: { status: string }) {
  const s = String(status).toUpperCase();

  const badgeStyles: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    PENDING: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      label: "Pending",
    },
    PERLU_VERIFIKASI: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      label: "Verification",
    },
    CONFIRMED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: "Confirmed",
    },
    CANCELLED: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: "Cancelled",
    },
    EXPIRED: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      label: "Expired",
    },
  };

  const style = badgeStyles[s] || badgeStyles.PENDING;

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${style.text}`}></span>
      {style.label}
    </span>
  );
}

export function BookingManager({
  initialBookings = [],
  isLoading = false,
}: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filter, setFilter] = useState<
    | "all"
    | "PENDING"
    | "PERLU_VERIFIKASI"
    | "CONFIRMED"
    | "CANCELLED"
    | "EXPIRED"
  >("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "Approve" | "Reject" | "Expire" | "ApprovePayment" | "RejectPayment";
    bookingId: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastQueue, setToastQueue] = useState<
    { msg: string; type: "success" | "error" }[]
  >([]);

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToastQueue((prev) => [...prev, { msg, type }]);
    setTimeout(() => setToastQueue((prev) => prev.slice(1)), 3000);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchJson<Booking[]>("/api/bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      showToast(getErrorMessage(e) || "Terjadi kesalahan", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);

    try {
      // Handle payment verification
      if (
        confirmModal.type === "ApprovePayment" ||
        confirmModal.type === "RejectPayment"
      ) {
        const action =
          confirmModal.type === "ApprovePayment" ? "APPROVE" : "REJECT";
        const data = await fetchJson<{ booking: Booking }>(
          `/api/admin/verify-payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: confirmModal.bookingId, action }),
          },
        );

        setBookings((prev) =>
          prev.map((b) => (b.id === confirmModal.bookingId ? data.booking : b)),
        );
        showToast(
          `Pembayaran berhasil di-${action === "APPROVE" ? "approve" : "reject"}`,
          "success",
        );
      } else {
        // Handle booking status update
        const newStatus =
          confirmModal.type === "Approve"
            ? "CONFIRMED"
            : confirmModal.type === "Reject"
              ? "CANCELLED"
              : "EXPIRED";

        const data = await fetchJson<Booking>(
          `/api/bookings/${confirmModal.bookingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        );

        setBookings((prev) =>
          prev.map((b) => (b.id === confirmModal.bookingId ? data : b)),
        );
        showToast(`Booking berhasil di-update ke ${newStatus}`, "success");
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(getErrorMessage(err) || "Terjadi kesalahan", "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
      setSelected(null);
    }
  };

  const filtered = useMemo(() => {
    let list = bookings.slice();
    if (filter !== "all")
      list = list.filter((b) => String(b.status).toUpperCase() === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => {
        const id = String(b.id || "").toLowerCase();
        const userName = String(b.user?.name || "").toLowerCase();
        const courtName = String(b.court?.name || "").toLowerCase();
        return id.includes(q) || userName.includes(q) || courtName.includes(q);
      });
    }
    list.sort((a, b) =>
      sort === "desc"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return list;
  }, [bookings, filter, search, sort]);

  return (
    <div className="space-y-6">
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toastQueue.map((t, idx) => (
          <Toast
            key={idx}
            isOpen={true}
            message={t.msg}
            type={t.type}
            onClose={() => {}}
          />
        ))}
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Daftar Reservasi</h2>
        <p className="text-sm text-slate-600">
          Kelola dan verifikasi semua reservasi lapangan padel
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Cari ID, User, atau Court..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={filter}
            onChange={(e) => {
              const v = e.target.value;
              if (
                v === "all" ||
                v === "PENDING" ||
                v === "CONFIRMED" ||
                v === "CANCELLED" ||
                v === "EXPIRED" ||
                v === "PERLU_VERIFIKASI"
              ) {
                setFilter(
                  v as
                    | "all"
                    | "PENDING"
                    | "PERLU_VERIFIKASI"
                    | "CONFIRMED"
                    | "CANCELLED"
                    | "EXPIRED",
                );
              }
            }}
          >
            <option value="all">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="PERLU_VERIFIKASI">Perlu Verifikasi</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={sort}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "desc" || v === "asc") setSort(v);
            }}
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
          <Button variant="outline" onClick={refresh} isLoading={isRefreshing}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <style>{`
          .booking-table-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .booking-table-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .booking-table-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .booking-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
        <div className="overflow-x-auto booking-table-scroll">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Court
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Tanggal & Jam
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Payment
                </th>
                <th className="text-left px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : filtered).map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-100 group"
                >
                  <td className="px-6 py-4">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                      {String(b.id).slice(0, 8)}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {b.user?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {b.court?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    <div className="font-medium">
                      {String(b.date).slice(0, 10)}
                    </div>
                    <div className="text-slate-500">
                      {formatMinutesToHHmm(b.startTime)}-
                      {formatMinutesToHHmm(b.endTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">
                    Rp {Number(b.totalPrice || 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    <PaymentBadge
                      status={b.payment?.status || "NOT_SUBMITTED"}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge status={b.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelected(b)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg transition-colors duration-200"
                    >
                      👁 Detail
                    </button>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td
                    className="px-6 py-8 text-slate-500 font-medium text-center"
                    colSpan={8}
                  >
                    ⏳ Loading data...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-8 text-slate-500 font-medium text-center"
                    colSpan={8}
                  >
                    📭 Tidak ada reservasi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-8 pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Booking Details
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  <code className="text-lg bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {selected.id}
                  </code>
                </h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-500 hover:text-slate-700"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Info */}
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    User
                  </p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {selected.user?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Court
                  </p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {selected.court?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Tanggal & Waktu
                  </p>
                  <p className="font-semibold text-slate-900">
                    {String(selected.date).slice(0, 10)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {formatMinutesToHHmm(selected.startTime)} -{" "}
                    {formatMinutesToHHmm(selected.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Total Harga
                  </p>
                  <p className="font-bold text-blue-600 text-2xl">
                    Rp{" "}
                    {Number(selected.totalPrice || 0).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Status Booking
                  </p>
                  <AdminBadge status={selected.status} />
                </div>

                {String(selected.status).toUpperCase() === "PENDING" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      size="full"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() =>
                        setConfirmModal({
                          type: "Approve",
                          bookingId: selected.id,
                        })
                      }
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      size="full"
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                      onClick={() =>
                        setConfirmModal({
                          type: "Reject",
                          bookingId: selected.id,
                        })
                      }
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column - Payment Proof */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  Bukti Pembayaran
                </p>
                {selected.paymentProofUrl || selected.payment?.proofImage ? (
                  <div className="w-full h-72 bg-white rounded-lg overflow-hidden border border-slate-200 mb-4">
                    <img
                      src={
                        selected.paymentProofUrl || selected.payment?.proofImage
                      }
                      className="w-full h-full object-contain"
                      alt="Proof"
                    />
                  </div>
                ) : (
                  <div className="w-full h-72 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center flex-col text-slate-400 mb-4">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="mb-2"
                    >
                      <path d="M4 16.5v2.5A2.5 2.5 0 0 0 6.5 21h11A2.5 2.5 0 0 0 20 18.5v-2.5M16 4l-4-4m0 0L8 4M12 0v12" />
                    </svg>
                    <p className="text-sm font-semibold">
                      Belum ada bukti pembayaran
                    </p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 border border-slate-200 mb-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Payment Status
                  </p>
                  <PaymentBadge
                    status={selected.payment?.status || "NOT_SUBMITTED"}
                  />
                </div>

                {/* Tombol verifikasi pembayaran */}
                {String(selected.status).toUpperCase() === "PERLU_VERIFIKASI" &&
                  selected.payment && (
                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                      <Button
                        size="full"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() =>
                          setConfirmModal({
                            type: "ApprovePayment",
                            bookingId: selected.id,
                          })
                        }
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        size="full"
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                        onClick={() =>
                          setConfirmModal({
                            type: "RejectPayment",
                            bookingId: selected.id,
                          })
                        }
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !isProcessing && setConfirmModal(null)}
        >
          <div
            className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {confirmModal.type === "ApprovePayment"
                ? "Approve Pembayaran"
                : confirmModal.type === "RejectPayment"
                  ? "Reject Pembayaran"
                  : `Konfirmasi ${confirmModal.type}`}
            </h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              {confirmModal.type === "ApprovePayment"
                ? "Pembayaran akan dikonfirmasi dan booking akan langsung CONFIRMED."
                : confirmModal.type === "RejectPayment"
                  ? "Pembayaran akan ditolak dan booking akan CANCELLED."
                  : `Yakin ingin ${confirmModal.type.toLowerCase()} booking ini?`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full"
                disabled={isProcessing}
                onClick={() => setConfirmModal(null)}
              >
                Batal
              </Button>
              <Button
                className="w-full"
                isLoading={isProcessing}
                onClick={handleAction}
              >
                Ya
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
