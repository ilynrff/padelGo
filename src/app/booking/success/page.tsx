"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const courtName = searchParams.get('courtName');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const price = searchParams.get('price');
  
  return (
    <Card className="w-full max-w-lg p-8 md:p-12 rounded-[2rem] text-center shadow-xl border-slate-100 relative overflow-hidden">
        {/* Dekorasi Visual Sukses */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 relative z-10 shadow-inner">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">Booking Berhasil!</h1>
        <p className="text-slate-500 font-bold mb-8 leading-relaxed">
          Sip, jadwal incaranmu sudah diamankan sementara. Konfirmasi pembayaran dalam waktu 15 menit agar tidak dibatalkan otomatis oleh sistem.
        </p>
        
        <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 mb-8 shadow-inner border border-slate-100">
           <div className="flex justify-between items-center border-b border-slate-200 pb-3">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lapangan</span>
             <span className="text-sm font-black text-slate-900">{courtName || "Padel Court"}</span>
           </div>
           <div className="flex justify-between items-center border-b border-slate-200 pb-3">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal & Waktu</span>
             <span className="text-sm font-black text-slate-900 block text-right">{date} Bulan ini <br/> {time}</span>
           </div>
           <div className="flex justify-between items-center pt-1">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Pembayaran</span>
             <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase">Pending</span>
           </div>
           <div className="flex justify-between items-center pt-2">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Tagihan</span>
             <span className="text-2xl font-black text-blue-600">Rp {Number(price || 0).toLocaleString('id-ID')}</span>
           </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="w-full">
            <Button size="full" className="rounded-xl shadow-[0_6px_20px_-4px_rgba(59,130,246,0.5)]">
              Bayar Sekarang di Dashboard
            </Button>
          </Link>
          <Link href="/courts" className="w-full">
            <Button variant="outline" size="full" className="rounded-xl">Kembali Melihat Jadwal</Button>
          </Link>
        </div>
    </Card>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      <Suspense fallback={<div className="animate-pulse w-full max-w-lg h-[600px] bg-white rounded-[2rem] border border-slate-100 shadow-sm"></div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
