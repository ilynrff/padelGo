"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchJson } from "@/lib/fetchJson";

type CourtImage = {
  url: string;
  isDefault: boolean;
  isActive: boolean;
};

type Court = {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  images: CourtImage[];
  description?: string | null;
};

type EditingCourt = {
  id?: string;
  name: string;
  location: string;
  pricePerHour: number;
  images: CourtImage[];
  description?: string;
};

export function CourtManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingCourt, setEditingCourt] = useState<EditingCourt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJson<Court[]>("/api/courts");
      // Backward compatibility & mapping
      const mapped = (Array.isArray(data) ? data : []).map((c) => {
        let rawImages = c.images || [];
        // If it's still string array, map it
        const images = rawImages
          .map((img: any) => {
            if (typeof img === "string")
              return { url: img, isDefault: false, isActive: true };
            return {
              url: img.url || "",
              isDefault: !!img.isDefault,
              isActive: img.isActive !== undefined ? !!img.isActive : true,
            };
          })
          .filter((img: any) => !!img.url);

        return { ...c, images };
      });
      setCourts(mapped);
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
      setCourts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => {
    setEditingCourt({ name: "", location: "", pricePerHour: 0, images: [] });
    setSelectedFiles([]);
    setModalMode("add");
  };

  const openEdit = (court: Court) => {
    setEditingCourt({
      id: court.id,
      name: court.name || "",
      location: court.location || "",
      pricePerHour: court.pricePerHour || 0,
      images: JSON.parse(JSON.stringify(court.images || [])), // deep clone
      description: court.description || "",
    });
    setSelectedFiles([]);
    setModalMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    setIsSaving(true);
    try {
      let finalImages = [...editingCourt.images];

      // 1. Upload new files if any
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Gagal upload gambar");
          const data = await res.json();
          return { url: data.url, isDefault: false, isActive: true };
        });
        const uploadedImages = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...uploadedImages];
      }

      const payload = {
        name: editingCourt.name,
        location: editingCourt.location,
        pricePerHour: Number(editingCourt.pricePerHour),
        images: finalImages.filter((img) => !!img.url),
        description: editingCourt.description || null,
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
      setSelectedFiles([]);
      await refresh();
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus lapangan ini?")) return;
    try {
      await fetchJson<{ success: boolean }>(`/api/courts/${id}`, {
        method: "DELETE",
      });
      setToast({ msg: "Court terhapus.", type: "success" });
      await refresh();
    } catch (e: unknown) {
      setToast({
        msg: getErrorMessage(e) || "Terjadi kesalahan",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          isOpen={true}
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Pengaturan Lapangan
        </h2>
        <p className="text-sm text-slate-600">Kelola data lapangan padel</p>
      </div>

      {/* Add Button */}
      <Button
        onClick={openAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        + Tambah Lapangan Baru
      </Button>

      {/* Courts List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 animate-pulse text-center">
          ⏳ Loading...
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 border-dashed p-8 text-center">
          <p className="text-slate-400 font-semibold">📭 Belum ada lapangan</p>
          <p className="text-slate-500 text-sm mt-1">
            Tambahkan lapangan baru untuk memulai
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {courts.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs whitespace-nowrap">
                        Rp {Number(c.pricePerHour || 0).toLocaleString("id-ID")}
                        /jam
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {c.images.filter((img) => img.isActive).length} Foto
                        Aktif
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base truncate">
                      {c.name}
                    </h4>
                    <p className="text-slate-600 text-sm flex items-center gap-1 mt-1">
                      <span>📍</span>
                      <span className="truncate">{c.location}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg transition-colors duration-200"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg transition-colors duration-200"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMode && editingCourt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-bold text-2xl text-slate-900 mb-6">
              {modalMode === "add" ? "Tambah Lapangan Baru" : "Edit Lapangan"}
            </h3>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Nama Lapangan
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Court A1"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.name}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Lokasi
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Basement, Level 2"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.location}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Harga Per Jam (Rp)
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={editingCourt.pricePerHour ?? ""}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      pricePerHour: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Gambar Lapangan
                </label>

                {/* Existing Images List */}
                <div className="space-y-2 mb-3">
                  {editingCourt.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-opacity ${img.isActive ? "bg-slate-50 border-slate-200" : "bg-slate-100 border-slate-200 opacity-50"}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img
                          src={img.url}
                          alt="preview"
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                            {img.isDefault ? "Default Asset" : "Custom Upload"}
                          </span>
                          <span className="text-xs font-medium text-slate-500 truncate max-w-[150px]">
                            {img.url}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {img.isDefault ? (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...editingCourt.images];
                              next[idx].isActive = !next[idx].isActive;
                              setEditingCourt({
                                ...editingCourt,
                                images: next,
                              });
                            }}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded ${img.isActive ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {img.isActive ? "Disable" : "Enable"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingCourt.images.filter(
                                (_, i) => i !== idx,
                              );
                              setEditingCourt({
                                ...editingCourt,
                                images: next,
                              });
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-200 rounded flex items-center justify-center text-[10px] font-bold text-blue-700">
                          FILE
                        </div>
                        <span className="text-xs font-medium text-blue-500 truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = selectedFiles.filter(
                            (_, i) => i !== idx,
                          );
                          setSelectedFiles(next);
                        }}
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles([...selectedFiles, ...files]);
                    }}
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Atau masukkan URL gambar..."
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setEditingCourt({
                              ...editingCourt,
                              images: [
                                ...editingCourt.images,
                                { url: val, isDefault: false, isActive: true },
                              ],
                            });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    *Tekan Enter pada input URL untuk menambahkannya ke daftar.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  placeholder="Masukkan deskripsi lapangan padel..."
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={editingCourt.description ?? ""}
                  onChange={(e) =>
                    setEditingCourt({
                      ...editingCourt,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors duration-200"
                disabled={isSaving}
                onClick={() => {
                  setModalMode(null);
                  setEditingCourt(null);
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
