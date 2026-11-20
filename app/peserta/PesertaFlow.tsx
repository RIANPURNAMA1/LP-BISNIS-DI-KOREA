"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  PlayCircle,
} from "lucide-react";
import VideoWajib from "./VideoWajib";

export type Grup = { nama: string; deskripsi: string; url: string }[];

type Popup = "grupAwal" | "video" | null;

function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7">{children}</div>
    </div>
  );
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);

function GrupList({ grup }: { grup: Grup }) {
  return (
    <ul className="space-y-3">
      {grup.map((g) => (
        <li key={g.nama} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">{g.nama}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{g.deskripsi}</p>
          {g.url ? (
            <a
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1EBE5A]"
            >
              <WaIcon /> Gabung Grup
            </a>
          ) : (
            <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
              Link grup segera dibagikan oleh admin.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function PesertaFlow({
  videoUrl,
  videoSelesai,
  konsultasiSelesai,
  grupUmum,
  grupKonsultasi,
  bolehGrupKonsultasi,
  statusPembayaran,
}: {
  videoUrl: string;
  videoSelesai: boolean;
  konsultasiSelesai: boolean;
  /** Grup umum Korean Bisnis Klub, ditampilkan ke semua peserta. */
  grupUmum: Grup[number];
  /** Grup khusus konsultasi online, muncul setelah checkout. */
  grupKonsultasi: Grup[number];
  bolehGrupKonsultasi: boolean;
  statusPembayaran: string;
}) {
  const [videoDone, setVideoDone] = useState(videoSelesai);
  const [popup, setPopup] = useState<Popup>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sebelum menonton video, peserta diminta gabung ke grup umum (sekali per sesi browser).
  useEffect(() => {
    if (videoSelesai) return;
    try {
      if (sessionStorage.getItem("grup-umum-dilihat")) return;
    } catch {
      /* penyimpanan tidak tersedia: tetap tampilkan popup */
    }
    setPopup("grupAwal");
  }, [videoSelesai]);

  function tutupPopupGrupAwal() {
    try {
      sessionStorage.setItem("grup-umum-dilihat", "1");
    } catch {
      /* abaikan */
    }
    setPopup(null);
  }

  async function handleVideoDone() {
    if (videoDone) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/peserta/progres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi: "video" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Gagal menyimpan. Coba lagi.");
      setVideoDone(true);
      setPopup("video");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan progres. Muat ulang halaman.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {videoUrl ? (
          <VideoWajib url={videoUrl} onDone={handleVideoDone} />
        ) : (
          <div className="grid aspect-video place-items-center bg-slate-100 px-6 text-center text-sm text-slate-500">
            Video belum tersedia. Silakan cek kembali nanti.
          </div>
        )}
        <div className="flex items-start gap-2 border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500">
          {videoDone ? (
            <>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <span>Anda sudah menyelesaikan video ini.</span>
            </>
          ) : (
            <>
              <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0052A4]" />
              <span>
                Video wajib ditonton sampai selesai. Video tidak dapat dilewati atau dipercepat.
              </span>
            </>
          )}
        </div>
      </section>

      {error && !popup && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {konsultasiSelesai ? (
        <Link
          href="/peserta/konsultasi"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <BadgeCheck className="h-5 w-5" /> Konsultasi Online aktif — lihat detail
        </Link>
      ) : (
        videoDone && (
          <Link
            href="/peserta/konsultasi"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00438a]"
          >
            <CreditCard className="h-5 w-5" /> Konsultasi Online — Rp49.000
          </Link>
        )
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="mb-4 text-base font-bold text-slate-900">Grup WhatsApp Anda</h2>
        <GrupList grup={[grupUmum]} />
      </section>

      {bolehGrupKonsultasi && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Grup Konsultasi Online</h2>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                Khusus peserta yang sudah checkout konsultasi online.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
                konsultasiSelesai || statusPembayaran === "dikonfirmasi"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {konsultasiSelesai || statusPembayaran === "dikonfirmasi"
                ? "Aktif"
                : "Menunggu verifikasi"}
            </span>
          </div>
          <GrupList grup={[grupKonsultasi]} />
        </section>
      )}

      {/* Popup: masuk grup umum (sebelum video) */}
      {popup === "grupAwal" && (
        <Modal>
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Gabung grup terlebih dulu</h2>
            <p className="mb-5 mt-2 text-sm leading-6 text-slate-600">
              Pendaftaran Anda berhasil. Silakan gabung ke grup <b>Korean Bisnis Klub</b>, lalu
              lanjutkan menonton video pengarahan.
            </p>
          </div>
          <GrupList grup={[grupUmum]} />
          <button
            onClick={tutupPopupGrupAwal}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00438a]"
          >
            <PlayCircle className="h-5 w-5" /> Lanjut Tonton Video
          </button>
        </Modal>
      )}

      {/* Popup: video selesai */}
      {popup === "video" && (
        <Modal onClose={() => setPopup(null)}>
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Video selesai ditonton</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Terima kasih sudah menonton sampai akhir. Lanjutkan ke <b>Konsultasi Online</b>,
              lalu transfer Rp49.000 dan unggah bukti pembayaran Anda.
            </p>
            <Link
              href="/peserta/konsultasi"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00438a]"
            >
              <CreditCard className="h-5 w-5" /> Lihat Detail Konsultasi Online
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setPopup(null)}
              className="mt-3 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Nanti saja
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
