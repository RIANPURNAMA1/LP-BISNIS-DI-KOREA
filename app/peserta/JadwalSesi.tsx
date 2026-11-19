"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CalendarCheck, Loader2 } from "lucide-react";
import { STATUS_LABEL, formatTanggal } from "@/lib/jadwal-format";

type Jadwal = { id: number; tanggal: string; jam: string; catatan: string | null; status: string };
type Data = { jadwal: Jadwal[]; tanggal: string[]; jam: string[]; terisi: string[] };

const AKTIF = ["menunggu", "dikonfirmasi"];

export default function JadwalSesi() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
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
    if (!tanggal || !jam) {
      setError("Pilih tanggal dan jam terlebih dulu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/peserta/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal, jam, catatan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Jadwal belum tersimpan. Coba lagi.");
        if (res.status === 409) await load();
        return;
      }
      setOpen(false);
      setTanggal("");
      setJam("");
      setCatatan("");
      await load();
    } catch {
      setError("Jadwal belum tersimpan. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  async function batalkan(id: number) {
    if (!confirm("Batalkan jadwal sesi ini?")) return;
    const res = await fetch(`/api/peserta/jadwal?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setLoadError("Jadwal tidak dapat dibatalkan.");
  }

  if (!data) {
    return (
      <section className="grid h-32 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loadError ? (
          <p className="px-4 text-sm text-red-600">{loadError}</p>
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        )}
      </section>
    );
  }

  const aktif = data.jadwal.find((j) => AKTIF.includes(j.status));
  const riwayat = data.jadwal.filter((j) => j !== aktif);
  const terisi = new Set(data.terisi);
  const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 sm:p-6";

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
        </p>
      )}

      {aktif ? (
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <CalendarCheck className="h-5 w-5 text-[#0052A4]" /> Jadwal sesi Anda
          </h2>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {formatTanggal(aktif.tanggal)} · {aktif.jam} WIB
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABEL[aktif.status]?.tone}`}
          >
            {STATUS_LABEL[aktif.status]?.label}
          </span>
          {aktif.catatan && <p className="mt-3 text-sm text-slate-600">Catatan: {aktif.catatan}</p>}
          <p className="mt-3 text-xs text-slate-500">
            Link meeting akan dikirim admin melalui WhatsApp setelah jadwal dikonfirmasi.
          </p>
          <button
            onClick={() => batalkan(aktif.id)}
            className="mt-4 rounded-full px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
          >
            Batalkan &amp; pilih ulang
          </button>
        </section>
      ) : (
        <section className={card}>
          <h2 className="text-base font-bold text-slate-900">Sesi meeting online</h2>
          <p className="mt-1 text-sm text-slate-600">
            Bahas Project Indonesia-Korea bersama tim kami melalui meeting online.
          </p>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00438a] sm:w-auto"
            >
              <CalendarClock className="h-4 w-4" /> Jadwalkan sesi selanjutnya
            </button>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Tanggal</span>
                <select
                  value={tanggal}
                  onChange={(e) => {
                    setTanggal(e.target.value);
                    setJam("");
                  }}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
                >
                  <option value="">Pilih tanggal</option>
                  {data.tanggal.map((t) => (
                    <option key={t} value={t}>
                      {formatTanggal(t)}
                    </option>
                  ))}
                </select>
              </label>

              {tanggal && (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Jam <span className="font-normal text-slate-500">(WIB)</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {data.jam.map((j) => {
                      const penuh = terisi.has(`${tanggal}_${j}`);
                      return (
                        <button
                          key={j}
                          type="button"
                          disabled={penuh}
                          onClick={() => setJam(j)}
                          className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                            jam === j
                              ? "bg-[#0052A4] text-white"
                              : penuh
                                ? "cursor-not-allowed bg-slate-100 text-slate-300 line-through"
                                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {j}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Catatan <span className="font-normal text-slate-500">(opsional)</span>
                </span>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Hal yang ingin Anda bahas"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
                />
              </label>

              {error && (
                <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#0052A4] text-sm font-semibold text-white transition-colors hover:bg-[#00438a] disabled:opacity-60 sm:flex-none sm:px-8"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kirim jadwal
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 rounded-full px-5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {riwayat.length > 0 && (
        <section className={card}>
          <h3 className="text-sm font-bold text-slate-900">Riwayat jadwal</h3>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {riwayat.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-slate-700">
                  {formatTanggal(j.tanggal, false)} · {j.jam}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LABEL[j.status]?.tone}`}
                >
                  {STATUS_LABEL[j.status]?.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
