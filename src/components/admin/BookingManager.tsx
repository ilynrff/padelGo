"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

type AdminBookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

function AdminBadge({ status }: { status: AdminBookingStatus | string }) {
  if (status === "PENDING") return <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-xs uppercase">Pending</span>;
  if (status === "CONFIRMED") return <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-xs uppercase">Paid</span>;
  if (status === "CANCELLED") return <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs uppercase">Dibatalkan</span>;
  return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-xs uppercase">{status}</span>;
}

const FALLBACK_BOOKINGS = [
  {
    id: "B-1001",
    user: { name: "Budi Santoso" },
    court: { name: "Padel Court A (Premium)" },
    date: new Date().toISOString(),
    timeSlot: "10:00-11:00",
    status: "paid"
  },
  {
    id: "B-1002",
    user: { name: "Siti Aminah" },
    court: { name: "Indoor Panoramic Court" },
    date: new Date().toISOString(),
    timeSlot: "14:00-15:00",
    status: "pending"
  }
];

export function BookingManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, type: 'Approve' | 'Reject', bookingId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastQueue, setToastQueue] = useState<{msg: string, type: 'success'|'error'}[]>([]);

  useEffect(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setBookings(data);
      })
      .finally(() => setIsLoadingDB(false));
  }, []);

  const showToast = (msg: string, type: 'success'|'error') => {
    setToastQueue(prev => [...prev, {msg, type}]);
    setTimeout(() => setToastQueue(prev => prev.slice(1)), 3000);
  };

  const handleAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    
    try {
      const resp = await fetch(`/api/bookings/${confirmModal.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: confirmModal.type === 'Approve' ? 'CONFIRMED' : 'CANCELLED' 
        })
      });

      if (!resp.ok) throw new Error("Gagal mengupdate status di server.");

      setBookings(prev => prev.map(b => {
        if (b.id === confirmModal.bookingId) {
          return { ...b, status: confirmModal.type === 'Approve' ? 'CONFIRMED' : 'CANCELLED' };
        }
        return b;
      }));
      
      showToast(`Booking ${confirmModal.bookingId.split('-')[0]} berhasil di-${confirmModal.type.toLowerCase()}`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
      setSelectedBooking(null);
    }
  };

  let filtered = bookings.filter(b => {
    if (filter !== "all" && b.status !== filter) return false;
    const userName = (b.user?.name || "").toLowerCase();
    if (search && !b.id.toLowerCase().includes(search.toLowerCase()) && !userName.includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = filtered.sort((a, b) => sort === "desc" 
    ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() 
    : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

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
           placeholder="Cari ID atau Nama..." 
           className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
           value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
           <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={filter} onChange={(e) => setFilter(e.target.value)}>
             <option value="all">Semua Status</option>
             <option value="PENDING">Pending</option>
             <option value="CONFIRMED">Confirmed / Paid</option>
             <option value="CANCELLED">Dibatalkan</option>
           </select>
           <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={sort} onChange={(e) => setSort(e.target.value as "asc" | "desc")}>
             <option value="desc">Terbaru</option>
             <option value="asc">Terlama</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase">ID Booking</th>
                <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase">Nama User</th>
                <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase">Tanggal</th>
                <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoadingDB ? (
                 <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-bold animate-pulse">Mengambil data dari server...</td>
                 </tr>
              ) : filtered.map(b => {
                const uName = b.user?.name || "User tidak ditemukan";
                const displayDate = new Date(b.date).toLocaleDateString('id-ID');
                return (
                  <tr key={b.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${b.status === 'PENDING' ? 'bg-amber-50/30' : ''}`} onClick={() => setSelectedBooking(b)}>
                    <td className="p-4 px-6 font-black text-sm">{b.id.split('-')[0]}...</td>
                    <td className={`p-4 px-6 font-bold text-sm ${!b.user ? "text-red-500 italic" : "text-slate-700"}`}>{uName}</td>
                    <td className="p-4 px-6 font-medium text-sm text-slate-500">{displayDate} • {b.timeSlot}</td>
                    <td className="p-4 px-6"><AdminBadge status={b.status} /></td>
                    <td className="p-4 px-6 text-right">
                      <button className="text-blue-600 font-bold text-sm hover:underline" onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); }}>Detail</button>
                    </td>
                  </tr>
                )
              })}
              {!isLoadingDB && filtered.length === 0 && (
                 <tr>
                   <td colSpan={5} className="text-center py-10 text-slate-400 font-bold">Tidak ada data booking.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MDOAL */}
      {selectedBooking && (() => {
        const modalUName = selectedBooking.user?.name || "User tidak ditemukan";
        const total = selectedBooking.court?.price || 0;
        const displayDate = new Date(selectedBooking.date).toLocaleDateString('id-ID');
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
               {/* Info Section */}
               <div className="p-6 md:p-8 flex-1 bg-slate-50 border-r border-slate-100 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                       <h2 className="text-lg font-black text-slate-900 mb-1">{selectedBooking.id}</h2>
                       <AdminBadge status={selectedBooking.status} />
                     </div>
                     <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold">X</button>
                  </div>
                  
                  <div className="space-y-4 mb-8 flex-1">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">User</p>
                      <p className={`font-bold ${!selectedBooking.user ? "text-red-500 italic" : "text-slate-900"}`}>{modalUName}</p>
                    </div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lapangan</p><p className="font-bold text-slate-900">{selectedBooking.court?.name || "Undefined"}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu Main</p><p className="font-bold text-slate-900">{displayDate} / {selectedBooking.timeSlot}</p></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Tagihan</p><p className="font-black text-blue-600 text-xl">Rp {total.toLocaleString('id-ID')}</p></div>
                  </div>

                  {selectedBooking.status === "PENDING" && (
                     <div className="flex gap-2">
                       <Button size="full" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmModal({isOpen: true, type: 'Approve', bookingId: selectedBooking.id})}>Approve</Button>
                       <Button size="full" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmModal({isOpen: true, type: 'Reject', bookingId: selectedBooking.id})}>Reject</Button>
                     </div>
                  )}
               </div>

               {/* Bukti Transfer Section */}
               <div className="w-full md:w-80 bg-white p-6 flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest w-full text-left">Bukti Pembayaran</p>
                  {selectedBooking.uploadedProofUrl ? (
                     <div 
                       className="w-full h-64 bg-slate-100 rounded-2xl overflow-hidden cursor-zoom-in border border-slate-200 relative group"
                       onClick={() => setZoomImage(selectedBooking.uploadedProofUrl!)}
                     >
                       <img src={selectedBooking.uploadedProofUrl} className="w-full h-full object-cover" alt="Proof" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 text-white font-bold flex items-center justify-center transition-opacity">Zoom Image</div>
                     </div>
                  ) : (
                     <div className="w-full h-64 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center flex-col text-slate-400">
                       <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       <p className="text-sm font-bold">Belum ada lampiran server</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        )
      })()}

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isProcessing && setConfirmModal(null)}>
           <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-slate-900 mb-2">Konfirmasi {confirmModal.type}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6">Apakah Anda yakin ingin melakukan {confirmModal.type.toLowerCase()} untuk booking ID: <span className="font-bold">{confirmModal.bookingId.split('-')[0]}</span>?</p>
              <div className="flex gap-2">
                 <Button variant="outline" className="w-full" disabled={isProcessing} onClick={() => setConfirmModal(null)}>Batal</Button>
                 <Button className={`w-full ${confirmModal.type === 'Reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`} isLoading={isProcessing} onClick={handleAction}>
                    Ya, {confirmModal.type}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      {zoomImage && (
         <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out" onClick={() => setZoomImage(null)}>
            <img src={zoomImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
         </div>
      )}

    </div>
  );
}
