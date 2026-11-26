"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CalendarCheck, Loader2 } from "lucide-react";
import { STATUS_LABEL, formatTanggal } from "@/lib/jadwal-format";
import { formatPosisi } from "@/lib/posisi";

type Slot = {
  id: number;
  kategori: string;
  tanggal: string;
  jam: string;
  kuota: number;
  terisi: number;
  sisa: number;
};
type Jadwal = {
  id: number;
  tanggal: string;
  jam: string;
  catatan: string | null;
  status: string;
};
type Waitinglist = { status: string; catatan: string | null; createdAt: string } | null;
type Data = { slots: Slot[]; jadwal: Jadwal[]; waitinglist: Waitinglist };

const AKTIF = ["menunggu", "dikonfirmasi"];

export default function JadwalSesi({
  posisi,
  onSelesai,
}: {
  /** Kategori A–D yang dipilih peserta; dipakai sebagai penanda jadwal. */
  posisi: string | null;
  /** Dipanggil setelah jadwal / waitinglist berhasil dikirim. */
  onSelesai: (jenis: "jadwal" | "waitinglist") => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState("");
  const [slotId, setSlotId] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/peserta/jadwal", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setLoadError("");
    } catch {
      setLoadError("Gagal memuat jadwal. Muat ulang halaman.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const slot = data?.slots.find((s) => s.id === slotId);
    if (!slot) {
      setError("Pilih jadwal terlebih dulu.");
      return;
    }
    if (slot.sisa <= 0) {
      // Slot penuh: otomatis masuk waitinglist.
      await daftarWaitinglist();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/peserta/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: slot.tanggal, jam: slot.jam, catatan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Jadwal belum tersimpan. Coba lagi.");
        if (res.status === 409) await load();
        return;
      }
      await load();
      onSelesai(json?.jenis === "waitinglist" ? "waitinglist" : "jadwal");
    } catch {
      setError("Jadwal belum tersimpan. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  async function daftarWaitinglist() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/peserta/waitinglist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Waitinglist belum tersimpan. Coba lagi.");
        return;
      }
      await load();
      onSelesai("waitinglist");
    } catch {
      setError("Waitinglist belum tersimpan. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  async function batalkan(id: number) {
    if (!confirm("Batalkan jadwal sesi ini?")) return;
    setError("");
    const res = await fetch(`/api/peserta/jadwal?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSlotId(null);
      await load();
    } else setError("Jadwal tidak dapat dibatalkan.");
  }

  if (!data) {
    return (
      <div className="grid h-40 place-items-center">
        {loadError ? (
          <p className="px-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
        )}
      </div>
    );
  }

  const aktif = data.jadwal.find((j) => AKTIF.includes(j.status));
  const riwayat = data.jadwal.filter((j) => j !== aktif);
  const pilihan = data.slots.find((s) => s.id === slotId);
  const penuh = !!pilihan && pilihan.sisa <= 0;
  const tanggalGroup = Array.from(new Set(data.slots.map((s) => s.tanggal)));

  return (
    <div className="space-y-4">
      {loadError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
        </p>
      )}

      {aktif ? (
        <section className="rounded-md border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <CalendarCheck className="h-4 w-4 text-[#0052A4] dark:text-sky-400" /> Jadwal konsultasi Anda
          </h3>
          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">
            {formatTanggal(aktif.tanggal)} · {aktif.jam} WIB
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPosisi(posisi)}</p>
          <span className="mt-2 inline-block rounded-md bg-blue-50 dark:bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-[#0052A4] dark:text-sky-400">
            {STATUS_LABEL[aktif.status]?.label ?? aktif.status}
          </span>
          {aktif.catatan && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Catatan: {aktif.catatan}</p>}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Admin akan menghubungi Anda untuk informasi selanjutnya.
          </p>
          <button
            onClick={() => batalkan(aktif.id)}
            className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            Batalkan &amp; pilih ulang
          </button>
        </section>
      ) : data.waitinglist ? (
        <section className="rounded-md border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Anda sudah masuk waitinglist</h3>
          <p className="mt-1.5 text-sm leading-6 text-amber-800 dark:text-amber-300">
            Terima kasih. Data Anda akan kami prioritaskan dan admin akan menghubungi Anda untuk
            informasi selanjutnya.
          </p>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            Jadwal konsultasi untuk kategori{" "}
            <b>{formatPosisi(posisi) || "yang Anda pilih"}</b>. Pilih salah satu slot yang sudah
            ditetapkan admin; setiap slot maksimal diisi <b>5 peserta</b>. Jika slot yang Anda pilih
            sudah penuh, Anda otomatis masuk waitinglist.
          </p>

          {data.slots.length === 0 ? (
            <div className="rounded-md bg-slate-50 dark:bg-slate-800/60 px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300">
              Admin belum menetapkan jadwal. Anda bisa mendaftar ke waitinglist agar diprioritaskan.
            </div>
          ) : (
            tanggalGroup.map((tanggal) => (
              <div key={tanggal}>
                <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatTanggal(tanggal)}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {data.slots
                    .filter((s) => s.tanggal === tanggal)
                    .map((s) => {
                      const full = s.sisa <= 0;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSlotId(s.id);
                            setError("");
                          }}
                          className={`h-auto min-h-14 rounded-md px-2 py-2 text-center text-sm transition-colors ${
                            slotId === s.id
                              ? "bg-[#0052A4] text-white"
                              : full
                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="block font-medium">{s.jam}</span>
                          <span className={`block text-[11px] ${slotId === s.id ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                            {full ? "Penuh · waitinglist" : `${s.sisa}/${s.kuota} tersedia`}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))
          )}

          {penuh && (
            <p role="status" className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              Jadwal ini sudah penuh. Jika dilanjutkan, Anda akan otomatis masuk waitinglist dan kami
              akan menghubungi Anda bila ada slot tersedia.
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Catatan <span className="font-normal text-slate-500 dark:text-slate-400">(opsional)</span>
            </span>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Hal yang ingin dibahas saat konsultasi"
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-[#0052A4] dark:focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
            />
          </label>

          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !pilihan}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#0052A4] px-5 text-sm font-semibold text-white hover:bg-[#00438a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <CalendarClock className="h-4 w-4" /> {penuh ? "Masuk waitinglist" : "Kirim jadwal"}
            </button>
            {data.slots.length === 0 && (
              <button
                type="button"
                disabled={saving}
                onClick={daftarWaitinglist}
                className="h-11 rounded-md border border-[#0052A4] dark:border-sky-400 px-5 text-sm font-semibold text-[#0052A4] dark:text-sky-400 hover:bg-[#0052A4]/5 dark:hover:bg-sky-400/10 disabled:opacity-60"
              >
                Waitinglist
              </button>
            )}
          </div>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Peserta di waitinglist kami prioritaskan saat ada slot baru atau yang batal.
          </p>
        </form>
      )}

      {riwayat.length > 0 && (
        <section className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Riwayat jadwal</h3>
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {riwayat.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-slate-600 dark:text-slate-300">
                  {formatTanggal(j.tanggal, false)} · {j.jam}
                </span>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {STATUS_LABEL[j.status]?.label ?? j.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
