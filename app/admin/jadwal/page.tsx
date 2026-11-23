"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { formatTanggal, STATUS_LABEL } from "@/lib/jadwal-format";
import { POSISI_OPSI, formatPosisi } from "@/lib/posisi";

type Slot = {
  id: number;
  kategori: string;
  tanggal: string;
  jam: string;
  kuota: number;
  aktif: boolean;
  terisi: number;
  sisa: number;
};
type Peserta = {
  id: number;
  tanggal: string;
  jam: string;
  status: string;
  catatan: string | null;
  pendaftaran: {
    id: number;
    nama: string;
    whatsapp: string;
    email: string;
    posisiKonsultasi: string | null;
  };
};
type Waiting = {
  id: number;
  posisi: string | null;
  catatan: string | null;
  status: string;
  createdAt: string;
  pendaftaran: { id: number; nama: string; whatsapp: string; email: string };
};
type Msg = { ok: boolean; text: string } | null;

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const primary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0052A4] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#00438a] disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export default function AdminJadwal() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [waitinglist, setWaitinglist] = useState<Waiting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const [kategori, setKategori] = useState("A");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("09:00");
  const [kuota, setKuota] = useState(5);
  const [editId, setEditId] = useState<number | null>(null);
  const [editKategori, setEditKategori] = useState("A");
  const [editTanggal, setEditTanggal] = useState("");
  const [editJam, setEditJam] = useState("");
  const [editKuota, setEditKuota] = useState(5);
  const [lihat, setLihat] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        fetch("/api/admin/jadwal/slot", { cache: "no-store" }),
        fetch("/api/admin/jadwal", { cache: "no-store" }),
        fetch("/api/admin/waitinglist", { cache: "no-store" }),
      ]);
      const ja = await a.json();
      const jb = await b.json();
      const jc = await c.json();
      if (!a.ok || !b.ok || !c.ok) throw new Error(ja.error || jb.error || jc.error);
      setSlots(ja.data);
      setPeserta(jb.data);
      setWaitinglist(jc.data);
    } catch {
      setMsg({ ok: false, text: "Gagal memuat data jadwal." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/jadwal/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kategori, tanggal, jam, kuota }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Slot belum tersimpan.");
      setTanggal("");
      setMsg({ ok: true, text: "Slot berhasil ditambahkan. Peserta bisa memilih jadwal ini." });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Slot belum tersimpan." });
    } finally {
      setSaving(false);
    }
  }

  function mulaiEdit(s: Slot) {
    setEditId(s.id);
    setEditKategori(s.kategori);
    setEditTanggal(s.tanggal);
    setEditJam(s.jam);
    setEditKuota(s.kuota);
    setMsg(null);
  }

  async function simpanEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/jadwal/slot/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori: editKategori,
          tanggal: editTanggal,
          jam: editJam,
          kuota: editKuota,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Perubahan belum tersimpan.");
      setEditId(null);
      setMsg({ ok: true, text: "Slot berhasil diperbarui." });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Perubahan belum tersimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(s: Slot) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/jadwal/slot/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !s.aktif }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Status belum berubah.");
      setMsg({
        ok: true,
        text: s.aktif ? "Slot dinonaktifkan." : "Slot diaktifkan kembali.",
      });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Status belum berubah." });
    } finally {
      setSaving(false);
    }
  }

  async function hapus(s: Slot) {
    if (!confirm(`Hapus slot ${formatTanggal(s.tanggal, false)} pukul ${s.jam}?`)) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/jadwal/slot/${s.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Slot belum dihapus.");
      setMsg({ ok: true, text: "Slot dihapus." });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Slot belum dihapus." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Jadwal Konsultasi Lanjutan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tetapkan slot jadwal fix untuk masing-masing kategori A–D. Setiap slot maksimal diisi
          <b> 5 peserta</b>. Saat peserta memilih kategori, jadwal kategori itu langsung tercatat dan
          <b> dikonfirmasi</b>, tanpa verifikasi admin. Jika semua slot penuh, peserta otomatis masuk
          waitinglist.
        </p>
      </header>

      {msg && (
        <div
          role={msg.ok ? "status" : "alert"}
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
            msg.ok
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* Tambah slot */}
      <form
        onSubmit={tambah}
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-[#0052A4]" /> Tambah slot jadwal
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori</span>
            <select
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={input}
            >
              {POSISI_OPSI.map((o) => (
                <option key={o.kode} value={o.kode}>
                  {formatPosisi(o.kode)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Tanggal</span>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Jam (WIB)</span>
            <input
              type="time"
              required
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Kuota</span>
            <input
              type="number"
              min={1}
              max={50}
              value={kuota}
              onChange={(e) => setKuota(Number(e.target.value))}
              className={input}
            />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className={`${primary} w-full`}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Tambah slot
            </button>
          </div>
        </div>
      </form>

      {/* Daftar slot */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <CalendarDays className="h-4 w-4 text-[#0052A4]" />
          <h2 className="text-sm font-semibold text-slate-900">Slot tersedia</h2>
          <span className="text-xs text-slate-500">({slots.length})</span>
        </div>

        {loading ? (
          <div className="grid h-32 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : slots.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Belum ada slot. Tambahkan jadwal pertama di atas.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {slots.map((s) => {
              const daftar = peserta.filter(
                (p) =>
                  p.tanggal === s.tanggal &&
                  p.jam === s.jam &&
                  (p.pendaftaran.posisiKonsultasi ?? "A") === s.kategori,
              );
              const edit = editId === s.id;
              return (
                <div key={s.id} className="p-4">
                  {edit ? (
                    <form onSubmit={simpanEdit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <select
                        required
                        value={editKategori}
                        onChange={(e) => setEditKategori(e.target.value)}
                        className={input}
                      >
                        {POSISI_OPSI.map((o) => (
                          <option key={o.kode} value={o.kode}>
                            {formatPosisi(o.kode)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        required
                        value={editTanggal}
                        onChange={(e) => setEditTanggal(e.target.value)}
                        className={input}
                      />
                      <input
                        type="time"
                        required
                        value={editJam}
                        onChange={(e) => setEditJam(e.target.value)}
                        className={input}
                      />
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editKuota}
                        onChange={(e) => setEditKuota(Number(e.target.value))}
                        className={input}
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={saving} className={primary}>
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className={secondary}
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span
                            title={formatPosisi(s.kategori)}
                            className="mb-1 inline-block rounded-full bg-[#0052A4]/10 px-2.5 py-1 text-xs font-semibold text-[#0052A4]"
                          >
                            Kategori {s.kategori}
                          </span>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatTanggal(s.tanggal)} · {s.jam} WIB
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Terisi <b>{s.terisi}</b> dari {s.kuota} kursi · sisa {s.sisa}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              s.aktif
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {s.aktif ? "Aktif" : "Nonaktif"}
                          </span>
                          <button
                            onClick={() => setLihat(lihat === s.id ? null : s.id)}
                            className={secondary}
                          >
                            <Users className="h-3.5 w-3.5" /> Lihat peserta
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                lihat === s.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <button onClick={() => mulaiEdit(s)} className={secondary}>
                            <Pencil className="h-3.5 w-3.5" /> Ubah
                          </button>
                          <button
                            onClick={() => toggleAktif(s)}
                            disabled={saving}
                            className={secondary}
                          >
                            {s.aktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            onClick={() => hapus(s)}
                            disabled={saving}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </button>
                        </div>
                      </div>

                      {lihat === s.id && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          {daftar.length === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada peserta di slot ini.</p>
                          ) : (
                            <ul className="divide-y divide-slate-200">
                              {daftar.map((p) => (
                                <li
                                  key={p.id}
                                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900">
                                      {p.pendaftaran.nama}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {p.pendaftaran.whatsapp} · {p.pendaftaran.email}
                                    </p>
                                    {p.catatan && (
                                      <p className="mt-1 text-xs text-slate-600">
                                        Catatan: {p.catatan}
                                      </p>
                                    )}
                                  </div>
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    {STATUS_LABEL[p.status]?.label ?? p.status}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Waitinglist */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Users className="h-4 w-4 text-[#0052A4]" />
          <h2 className="text-sm font-semibold text-slate-900">Waitinglist</h2>
          <span className="text-xs text-slate-500">({waitinglist.length})</span>
        </div>
        {waitinglist.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Belum ada peserta di waitinglist.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {waitinglist.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{w.pendaftaran.nama}</p>
                  <p className="text-xs text-slate-500">
                    {w.pendaftaran.whatsapp} · {w.pendaftaran.email}
                  </p>
                  {w.catatan && (
                    <p className="mt-1 text-xs text-slate-600">Catatan: {w.catatan}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {w.posisi && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Posisi {w.posisi}
                    </span>
                  )}
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {w.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Slot yang sudah dipakai peserta tidak bisa dihapus atau dipindah kategorinya — nonaktifkan
        saja agar tidak bisa dipilih. Kuota tidak boleh lebih kecil dari jumlah peserta yang sudah
        terdaftar.
      </p>
    </div>
  );
}
