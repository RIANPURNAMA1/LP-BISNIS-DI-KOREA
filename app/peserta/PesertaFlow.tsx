"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Lock,
  Mail,
  MapPin,
  Phone,
  X,
  type LucideIcon,
} from "lucide-react";
import VideoWajib from "./VideoWajib";

export type Grup = { nama: string; deskripsi: string; url: string }[];

type Popup = "grupAwal" | "video" | null;

type Kontak = {
  whatsapp: string;
  email: string;
  wilayah: string;
};

const WILAYAH_LABEL: Record<string, string> = {
  jabodetabek: "Jabodetabek",
  luar_jabodetabek: "Luar Jabodetabek",
  luar_negeri: "Luar Negeri",
};

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052A4] focus-visible:ring-offset-2";

/* ---------- Modal ---------- */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-xl">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup"
            className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 ${FOCUS}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <h2 className="pr-8 text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ---------- Bagian kecil ---------- */

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#1B9A4B]" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
  </svg>
);

function GrupList({ grup }: { grup: Grup }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
      {grup.map((g) => (
        <li
          key={g.nama}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{g.nama}</p>
            <p className="mt-0.5 text-sm leading-6 text-slate-600">{g.deskripsi}</p>
          </div>
          {g.url ? (
            <a
              href={g.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 ${FOCUS}`}
            >
              <WaIcon /> Gabung grup
            </a>
          ) : (
            <p className="shrink-0 text-sm text-slate-500">Link akan dibagikan admin</p>
          )}
        </li>
      ))}
    </ul>
  );
}

type StepState = "done" | "active" | "locked";

function Step({
  no,
  title,
  state,
  status,
  last,
  children,
}: {
  no: number;
  title: string;
  state: StepState;
  status?: string;
  last?: boolean;
  children: ReactNode;
}) {
  const marker =
    state === "done"
      ? "bg-[#0052A4] text-white"
      : state === "active"
        ? "border-2 border-[#0052A4] bg-white text-[#0052A4]"
        : "border border-slate-300 bg-white text-slate-400";

  return (
    <li className="relative flex gap-4 pb-10 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className={`absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-px ${
            state === "done" ? "bg-[#0052A4]" : "bg-slate-200"
          }`}
        />
      )}
      <span
        className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${marker}`}
      >
        {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : no}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2
            className={`text-base font-semibold ${
              state === "locked" ? "text-slate-500" : "text-slate-900"
            }`}
          >
            {title}
          </h2>
          {status && <span className="text-sm text-slate-500">{status}</span>}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="truncate text-sm font-medium text-slate-900" title={value}>
          {value || "-"}
        </dd>
      </div>
    </div>
  );
}

/* ---------- Halaman utama ---------- */

export default function PesertaFlow({
  videoUrl,
  videoSelesai,
  konsultasiSelesai,
  grupUmum,
  grupKonsultasi,
  bolehGrupKonsultasi,
  statusPembayaran,
  nama,
  kontak,
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
  nama: string;
  kontak: Kontak;
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

  const done = [true, videoDone, konsultasiSelesai];
  const doneCount = done.filter(Boolean).length;
  const konsultasiAktif = konsultasiSelesai || statusPembayaran === "dikonfirmasi";

  const stateVideo: StepState = videoDone ? "done" : "active";
  const stateKonsultasi: StepState = konsultasiSelesai ? "done" : videoDone ? "active" : "locked";

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* ALUR */}
        <div className="min-w-0">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-900">
              {doneCount} dari {done.length} langkah selesai
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">
              {done.map((d, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-sm ${d ? "bg-[#0052A4]" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>

          <ol>
            {/* 1. Grup */}
            <Step no={1} title="Gabung grup Korean Bisnis Klub" state="done" status="Selesai">
              <p className="mb-3 max-w-prose text-sm leading-6 text-slate-600">
                Info program dan diskusi antar peserta ada di grup ini.
              </p>
              <GrupList grup={[grupUmum]} />
            </Step>

            {/* 2. Video */}
            <Step
              no={2}
              title="Tonton video pengarahan"
              state={stateVideo}
              status={videoDone ? "Selesai" : "Belum ditonton"}
            >
              <div className="overflow-hidden rounded-md border border-slate-200">
                {videoUrl ? (
                  <VideoWajib url={videoUrl} onDone={handleVideoDone} />
                ) : (
                  <div className="grid aspect-video place-items-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                    Video belum tersedia. Silakan cek kembali nanti.
                  </div>
                )}
              </div>
              <p className="mt-3 flex max-w-prose items-start gap-2 text-sm leading-6 text-slate-600">
                {videoDone ? (
                  <>
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#0052A4]" />
                    Video selesai ditonton. Konsultasi online sekarang sudah terbuka.
                  </>
                ) : (
                  <>
                    <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      <b>Wajib tonton sampai selesai video ini dulu sebelum melanjutkan.</b> Setelah
                      selesai, konsultasi online akan terbuka.
                    </span>
                  </>
                )}
              </p>
              {saving && <p className="mt-2 text-sm text-slate-500">Menyimpan progres…</p>}
              {error && !popup && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </Step>

            {/* 3. Konsultasi */}
            <Step
              no={3}
              title="Konsultasi online"
              state={stateKonsultasi}
              status={
                konsultasiSelesai ? "Aktif" : videoDone ? "Rp49.000" : "Terbuka setelah video selesai"
              }
              last
            >
              {konsultasiSelesai ? (
                <>
                  <p className="max-w-prose text-sm leading-6 text-slate-600">
                    Pembayaran sudah dikonfirmasi. Detail sesi ada di halaman konsultasi.
                  </p>
                  <Link
                    href="/peserta/konsultasi"
                    className={`mt-3 inline-flex items-center gap-2 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
                  >
                    Lihat detail sesi <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : videoDone ? (
                <>
                  <p className="max-w-prose text-sm leading-6 text-slate-600">
                    Biaya layanan Rp49.000. Transfer, lalu unggah bukti pembayaran di halaman
                    checkout.
                  </p>
                  <Link
                    href="/peserta/konsultasi"
                    className={`mt-3 inline-flex items-center gap-2 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
                  >
                    Bayar konsultasi <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <p className="max-w-prose text-sm leading-6 text-slate-500">
                  Selesaikan video pengarahan dulu, lalu pembayaran bisa dilakukan.
                </p>
              )}

              {bolehGrupKonsultasi && (
                <div className="mt-6">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-sm font-semibold text-slate-900">Grup konsultasi online</h3>
                    <span className="text-sm text-slate-500">
                      {konsultasiAktif ? "Aktif" : "Menunggu verifikasi pembayaran"}
                    </span>
                  </div>
                  <GrupList grup={[grupKonsultasi]} />
                </div>
              )}
            </Step>
          </ol>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
          <section>
            <p className="truncate text-base font-semibold text-slate-900">{nama}</p>
            <p className="text-sm text-slate-500">Peserta Indonesia-Korea Business Project</p>
            <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-200">
              <InfoRow icon={Phone} label="WhatsApp" value={kontak?.whatsapp ?? ""} />
              <InfoRow icon={Mail} label="Email" value={kontak?.email ?? ""} />
              <InfoRow
                icon={MapPin}
                label="Wilayah"
                value={WILAYAH_LABEL[kontak?.wilayah ?? ""] || kontak?.wilayah || "-"}
              />
            </dl>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Butuh bantuan?</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Tanyakan seputar program atau pembayaran di grup WhatsApp. Tim kami akan menjawab di
              sana.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              <li>Selesaikan video sebelum membayar.</li>
              <li>Simpan bukti transfer supaya verifikasi lebih cepat.</li>
              <li>Cek grup secara berkala untuk info terbaru.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Popup: masuk grup umum (sebelum video) */}
      {popup === "grupAwal" && (
        <Modal title="Gabung grup dulu" onClose={tutupPopupGrupAwal}>
          <p className="mb-4 mt-2 text-sm leading-6 text-slate-600">
            Pendaftaran Anda berhasil. Gabung ke grup <b>Korean Bisnis Klub</b>, lalu lanjut
            menonton video pengarahan.
          </p>
          <GrupList grup={[grupUmum]} />
          <button
            onClick={tutupPopupGrupAwal}
            className={`mt-5 w-full rounded-md bg-[#0052A4] px-4 py-3 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
          >
            Lanjut tonton video
          </button>
        </Modal>
      )}

      {/* Popup: video selesai */}
      {popup === "video" && (
        <Modal title="Video selesai ditonton" onClose={() => setPopup(null)}>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Langkah berikutnya: konsultasi online. Transfer Rp49.000, lalu unggah bukti
            pembayaran Anda.
          </p>
          <Link
            href="/peserta/konsultasi"
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-3 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
          >
            Bayar konsultasi <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setPopup(null)}
            className={`mt-2 w-full rounded-md py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 ${FOCUS}`}
          >
            Nanti saja
          </button>
        </Modal>
      )}
    </>
  );
}