"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Ticket } from "lucide-react";

/** Input kupon aktivasi: kupon valid membuka akun tanpa transfer. */
export default function FormKupon({ onBerhasil }: { onBerhasil: () => void }) {
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [berhasil, setBerhasil] = useState(false);

  // Akun sudah aktif di server saat modal tampil; lanjut otomatis setelah beberapa detik.
  useEffect(() => {
    if (!berhasil) return;
    const t = window.setTimeout(onBerhasil, 5000);
    return () => window.clearTimeout(t);
  }, [berhasil, onBerhasil]);

  async function pakai(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!kode.trim()) {
      setError("Masukkan kode kupon.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pembayaran/kupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memakai kupon.");
      setBerhasil(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memakai kupon.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-50">
        <Ticket className="h-4 w-4 text-[#0052A4] dark:text-sky-400" /> Punya kode kupon?
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Masukkan kupon untuk mengaktifkan akun tanpa transfer.
      </p>
      <form onSubmit={pakai} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={kode}
          onChange={(e) => setKode(e.target.value.toUpperCase())}
          maxLength={40}
          autoComplete="off"
          placeholder="Kode kupon"
          aria-label="Kode kupon"
          className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3.5 text-sm uppercase text-slate-900 dark:text-slate-50 placeholder:normal-case placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#0052A4] dark:focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0052A4] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#00438a] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Pakai Kupon
        </button>
      </form>
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {berhasil && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kupon-berhasil-judul"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
        >
          <div className="w-full max-w-sm rounded-md bg-white dark:bg-slate-900 p-7 text-center shadow-2xl">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-emerald-50 dark:bg-emerald-500/10 ring-8 ring-emerald-50/60 dark:ring-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h3 id="kupon-berhasil-judul" className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-50">
              Aktivasi Berhasil!
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Kupon berhasil dipakai dan akun Anda sudah aktif. Video, grup, dan jadwal konsultasi
              kini terbuka.
            </p>
            <button
              type="button"
              onClick={onBerhasil}
              autoFocus
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0052A4] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#00438a]"
            >
              Masuk ke Halaman Peserta <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
