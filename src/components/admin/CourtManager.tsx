"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function CourtManager() {
  const [courts, setCourts] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCourt, setEditingCourt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courts')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setCourts(data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add" && editingCourt) {
      setCourts([...courts, { ...editingCourt, id: Date.now() }]);
    } else if (modalMode === "edit" && editingCourt) {
      setCourts(courts.map(c => c.id === editingCourt.id ? editingCourt : c));
    }
    setModalMode(null);
    setEditingCourt(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus lapangan ini?")) {
      setCourts(courts.filter(c => c.id !== id));
      // TODO: implement real API delete if needed
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-black text-xl text-slate-900">Data Lapangan Padel</h2>
        <Button onClick={() => { setEditingCourt({ id: 0, name: "", location: "", price: 0, type: "Indoor" }); setModalMode("add"); }}>
          + Tambah Lapangan
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{c.type}</span>
                <p className="font-bold text-slate-900">Rp {c.price.toLocaleString('id-ID')}/jam</p>
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">{c.name}</h3>
              <p className="text-slate-500 font-medium text-sm mb-4">{c.location}</p>
            </div>
            <div className="flex gap-2">
              <Button size="full" variant="outline" onClick={() => { setEditingCourt(c); setModalMode("edit"); }}>Edit</Button>
              <Button size="full" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDelete(c.id)}>Hapus</Button>
            </div>
          </div>
        ))}
      </div>

      {modalMode && editingCourt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-black text-xl text-slate-900 mb-6">{modalMode === "add" ? "Tambah Lapangan" : "Edit Lapangan"}</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lapangan</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500" value={editingCourt.name} onChange={e => setEditingCourt({...editingCourt, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lokasi</label>
                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500" value={editingCourt.location} onChange={e => setEditingCourt({...editingCourt, location: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipe</label>
                  <select className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500" value={editingCourt.type} onChange={e => setEditingCourt({...editingCourt, type: e.target.value as "Indoor" | "Outdoor"})}>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Harga / Jam</label>
                  <input required type="number" min={0} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500" value={editingCourt.price || ""} onChange={e => setEditingCourt({...editingCourt, price: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => setModalMode(null)}>Batal</Button>
              <Button type="submit" className="w-full">Simpan</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
