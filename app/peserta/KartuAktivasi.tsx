"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, X } from "lucide-react";
import { formatRupiah, HARGA_KONSULTASI, type PembayaranRingkas } from "@/lib/pembayaran";
import FormAktivasi from "@/app/pembayaran/FormAktivasi";

type Props = {
  nama: string;
  whatsapp: string;
  email: string;
  rekening: { bankNama: string; bankNo: string; bankAtasNama: string };
  grupUmum: { nama: string; deskripsi: string; url: string };
  pembayaran: PembayaranRingkas | null;
};

/**
 * Kartu aktivasi di ruang member untuk peserta yang belum mengirim bukti.
 * Form pembayaran dibuka sebagai popup, dan pengingat ringkas muncul tiap 10 detik.
 */
export default function KartuAktivasi(props: Props) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [tampilPengingat, setTampilPengingat] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setTampilPengingat(true), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  function selesaiBayar() {
    setBuka(false);
    setTampilPengingat(false);
    router.refresh();
  }

  return (
    <>
      <section className="mb-8 rounded-md border border-[#0052A4]/20 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#0052A4]/10 dark:bg-sky-400/15 text-[#0052A4] dark:text-sky-400">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Selesaikan pembayaran untuk aktivasi akun
              </h2>
              <span className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Belum aktif
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Transfer biaya layanan <b className="text-slate-900 dark:text-slate-50">{formatRupiah(HARGA_KONSULTASI)}</b>{" "}
              lalu unggah bukti transfer. Setelah admin memverifikasi, video, grup, dan jadwal
              konsultasi lanjutan otomatis terbuka.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTampilPengingat(false);
                  setBuka(true);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-[#0052A4] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00438a]"
              >
                Aktivasi Akun Peserta <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {buka && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Aktifasi Akun Peserta"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBuka(false);
          }}
        >
          <div className="relative my-2 w-full max-w-2xl rounded-md bg-[#EEF1F8] shadow-2xl dark:bg-slate-950 dark:ring-1 dark:ring-slate-700">
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <FormAktivasi {...props} onSelesai={selesaiBayar} />
            </div>
          </div>
        </div>
      )}

      {tampilPengingat && !buka && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-4 z-40 lg:bottom-4 w-[calc(100%-2rem)] max-w-sm rounded-md border border-[#0052A4]/20 bg-white dark:bg-slate-900 p-4 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setTampilPengingat(false)}
            aria-label="Tutup pengingat"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="pr-8 text-sm font-bold text-slate-900 dark:text-slate-50">Selesaikan aktivasi akun</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
            Transfer {formatRupiah(HARGA_KONSULTASI)} dan unggah bukti transfer agar ruang member
            terbuka.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTampilPengingat(false);
                setBuka(true);
              }}
              className="rounded-md bg-[#0052A4] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00438a]"
            >
              Bayar sekarang
            </button>
          </div>
        </div>
      )}
    </>
  );
}
