"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";

// --- TYPES & STATUS LOGIC ---
export type BookingStatus = "pending" | "pending_verification" | "paid" | "expired" | "cancelled";

export interface Booking {
  id: string;
  court: string;
  location: string;
  date: string;
  time: string;
  duration: number;
  total: number;
  createdAt: Date;
  expiresAt: Date;
  paidAt: Date | null;
  uploadedAt: Date | null;
  cancelledAt?: Date | null;
}

export const getBookingStatus = (booking: Booking, currentTime: Date): BookingStatus => {
  if (booking.cancelledAt) return "cancelled";
  if (booking.paidAt) return "paid";
  if (booking.uploadedAt) return "pending_verification";
  if (currentTime > booking.expiresAt) return "expired";
  return "pending";
};

// --- DUMMY DB DATA ---
const now = new Date();
const MOCK_DB_INIT: Booking[] = [
  { 
    id: "BKG-101", court: "Indoor Panoramic Court A", location: "Semarang", 
    date: "16 May 2026", time: "19:00 - 20:00", duration: 1, total: 350000, 
    createdAt: new Date(now.getTime() - 5 * 60000), 
    expiresAt: new Date(now.getTime() + 10 * 60000), 
    paidAt: null, uploadedAt: null
  },
  { 
    id: "BKG-098", court: "Outdoor Classic Court", location: "Semarang",
    date: "10 May 2026", time: "08:00 - 10:00", duration: 2, total: 400000, 
    createdAt: new Date(now.getTime() - 20 * 86400000), 
    expiresAt: new Date(now.getTime() - 20 * 86400000 + 15 * 60000), 
    paidAt: new Date(now.getTime() - 20 * 86400000 + 5 * 60000),
    uploadedAt: new Date(now.getTime() - 20 * 86400000 + 1 * 60000)
  },
  { 
    id: "BKG-082", court: "Indoor Panoramic Court B", location: "Semarang",
    date: "01 May 2026", time: "16:00 - 17:00", duration: 1, total: 300000, 
    createdAt: new Date(now.getTime() - 10 * 86400000), 
    expiresAt: new Date(now.getTime() - 10 * 86400000 + 15 * 60000), 
    paidAt: null, uploadedAt: null
  },
  { 
    id: "BKG-075", court: "Padel Court A (Premium)", location: "Semarang",
    date: "20 Apr 2026", time: "20:00 - 22:00", duration: 2, total: 300000, 
    createdAt: new Date(now.getTime() - 30 * 86400000), 
    expiresAt: new Date(now.getTime() - 30 * 86400000 + 15 * 60000), 
    paidAt: null, uploadedAt: null,
    cancelledAt: new Date(now.getTime() - 30 * 86400000 + 2 * 60000)
  },
];

// --- COMPONENT: STATUS BADGE ---
function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "pending") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Menunggu Pembayaran</span>;
  if (status === "pending_verification") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Menunggu Verifikasi</span>;
  if (status === "paid") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Selesai Dibayar</span>;
  if (status === "expired") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 tracking-wider uppercase line-through decoration-red-700"><svg className="w-3.5 h-3.5 line-through" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> Kedaluwarsa</span>;
  if (status === "cancelled") return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700 tracking-wider uppercase"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg> Dibatalkan</span>;
  return null;
}

// --- MODAL UPLOAD COMPONENT ---
function UploadModal({ isOpen, onClose, onSubmit, bookingId }: { isOpen: boolean, onClose: () => void, onSubmit: (file: File) => Promise<void>, bookingId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile: File) => {
    setError("");
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Format file tidak valid. Harap unggah .JPG atau .PNG");
       return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Silakan pilih file terlebih dahulu.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await onSubmit(file);
      // reset internal state 
      setFile(null);
      setPreview(null);
    } catch {
       setError("Terjadi kesalahan sistem saat unggah.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={!isLoading ? onClose : undefined}>
       <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-black text-xl text-slate-900">Upload Bukti Transfer</h3>
             {!isLoading && <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors font-bold">X</button>}
          </div>

          <div className="p-6">
             <p className="text-sm font-medium text-slate-500 mb-4">
                Silahkan upload bukti pembayaran untuk booking dengan ID <span className="font-bold text-slate-900">{bookingId}</span>. Pastikan foto terlihat jelas.
             </p>

             {/* Drag & Drop Area */}
             <div 
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
               onClick={() => fileInputRef.current?.click()}
               className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors relative mb-2
                 ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
               `}
             >
               <input type="file" hidden accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleFileChange} />
               
               {preview ? (
                 <div className="flex flex-col items-center">
                    <img src={preview} alt="Preview" className="h-32 object-contain rounded-xl shadow-sm mb-3 border border-slate-200" />
                    <p className="text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{file?.name}</p>
                 </div>
               ) : (
                 <div className="py-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="font-bold text-slate-700 text-sm">Klik untuk upload atau Drag & Drop</p>
                    <p className="text-xs text-slate-400 mt-1">Maks 2MB, Format JPG/PNG</p>
                 </div>
               )}
             </div>

             {error && <p className="text-sm font-bold text-red-500 mb-2 mt-2 animate-in fade-in">✕ {error}</p>}

             <Button size="full" className="mt-6" onClick={handleSubmit} isLoading={isLoading}>
                {isLoading ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
             </Button>
          </div>
       </div>
     </div>
  );
}

// --- COMPONENT: ACTIVE BOOKING CARD (ACTION REQUIRED) ---
function ActiveBookingCard({ booking, onUploadClick }: { booking: Booking, onUploadClick: (id: string) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const status = getBookingStatus(booking, currentTime);
  const isExpired = status === "expired" || status === "cancelled";
  const isVerifying = status === "pending_verification";

  // Calculate remaining time smoothly
  const timeMsLeft = booking.expiresAt.getTime() - currentTime.getTime();
  const timeLeftSecs = Math.max(0, Math.floor(timeMsLeft / 1000));
  const mins = Math.floor(timeLeftSecs / 60);
  const secs = timeLeftSecs % 60;
  
  const TOTAL_SECS = 15 * 60;
  const progressPercent = Math.min(100, Math.max(0, (timeLeftSecs / TOTAL_SECS) * 100));

  if (isExpired) {
    return (
      <div className="bg-red-50/50 border-2 border-red-100 rounded-[2rem] p-6 shadow-sm flex items-start gap-4 animate-in fade-in duration-500">
        <div className="hidden md:flex w-12 h-12 bg-red-100 rounded-full items-center justify-center text-red-500 font-bold shrink-0">✕</div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-black bg-red-200 text-red-700 tracking-widest">
              {status === "cancelled" ? "Dibatalkan" : "Kedaluwarsa"}
            </span>
            <span className="text-xs font-bold text-slate-400">ID: {booking.id}</span>
          </div>
          <h3 className="text-xl font-black text-slate-400 line-through decoration-slate-300">{booking.court}</h3>
          <p className="text-slate-400 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        </div>
      </div>
    );
  }

  // State under verification
  if (isVerifying) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10 w-full md:w-auto flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Badge textOverride="⏳ Sedang Diverifikasi" className="bg-amber-600 text-white border-0 shadow-sm" />
            <span className="text-sm font-bold text-amber-500">Order ID: {booking.id}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{booking.court}</h3>
          <p className="text-slate-600 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        </div>
        <div className="w-full md:w-[320px] bg-white p-4 rounded-2xl border border-amber-100 shadow-[0_4px_20px_-5px_rgba(251,191,36,0.3)]">
          <p className="text-sm font-bold text-slate-500 mb-1">Status Pembayaran</p>
          <p className="text-amber-600 font-black">Bukti transfer diterima. Admin segera mengonfirmasi pesanan kamu.</p>
        </div>
      </div>
    );
  }

  // Pending Actions Needed
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 hover:border-orange-400 transition-colors rounded-[2rem] p-6 md:p-8 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="relative z-10 w-full md:w-auto flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Badge textOverride="⚠️ Action Required" className="bg-orange-600 text-white border-0 shadow-sm" />
          <span className="text-sm font-bold text-orange-400">Order ID: {booking.id}</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 group-hover:text-orange-700 transition-colors">{booking.court}</h3>
        <p className="text-slate-600 font-bold mt-1 text-sm">{booking.date} • {booking.time}</p>
        <p className="text-orange-600 font-black mt-3 text-2xl">Rp {booking.total.toLocaleString('id-ID')}</p>
      </div>
      
      <div className="w-full md:w-[320px] flex flex-col gap-4 relative z-10 shrink-0">
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-1.5 text-orange-600 font-black text-sm">
               <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Bayar Sekarang
             </div>
             <span className="text-sm font-bold text-slate-900 tabular-nums">{mins.toString().padStart(2,'0')}:{secs.toString().padStart(2,'0')}</span>
           </div>
           {/* Progress Bar */}
           <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
             <div className={`h-full rounded-full transition-all duration-1000 ${progressPercent < 20 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progressPercent}%` }}></div>
           </div>
        </div>

        <Button onClick={() => onUploadClick(booking.id)} className="w-full h-12 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(249,115,22,0.5)] bg-orange-600 hover:bg-orange-700 text-white border-0 transition-all active:scale-95">
           Upload Bukti Transfer
        </Button>
      </div>
    </div>
  )
}

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const [dbData, setDbData] = useState<Booking[]>(MOCK_DB_INIT);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [toastQueue, setToastQueue] = useState<{msg: string, type: 'success'|'error'}[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadBookingId, setUploadBookingId] = useState<string>("");

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 600);
    const ticker = setInterval(() => setCurrentTime(new Date()), 5000); 
    return () => clearInterval(ticker);
  }, []);

  const bookingsWithStatus = dbData.map(b => ({
    ...b,
    status: getBookingStatus(b, currentTime)
  }));

  const activeBookings = bookingsWithStatus.filter(b => b.status === "pending" || b.status === "pending_verification");
  const historyBookings = bookingsWithStatus.filter(b => b.status !== "pending" && b.status !== "pending_verification");

  const totalBooking = bookingsWithStatus.length;
  const activeCount = activeBookings.length;
  const totalSpent = bookingsWithStatus.filter(h => h.status === "paid").reduce((acc, curr) => acc + curr.total, 0);

  const filteredHistory = historyBookings.filter(h => {
    if (filter === "semua") return true;
    return h.status === filter;
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastQueue(prev => [...prev, { msg, type }]);
    setTimeout(() => setToastQueue(prev => prev.slice(1)), 3000);
  };

  const handleOpenUploadModal = (id: string) => {
    setUploadBookingId(id);
    setUploadModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
     // Simulasi network upload 1.5 detik
     await new Promise(r => setTimeout(r, 1500));
     
     // Update data untuk mengubah status jadi pending_verification
     setDbData(prev => prev.map(b => 
       b.id === uploadBookingId ? { ...b, uploadedAt: new Date() } : b
     ));

     setUploadModalOpen(false);
     showToast("Bukti transfer berhasil diunggah! Menunggu verifikasi admin.", "success");
  };

  const handleRebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = '/booking'; 
  };

  return (
    <div className="flex-1 bg-slate-50 p-4 md:p-6 min-h-[calc(100vh-64px)] relative">
      
      {/* Toast System */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toastQueue.map((t, idx) => (
          <Toast key={idx} isOpen={true} message={t.msg} type={t.type} onClose={() => {}} />
        ))}
      </div>

      {/* Upload Modal Drawer */}
      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onSubmit={handleFileUpload} 
        bookingId={uploadBookingId} 
      />

      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        <header>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 font-bold">Manage your padel bookings and payments.</p>
        </header>

        {/* 1. MINI STATS 🔥 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Booking</p>
             <p className="text-3xl font-black text-slate-900">{totalBooking}</p>
           </div>
           <div className="bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Booking Aktif</p>
             <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-slate-900">{activeCount}</p>
                {activeCount > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>}
             </div>
           </div>
           <div className="col-span-2 md:col-span-1 bg-white p-5 md:p-6 border-2 border-slate-100 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
             <p className="text-3xl font-black text-blue-600">Rp {(totalSpent / 1000000).toFixed(1)} JT</p>
           </div>
        </div>

        {/* 2. ACTION REQUIRED SECTION */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
            Pekerjaan Rumah
            {activeCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{activeCount}</span>}
          </h2>
          
          {isLoading ? (
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm animate-pulse h-32"></div>
          ) : activeBookings.length > 0 ? (
            <div className="space-y-4">
              {activeBookings.map((b) => (
                <ActiveBookingCard key={b.id} booking={b} onUploadClick={handleOpenUploadModal} />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-12 px-6">
              <h3 className="text-lg font-black text-slate-400 mb-2">Semua lunas! 🎉</h3>
              <p className="text-slate-400 font-medium text-sm">Tidak ada tagihan yang tertunda.</p>
            </div>
          )}
        </section>

        {/* 3. HISTORY SECTION with FILTER */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-900">Riwayat Booking</h2>
            
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-auto overflow-x-auto hide-scrollbar">
              {["semua", "paid", "expired", "cancelled"].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {f === "paid" ? "Selesai" : f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
             <div className="bg-white border text-center border-slate-100 rounded-[2rem] h-64 animate-pulse"></div>
          ) : (
             <div className="grid grid-cols-1 gap-4">
               {filteredHistory.map((item) => (
                 <div 
                   key={item.id} 
                   onClick={() => setSelectedBooking(item)}
                   className="group bg-white border-2 border-slate-100 hover:border-blue-200 rounded-[1.5rem] md:rounded-full p-5 md:py-4 md:px-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
                 >
                    <div className="bg-slate-100 text-slate-500 font-black text-xs px-3 py-1.5 rounded-full shrink-0">
                      {item.id}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg md:text-base">{item.court}</h4>
                      <p className="text-slate-500 font-medium text-sm md:text-xs mt-0.5">{item.date} • {item.time}</p>
                    </div>

                    <div className="font-black text-slate-900 text-lg md:text-base w-full md:w-auto flex justify-between md:block items-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-2 md:mt-0">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                      Rp {item.total.toLocaleString('id-ID')}
                    </div>

                    <div className="shrink-0 hidden md:block w-48 text-right">
                       <StatusBadge status={item.status as BookingStatus} />
                    </div>

                    <div className="w-full md:w-auto shrink-0 flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0">
                      <div className="md:hidden">
                        <StatusBadge status={item.status as BookingStatus} />
                      </div>
                      <Button onClick={handleRebook} size="sm" variant="secondary" className="whitespace-nowrap px-4 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 border border-slate-200">
                         Book Again
                      </Button>
                    </div>
                 </div>
               ))}
               
               {filteredHistory.length === 0 && (
                 <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold mb-2">Tidak ada data history.</p>
                 </div>
               )}
             </div>
          )}
        </section>

      </div>

      {/* 4. DETAIL MODAL DIALOG 🔥 */}
      {selectedBooking && (() => {
        const status = selectedBooking.status as BookingStatus;
        const isPaid = status === "paid";
        const isExpired = status === "expired";
        const isPending = status === "pending" || status === "pending_verification";
        const isVerifying = status === "pending_verification";
        const isCancelled = status === "cancelled";

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-900 p-6 flex justify-between items-start relative">
                <div>
                    <div className="bg-white/20 text-white backdrop-blur-md px-3 py-1 text-xs font-bold rounded-full mb-3 inline-block">
                      {selectedBooking.id}
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight mb-1">{selectedBooking.court}</h3>
                    <p className="text-slate-400 font-medium text-sm">{selectedBooking.date} • {selectedBooking.time}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">✕</button>
              </div>

              <div className="p-6">
                {/* Timeline Status */}
                <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Status Timeline</h4>
                  <div className="flex gap-3 relative">
                      <div className="absolute top-[10px] left-[10px] bottom-[10px] w-0.5 bg-slate-200 -z-0"></div>
                      <div className="flex flex-col gap-4 z-10 w-full">
                        
                        {/* 1. Dibuat */}
                        <div className="flex gap-4 items-center">
                          <div className="w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-50 shadow-sm shrink-0 flex items-center justify-center">
                             <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div className="flex justify-between w-full items-center">
                            <span className="text-sm font-bold text-slate-900">Booking Dibuat</span>
                            <span className="text-xs font-bold text-slate-400">
                              {selectedBooking.createdAt.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>

                        {/* 2. Upload Bukti Transfer */}
                        <div className={`flex gap-4 items-center ${!isVerifying && !isPaid && !isExpired && !isCancelled ? 'opacity-70' : 'opacity-100'}`}>
                          <div className={`w-5 h-5 rounded-full border-4 border-slate-50 shadow-sm shrink-0 flex items-center justify-center 
                            ${selectedBooking.uploadedAt ? 'bg-emerald-500' : isExpired || isCancelled ? 'bg-red-500' : 'bg-slate-300'}`}>
                             {selectedBooking.uploadedAt && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <div className="flex justify-between w-full items-center">
                            <span className={`text-sm font-bold ${isExpired || isCancelled ? 'text-red-600 line-through' : 'text-slate-900'}`}>
                              Upload Bukti Bayar
                            </span>
                            {selectedBooking.uploadedAt && (
                              <span className="text-xs font-bold text-slate-400">
                                {selectedBooking.uploadedAt.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                            {!selectedBooking.uploadedAt && isPending && <span className="text-xs font-bold text-amber-500">Menunggu</span>}
                            {(isExpired || isCancelled) && <span className="text-xs font-bold text-red-500">✕ Gagal</span>}
                          </div>
                        </div>

                        {/* 3. Pembayaran */}
                        <div className={`flex gap-4 items-center ${isPending ? 'opacity-70' : 'opacity-100'}`}>
                          <div className={`w-5 h-5 rounded-full border-4 border-slate-50 shadow-sm shrink-0 flex items-center justify-center 
                            ${isPaid ? 'bg-emerald-500' : isExpired || isCancelled ? 'bg-red-500' : 'bg-slate-300'}`}>
                             {isPaid && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <div className="flex justify-between w-full items-center">
                            <span className={`text-sm font-bold ${isExpired || isCancelled ? 'text-red-600 line-through' : 'text-slate-900'}`}>
                              Konfirmasi Selesai
                            </span>
                            {isPaid && selectedBooking.paidAt && (
                              <span className="text-xs font-bold text-slate-400">
                                {selectedBooking.paidAt.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                            {isVerifying && <span className="text-xs font-bold text-amber-500">⏳ Verifikasi Admin</span>}
                            {isPending && !isVerifying && <span className="text-xs font-bold text-slate-400">Belum</span>}
                            {(isExpired || isCancelled) && <span className="text-xs font-bold text-red-500">✕ Batal</span>}
                          </div>
                        </div>

                        {/* 4. Kedaluwarsa (Jika ada) */}
                        <div className={`flex gap-4 items-center`}>
                          <div className={`w-5 h-5 rounded-full border-4 border-slate-50 shadow-sm shrink-0 flex items-center justify-center 
                            ${isExpired || isCancelled ? 'bg-red-500' : 'bg-slate-200'}`}>
                              {(isExpired || isCancelled) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <div className="flex justify-between w-full items-center">
                            <span className={`text-sm font-bold ${isExpired || isCancelled ? 'text-red-600' : 'text-slate-400'}`}>
                              Kedaluwarsa / Batal
                            </span>
                            {(isExpired || isCancelled) && (
                              <span className="text-xs font-bold text-red-500">
                                Waktu Habis
                              </span>
                            )}
                            {isPaid && <span className="text-xs font-bold text-slate-400">Tidak Aktif</span>}
                            {isPending && <span className="text-xs font-bold text-slate-400">Belum</span>}
                          </div>
                        </div>

                      </div>
                  </div>
                </div>

                {/* Info Lengkap */}
                <div className="space-y-3 mb-8 px-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium text-sm">Durasi Bermain</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedBooking.duration} Jam</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-900">Total Dibayar</span>
                    <span className="text-xl font-black text-blue-600">Rp {selectedBooking.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-slate-200" disabled={isExpired || isCancelled}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      {isExpired || isCancelled ? "Invoice Void" : "Download Invoice"}
                  </Button>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={handleRebook}>Book Again</Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  );
}
