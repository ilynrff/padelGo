"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";

const MOCK_WAITING = [
  { id: "BKG-101", customer: "John Doe", phone: "0812-3456-7890", court: "Indoor Panoramic Court A", datetime: "15 May 2026, 19:00", amount: 350000, uploadedAt: "14 May 2026, 21:30" },
  { id: "BKG-102", customer: "Sarah Smith", phone: "0857-9988-1234", court: "Outdoor Classic Court", datetime: "16 May 2026, 08:00", amount: 200000, uploadedAt: "15 May 2026, 06:45" },
];

export default function AdminDashboardPage() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await new Promise(res => setTimeout(res, 600));
      setData(MOCK_WAITING);
      setIsLoading(false);
    };
    load();
  }, []);

  const openApproveModal = (b: any) => {
    setSelectedBooking(b);
    setIsModalOpen(true);
  };

  const handleAction = async (action: string) => {
    setIsModalOpen(false);
    
    // Simulasi proses
    setToastMsg(`${action === 'Approved' ? '✅ Pembayaran disetujui' : '❌ Pembayaran ditolak'} untuk ${selectedBooking?.id}`);
    setToastType(action === 'Approved' ? 'success' : 'error');
    setIsToastOpen(true);
    
    // Hapus dari list (simulasi)
    setData(prev => prev.filter(item => item.id !== selectedBooking?.id));
    
    setTimeout(() => setIsToastOpen(false), 3000);
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 min-h-[calc(100vh-64px)]">
      
      <Toast isOpen={isToastOpen} message={toastMsg} type={toastType} onClose={() => setIsToastOpen(false)} />

      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-500 font-bold">Kelola booking dan verifikasi pembayaran.</p>
        </header>

        {/* Stats with skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                <div className="h-10 bg-slate-200 rounded w-16"></div>
              </div>
            ))
          ) : (
            <>
              <Card className="border-t-4 border-t-amber-400 rounded-[2rem]">
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Menunggu</h3>
                <p className="text-4xl font-black text-slate-900">{data.length}</p>
              </Card>
              <Card className="border-t-4 border-t-blue-500 rounded-[2rem]">
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Main Hari Ini</h3>
                <p className="text-4xl font-black text-slate-900">8</p>
              </Card>
              <Card className="border-t-4 border-t-emerald-500 rounded-[2rem]">
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Revenue Bulan Ini</h3>
                <p className="text-4xl font-black text-slate-900">2.4<span className="text-lg">M</span></p>
              </Card>
              <Card className="border-t-4 border-t-slate-400 rounded-[2rem]">
                <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Total User</h3>
                <p className="text-4xl font-black text-slate-900">47</p>
              </Card>
            </>
          )}
        </div>

        {/* Verification Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-slate-900">Antrian Verifikasi Pembayaran</h2>
          </div>

          {isLoading ? (
            <div className="bg-white border border-slate-100 rounded-[2rem] h-64 animate-pulse"></div>
          ) : data.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-16 px-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Semua beres!</h3>
              <p className="text-slate-500 font-medium">Tidak ada pembayaran yang perlu diverifikasi saat ini.</p>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden border-2 rounded-[2rem]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b-2 border-slate-100">
                    <tr>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Booking ID</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                      <th className="p-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-50">
                    {data.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 px-6 font-black text-sm text-slate-900">{item.id}</td>
                        <td className="p-4 px-6">
                          <p className="font-bold text-sm text-slate-800">{item.customer}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.phone}</p>
                        </td>
                        <td className="p-4 px-6">
                          <p className="font-bold text-sm text-slate-700">{item.court}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{item.datetime}</p>
                        </td>
                        <td className="p-4 px-6 font-black text-sm text-blue-600">Rp {item.amount.toLocaleString('id-ID')}</td>
                        <td className="p-4 px-6 text-right">
                           <Button size="sm" onClick={() => openApproveModal(item)} className="opacity-80 group-hover:opacity-100 transition-opacity">
                              Verifikasi
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

      </div>

      {/* Verification Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Verifikasi Bukti Pembayaran">
         {selectedBooking && (
            <div className="space-y-6">
               <div className="bg-slate-50 p-5 rounded-2xl grid grid-cols-2 gap-4 border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Booking ID</p>
                    <p className="text-lg font-black text-slate-900">{selectedBooking.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Jumlah</p>
                    <p className="text-lg font-black text-blue-600">Rp {selectedBooking.amount.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBooking.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Uploaded At</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBooking.uploadedAt}</p>
                  </div>
               </div>

               {/* Mock Image Placeholder */}
               <div className="w-full h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <p className="text-slate-400 font-bold text-sm">Bukti transfer yang di-upload</p>
               </div>
               
               <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button variant="danger" className="w-full" onClick={() => handleAction('Rejected')}>Tolak</Button>
                  <Button variant="primary" className="w-full" onClick={() => handleAction('Approved')}>Setujui Pembayaran</Button>
               </div>
            </div>
         )}
      </Modal>

    </div>
  );
}
