"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
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
  if (s === "PENDING") return <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-xs uppercase">Pending</span>;
  if (s === "CONFIRMED") return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs uppercase">Confirmed</span>;
  if (s === "CANCELLED") return <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs uppercase">Cancelled</span>;
  if (s === "EXPIRED") return <span className="bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-xs uppercase">Expired</span>;
  return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-xs uppercase">{s}</span>;
}

export function BookingManager({ initialBookings = [], isLoading = false }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filter, setFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const [selected, setSelected] = useState<Booking | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: "Approve" | "Reject" | "Expire"; bookingId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastQueue, setToastQueue] = useState<{ msg: string; type: "success" | "error" }[]>([]);

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

    const newStatus =
      confirmModal.type === "Approve" ? "CONFIRMED" : confirmModal.type === "Reject" ? "CANCELLED" : "EXPIRED";

    try {
      const data = await fetchJson<Booking>(`/api/bookings/${confirmModal.bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      setBookings((prev) => prev.map((b) => (b.id === confirmModal.bookingId ? data : b)));
      showToast(`Booking berhasil di-update ke ${newStatus}`, "success");
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
    if (filter !== "all") list = list.filter((b) => String(b.status).toUpperCase() === filter);
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
          <Toast key={idx} isOpen={true} message={t.msg} type={t.type} onClose={() => {}} />
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <input
          type="text"
          placeholder="Cari ID / User / Court..."
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
            value={filter}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all" || v === "PENDING" || v === "CONFIRMED" || v === "CANCELLED" || v === "EXPIRED") {
                setFilter(v);
              }
            }}
          >
            <option value="all">Semua</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
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
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">ID</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">User</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">Court</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">Waktu</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">Total</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">Payment</th>
                <th className="text-left p-4 font-black uppercase tracking-widest text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : filtered).map((b) => (
                <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="p-4 font-black text-slate-900">{String(b.id).slice(0, 8)}</td>
                  <td className="p-4 font-bold text-slate-700">{b.user?.name || "-"}</td>
                  <td className="p-4 font-bold text-slate-700">{b.court?.name || "-"}</td>
                  <td className="p-4 font-bold text-slate-700">
                    {String(b.date).slice(0, 10)} • {formatMinutesToHHmm(b.startTime)}-{formatMinutesToHHmm(b.endTime)}
                  </td>
                  <td className="p-4 font-black text-blue-700">Rp {Number(b.totalPrice || 0).toLocaleString("id-ID")}</td>
                  <td className="p-4 font-bold text-slate-700">{b.payment?.status || "NOT_SUBMITTED"}</td>
                  <td className="p-4">
                    <AdminBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td className="p-6 text-slate-500 font-bold" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500 font-bold" colSpan={7}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Booking</p>
                <h3 className="text-2xl font-black text-slate-900">{selected.id}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 font-bold">
                X
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">User</p>
                  <p className="font-bold text-slate-900">{selected.user?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Court</p>
                  <p className="font-bold text-slate-900">{selected.court?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu</p>
                  <p className="font-bold text-slate-900">
                    {String(selected.date).slice(0, 10)} • {formatMinutesToHHmm(selected.startTime)} - {formatMinutesToHHmm(selected.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="font-black text-blue-600 text-xl">Rp {Number(selected.totalPrice || 0).toLocaleString("id-ID")}</p>
                </div>
                <div className="pt-2">
                  <AdminBadge status={selected.status} />
                </div>

                {String(selected.status).toUpperCase() === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="full"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setConfirmModal({ type: "Approve", bookingId: selected.id })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="full"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirmModal({ type: "Reject", bookingId: selected.id })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="full"
                      variant="outline"
                      className="text-slate-600 border-slate-200 hover:bg-slate-50"
                      onClick={() => setConfirmModal({ type: "Expire", bookingId: selected.id })}
                    >
                      Expire
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col">
                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Bukti Pembayaran</p>
                {selected.payment?.proofImage ? (
                  <div className="w-full h-72 bg-white rounded-2xl overflow-hidden border border-slate-200">
                    <img src={selected.payment.proofImage} className="w-full h-full object-cover" alt="Proof" />
                  </div>
                ) : (
                  <div className="w-full h-72 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center flex-col text-slate-400">
                    <p className="text-sm font-bold">Belum ada bukti</p>
                  </div>
                )}
                <div className="mt-4 text-xs font-bold text-slate-500">
                  Payment status: {selected.payment?.status || "NOT_SUBMITTED"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isProcessing && setConfirmModal(null)}>
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 mb-2">Konfirmasi {confirmModal.type}</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Yakin ingin {confirmModal.type.toLowerCase()} booking ini?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full" disabled={isProcessing} onClick={() => setConfirmModal(null)}>
                Batal
              </Button>
              <Button className="w-full" isLoading={isProcessing} onClick={handleAction}>
                Ya
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
