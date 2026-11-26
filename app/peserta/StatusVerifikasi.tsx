"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import FormKupon from "@/app/pembayaran/FormKupon";

/**
 * Card paling atas ruang member saat pembayaran masih menunggu verifikasi.
 * Tombol "Cek status terbaru" memuat ulang data server; halaman akan otomatis
 * terbuka ketika admin menyetujui pembayaran.
 */
export default function StatusVerifikasi({ createdAt }: { createdAt: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Format lokal (id-ID), mengikuti zona waktu peserta di browser.
  const waktu = new Date(createdAt).toLocaleString("id-ID");

  function cekStatus() {
    startTransition(() => router.refresh());
  }

  // Cek berkala agar peserta tidak perlu menekan tombol terus-menerus.
  useEffect(() => {
    const timer = window.setInterval(() => {
      startTransition(() => router.refresh());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <section
      aria-live="polite"
      className="mb-8 rounded-md border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Menunggu verifikasi admin</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Bukti transfer Anda sudah kami terima. Akses peserta akan terbuka otomatis
            setelah admin menyetujui pembayaran. Biasanya memakan waktu beberapa saat.
          </p>
          <button
            type="button"
            onClick={cekStatus}
            disabled={isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Cek status terbaru
          </button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
            Status terakhir: Menunggu verifikasi · {waktu}
          </p>
          <div className="mt-5 max-w-xl">
            <FormKupon onBerhasil={() => router.refresh()} />
          </div>
        </div>
      </div>
    </section>
  );
}
