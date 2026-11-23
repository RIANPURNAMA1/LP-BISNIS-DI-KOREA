"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

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
      className="mb-8 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-amber-600" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Menunggu verifikasi admin</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Bukti transfer Anda sudah kami terima. Akses peserta akan terbuka otomatis
            setelah admin menyetujui pembayaran. Biasanya memakan waktu beberapa saat.
          </p>
          <button
            type="button"
            onClick={cekStatus}
            disabled={isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Cek status terbaru
          </button>
          <p className="mt-3 text-xs text-slate-500" suppressHydrationWarning>
            Status terakhir: Menunggu verifikasi · {waktu}
          </p>
        </div>
      </div>
    </section>
  );
}
