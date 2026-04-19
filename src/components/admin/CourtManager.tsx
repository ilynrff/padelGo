"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type Court = {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  image?: string | null;
};

type EditingCourt = {
  id?: string;
  name: string;
  location: string;
  pricePerHour: number;
  image?: string;
};

export function CourtManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCourt, setEditingCourt] = useState<EditingCourt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Court[]>("/api/courts");
      setCourts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
      setCourts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => {
    setEditingCourt({ name: "", location: "", pricePerHour: 0, image: "" });
    setModalMode("add");
  };

  const openEdit = (court: Court) => {
    setEditingCourt({
      id: court.id,
      name: court.name || "",
      location: court.location || "",
      pricePerHour: court.pricePerHour || 0,
      image: court.image || "",
    });
    setModalMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    setIsSaving(true);
    try {
      const payload = {
        name: editingCourt.name,
        location: editingCourt.location,
        pricePerHour: Number(editingCourt.pricePerHour),
        image: editingCourt.image || null,
      };

      if (modalMode === "add") {
        await fetchJson<Court>("/api/courts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson<Court>(`/api/courts/${editingCourt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setToast({ msg: "Court tersimpan.", type: "success" });
      setModalMode(null);
      setEditingCourt(null);
      await refresh();
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus lapangan ini?")) return;
    try {
      await fetchJson<{ success: boolean }>(`/api/courts/${id}`, { method: "DELETE" });
      setToast({ msg: "Court terhapus.", type: "success" });
      await refresh();
    } catch (e: unknown) {
      setToast({ msg: getErrorMessage(e) || "Terjadi kesalahan", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast isOpen={true} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-black text-xl text-slate-900">Data Lapangan Padel</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} isLoading={isLoading}>
            Refresh
          </Button>
          <Button onClick={openAdd}>+ Tambah Lapangan</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 animate-pulse">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-900">Rp {Number(c.pricePerHour || 0).toLocaleString("id-ID")}/jam</p>
                </div>
                <h3 className="font-black text-lg text-slate-900 mb-1">{c.name}</h3>
                <p className="text-slate-500 font-medium text-sm mb-4">{c.location}</p>
              </div>
              <div className="flex gap-2">
                <Button size="full" variant="outline" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  size="full"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => handleDelete(c.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
          {courts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold">Belum ada data lapangan.</div>
          )}
        </div>
      )}

      {modalMode && editingCourt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-black text-xl text-slate-900 mb-6">{modalMode === "add" ? "Tambah Lapangan" : "Edit Lapangan"}</h3>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Lapangan</label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500"
                  value={editingCourt.name}
                  onChange={(e) => setEditingCourt({ ...editingCourt, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lokasi</label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500"
                  value={editingCourt.location}
                  onChange={(e) => setEditingCourt({ ...editingCourt, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Harga / Jam</label>
                <input
                  required
                  type="number"
                  min={0}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500"
                  value={editingCourt.pricePerHour ?? ""}
                  onChange={(e) => setEditingCourt({ ...editingCourt, pricePerHour: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Image URL (optional)</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-blue-500"
                  value={editingCourt.image ?? ""}
                  onChange={(e) => setEditingCourt({ ...editingCourt, image: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSaving}
                onClick={() => {
                  setModalMode(null);
                  setEditingCourt(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" className="w-full" isLoading={isSaving}>
                Simpan
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
