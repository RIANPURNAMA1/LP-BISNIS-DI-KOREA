"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Check,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import VideoWajib from "./VideoWajib";
import JadwalSesi from "./JadwalSesi";
import { POSISI_OPSI } from "@/lib/posisi";

export type Grup = { nama: string; deskripsi: string; url: string }[];

type Popup = "grupAwal" | "video" | "posisi" | "jadwal" | "selamat" | null;

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
  size = "md",
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={`relative my-4 w-full rounded-md bg-white p-6 shadow-xl ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        }`}
      >
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

function GrupList({ grup, terkunci = false }: { grup: Grup; terkunci?: boolean }) {
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
          {terkunci ? (
            <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400">
              <Lock className="h-4 w-4" /> Terkunci
            </span>
          ) : g.url ? (
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

/** Ringkasan data yang sudah dikonfirmasi, dipakai di langkah & popup meeting lanjutan. */
function RingkasanMeeting({
  nama,
  kontak,
  posisi,
}: {
  nama: string;
  kontak: Kontak;
  posisi: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <h3 className="text-sm font-semibold text-slate-900">Data meeting lanjutan</h3>
      <dl className="mt-1 divide-y divide-slate-100 px-1">
        <InfoRow icon={User} label="Nama" value={nama} />
        <InfoRow icon={Phone} label="WhatsApp" value={kontak?.whatsapp ?? ""} />
        <InfoRow icon={Mail} label="Email" value={kontak?.email ?? ""} />
        <InfoRow
          icon={MapPin}
          label="Wilayah"
          value={WILAYAH_LABEL[kontak?.wilayah ?? ""] || kontak?.wilayah || "-"}
        />
        <InfoRow icon={Check} label="Posisi" value={posisi} />
      </dl>
    </section>
  );
}

/* ---------- Halaman utama ---------- */

export default function PesertaFlow({
  videoUrl,
  thumbnailUrl,
  videoSelesai,
  konsultasiSelesai,
  posisi,
  jadwalSelesai,
  grupUmum,
  grupKonsultasi,
  bolehGrupKonsultasi,
  terkunci,
  nama,
  kontak,
}: {
  videoUrl: string;
  thumbnailUrl?: string;
  videoSelesai: boolean;
  /** Konfirmasi posisi konsultasi lanjutan sudah dikirim. */
  konsultasiSelesai: boolean;
  posisi: string | null;
  /** Peserta sudah mengirim jadwal atau masuk waitinglist. */
  jadwalSelesai: boolean;
  /** Grup umum Korean Bisnis Klub, ditampilkan ke semua peserta. */
  grupUmum: Grup[number];
  /** Grup khusus konsultasi lanjutan. */
  grupKonsultasi: Grup[number];
  bolehGrupKonsultasi: boolean;
  /** Bukti pembayaran sudah dikirim, tapi admin belum verifikasi. */
  terkunci: boolean;
  nama: string;
  kontak: Kontak;
}) {
  const [videoDone, setVideoDone] = useState(videoSelesai);
  const [konsultasiDone, setKonsultasiDone] = useState(konsultasiSelesai);
  const [posisiTerpilih, setPosisiTerpilih] = useState(posisi);
  const [jadwalDone, setJadwalDone] = useState(jadwalSelesai);
  const [popup, setPopup] = useState<Popup>(null);
  const [infoVideo, setInfoVideo] = useState("");
  const [pilihanPosisi, setPilihanPosisi] = useState(posisi ?? "");
  const [ijazahS1, setIjazahS1] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [jenisSelesai, setJenisSelesai] = useState<"jadwal" | "waitinglist">("jadwal");

  // Sebelum menonton video, peserta diminta gabung ke grup umum (sekali per sesi browser).
  // Saat terkunci, popup tidak muncul: video & grup hanya bisa dilihat, belum dipakai.
  useEffect(() => {
    if (terkunci || videoSelesai) return;
    try {
      if (sessionStorage.getItem("grup-umum-dilihat")) return;
    } catch {
      /* penyimpanan tidak tersedia: tetap tampilkan popup */
    }
    setPopup("grupAwal");
  }, [videoSelesai, terkunci]);

  function tutupPopupGrupAwal() {
    try {
      sessionStorage.setItem("grup-umum-dilihat", "1");
    } catch {
      /* abaikan */
    }
    setPopup(null);
  }

  async function handleVideoDone() {
    if (terkunci || videoDone) return;
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

  function bukaPosisi() {
    setPilihanPosisi(posisiTerpilih ?? "");
    setIjazahS1(false);
    setError("");
    setPopup("posisi");
  }

  function bukaKonsultasi() {
    if (terkunci) return;
    if (!videoDone) {
      setInfoVideo("silahkan tonton dulu video diatas");
      return;
    }
    setInfoVideo("");
    if (!konsultasiDone) {
      bukaPosisi();
      return;
    }
    setPopup("jadwal");
  }

  async function submitPosisi(e: React.FormEvent) {
    e.preventDefault();
    if (terkunci) return;
    if (!pilihanPosisi) {
      setError("Pilih salah satu posisi terlebih dulu.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/peserta/konsultasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posisi: pilihanPosisi, ijazahS1 }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Konfirmasi belum tersimpan. Coba lagi.");
      setPosisiTerpilih(pilihanPosisi);
      setKonsultasiDone(true);

      // Langsung munculkan popup jadwal meeting lanjutan sesuai kategori yang dipilih.
      setPopup("jadwal");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konfirmasi belum tersimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function onJadwalSelesai(jenis: "jadwal" | "waitinglist") {
    setJadwalDone(true);
    setJenisSelesai(jenis);
    setPopup("selamat");
  }

  const done = [true, videoDone, konsultasiDone && jadwalDone];
  const doneCount = done.filter(Boolean).length;

  // Saat menunggu verifikasi, tidak ada popup interaktif yang boleh muncul.
  const popupTampil = terkunci ? null : popup;

  const stateGrup: StepState = terkunci ? "locked" : "done";
  const stateVideo: StepState = terkunci ? "locked" : videoDone ? "done" : "active";
  const stateKonsultasi: StepState = terkunci
    ? "locked"
    : konsultasiDone && jadwalDone
      ? "done"
      : videoDone
        ? "active"
        : "locked";
  const labelPosisi = POSISI_OPSI.find((o) => o.kode === posisiTerpilih)?.label ?? posisiTerpilih ?? "-";
  const posisiTampil = posisiTerpilih ? `${posisiTerpilih.toUpperCase()}. ${labelPosisi}` : labelPosisi;

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
            <Step
              no={1}
              title="Gabung grup Korean Bisnis Klub"
              state={stateGrup}
              status={terkunci ? "Terkunci" : "Selesai"}
            >
              <p className="mb-3 max-w-prose text-sm leading-6 text-slate-600">
                Info program dan diskusi antar peserta ada di grup ini.
              </p>
              <GrupList grup={[grupUmum]} terkunci={terkunci} />
            </Step>

            {/* 2. Video */}
            <Step
              no={2}
              title="Tonton video pengarahan"
              state={stateVideo}
              status={terkunci ? "Terkunci" : videoDone ? "Selesai" : "Belum ditonton"}
            >
              <div className="overflow-hidden rounded-md border border-slate-200">
                {terkunci ? (
                  <div className="relative grid aspect-video place-items-center bg-slate-900 px-6 text-center">
                    <div>
                      <Lock className="mx-auto h-8 w-8 text-white/60" />
                      <p className="mt-3 text-sm font-semibold text-white">Video pengarahan</p>
                      <p className="mt-1 text-xs leading-5 text-white/60">
                        Terkunci sampai pembayaran terverifikasi.
                      </p>
                    </div>
                  </div>
                ) : videoUrl ? (
                  <VideoWajib url={videoUrl} poster={thumbnailUrl} onDone={handleVideoDone} />
                ) : (
                  <div className="grid aspect-video place-items-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                    Video belum tersedia. Silakan cek kembali nanti.
                  </div>
                )}
              </div>
              <p className="mt-3 flex max-w-prose items-start gap-2 text-sm leading-6 text-slate-600">
                {terkunci ? (
                  <>
                    <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      Video dan grup akan terbuka otomatis setelah admin memverifikasi pembayaran.
                    </span>
                  </>
                ) : videoDone ? (
                  <>
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#0052A4]" />
                    Video selesai ditonton. Konsultasi lanjutan sekarang sudah bisa diisi.
                  </>
                ) : (
                  <>
                    <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      <b>Wajib tonton sampai selesai video ini dulu sebelum melanjutkan.</b> Setelah
                      selesai, konfirmasi data diri dan pilih jadwal konsultasi lanjutan.
                    </span>
                  </>
                )}
              </p>
              {saving && <p className="mt-2 text-sm text-slate-500">Menyimpan progres…</p>}
              {error && !popupTampil && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </Step>

            {/* 3. Konsultasi lanjutan */}
            <Step
              no={3}
              title="Konsultasi lanjutan"
              state={stateKonsultasi}
              status={
                terkunci
                  ? "Terkunci"
                  : jadwalDone
                    ? "Jadwal dikirim"
                    : konsultasiDone
                      ? "Belum pilih jadwal"
                      : videoDone
                        ? "Belum dikonfirmasi"
                        : "Terbuka setelah video selesai"
              }
              last
            >
              <p className="max-w-prose text-sm leading-6 text-slate-600">
                {terkunci ? (
                  <>Tonton video dan gabung grup setelah admin memverifikasi pembayaran Anda.</>
                ) : videoDone ? (
                  konsultasiDone ? (
                    <>
                      Posisi kamu: <b>{labelPosisi}</b>. Silakan pilih jadwal konsultasi lanjutan
                      yang sudah ditetapkan admin.
                    </>
                  ) : (
                    <>
                      Konfirmasi data diri dan pilih posisi kamu saat ini, lalu jadwalkan konsultasi
                      lanjutan bersama tim Bisnis di Korea.
                    </>
                  )
                ) : (
                  <>Tonton video pengarahan sampai selesai untuk membuka tahap ini.</>
                )}
              </p>

              <button
                type="button"
                onClick={bukaKonsultasi}
                disabled={terkunci}
                title={terkunci ? "Menunggu verifikasi admin" : undefined}
                className={`mt-3 inline-flex items-center gap-2 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] disabled:cursor-not-allowed disabled:bg-slate-300 ${FOCUS}`}
              >
                {terkunci ? (
                  <Lock className="h-4 w-4" />
                ) : null}
                {konsultasiDone && !terkunci ? "Lihat / ubah jadwal" : "Konsultasi lanjutan"}
                {terkunci ? null : <ArrowRight className="h-4 w-4" />}
              </button>
              {terkunci && (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-700">
                  <Lock className="h-4 w-4 shrink-0" /> Menunggu verifikasi admin.
                </p>
              )}

              {infoVideo && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-700"
                >
                  <Lock className="h-4 w-4 shrink-0" /> {infoVideo}
                </p>
              )}

              {konsultasiDone && !terkunci && (
                <div className="mt-5 space-y-4">
                  <RingkasanMeeting nama={nama} kontak={kontak} posisi={posisiTampil} />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">
                      Jadwal meeting lanjutan
                    </h3>
                    <JadwalSesi posisi={posisiTerpilih} onSelesai={onJadwalSelesai} />
                  </div>
                </div>
              )}

              {konsultasiDone && jadwalDone && (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="h-4 w-4 shrink-0" /> Data sudah kami terima. Admin akan
                  menghubungi Anda untuk informasi selanjutnya.
                </p>
              )}

              {(bolehGrupKonsultasi || terkunci) && (
                <div className="mt-6">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-sm font-semibold text-slate-900">Grup konsultasi lanjutan</h3>
                    <span className="text-sm text-slate-500">
                      {terkunci ? "Terkunci" : "Aktif"}
                    </span>
                  </div>
                  <GrupList grup={[grupKonsultasi]} terkunci={terkunci} />
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
              Tanyakan seputar program atau konsultasi lanjutan di grup WhatsApp. Tim kami akan
              menjawab di sana.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              <li>Selesaikan video sebelum mengisi konfirmasi.</li>
              <li>Pilih jadwal yang masih tersedia (maks. 5 peserta per jadwal).</li>
              <li>Cek grup secara berkala untuk info terbaru.</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Popup: masuk grup umum (sebelum video) */}
      {popupTampil === "grupAwal" && (
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
      {popupTampil === "video" && (
        <Modal title="Video selesai ditonton" onClose={() => setPopup(null)}>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Langkah berikutnya: konfirmasi data diri dan pilih posisi kamu saat ini, lalu jadwalkan
            konsultasi lanjutan bersama tim Bisnis di Korea.
          </p>
          <button
            onClick={bukaPosisi}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-3 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
          >
            Lanjut konsultasi lanjutan <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPopup(null)}
            className={`mt-2 w-full rounded-md py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 ${FOCUS}`}
          >
            Nanti saja
          </button>
        </Modal>
      )}

      {/* Popup: konfirmasi data diri + opsi posisi A–D */}
      {popupTampil === "posisi" && (
        <Modal
          title="Konfirmasi konsultasi lanjutan"
          onClose={() => setPopup(null)}
          size="lg"
        >
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Silakan cek kembali data Anda di bawah ini sebelum melanjutkan.
          </p>
          <dl className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200 px-4">
            <InfoRow icon={Check} label="Nama" value={nama} />
            <InfoRow icon={Phone} label="WhatsApp" value={kontak?.whatsapp ?? ""} />
            <InfoRow icon={Mail} label="Email" value={kontak?.email ?? ""} />
            <InfoRow
              icon={MapPin}
              label="Wilayah"
              value={WILAYAH_LABEL[kontak?.wilayah ?? ""] || kontak?.wilayah || "-"}
            />
          </dl>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-900">
            Sebelum melanjutkan konsultasi lanjutan bersama tim Bisnis di Korea silahkan pilih posisi
            kamu saat ini
          </p>

          <form onSubmit={submitPosisi} className="mt-3 space-y-2">
            {POSISI_OPSI.map((o) => (
              <label
                key={o.kode}
                className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                  pilihanPosisi === o.kode
                    ? "border-[#0052A4] bg-[#0052A4]/5 text-slate-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="posisi"
                  value={o.kode}
                  checked={pilihanPosisi === o.kode}
                  onChange={() => {
                    setPilihanPosisi(o.kode);
                    setError("");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#0052A4]"
                />
                <span>
                  <b className="mr-1.5">{o.kode}.</b>
                  {o.label}
                </span>
              </label>
            ))}

            {pilihanPosisi === "D" && (
              <label className="flex cursor-pointer items-start gap-3 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200">
                <input
                  type="checkbox"
                  checked={ijazahS1}
                  onChange={(e) => {
                    setIjazahS1(e.target.checked);
                    setError("");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#0052A4]"
                />
                <span>
                  <b>Saya memiliki ijazah S1.</b> Wajib dicentang untuk memilih opsi D.
                </span>
              </label>
            )}

            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-3 text-sm font-medium text-white hover:bg-[#00438a] disabled:opacity-60 ${FOCUS}`}
            >
              {saving ? "Menyimpan…" : "Konfirmasi & lanjut pilih jadwal"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Modal>
      )}

      {/* Popup: pilih jadwal fix dari admin / waitinglist */}
      {popupTampil === "jadwal" && (
        <Modal
          title="Jadwal meeting lanjutan"
          onClose={() => setPopup(null)}
          size="lg"
        >
          <div className="space-y-4">
            <RingkasanMeeting nama={nama} kontak={kontak} posisi={posisiTampil} />
            <JadwalSesi posisi={posisiTerpilih} onSelesai={onJadwalSelesai} />
          </div>
        </Modal>
      )}

      {/* Popup: jadwal / waitinglist berhasil dikirim */}
      {popupTampil === "selamat" && (
        <Modal
          title={jenisSelesai === "jadwal" ? "Selamat!" : "Jadwal sudah penuh"}
          onClose={() => setPopup(null)}>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {jenisSelesai === "jadwal"
              ? "Jadwal konsultasi lanjutan Anda sudah dikonfirmasi. Admin akan menghubungi Anda untuk informasi selanjutnya."
              : "Mohon maaf, jadwal yang Anda pilih sudah penuh. Anda otomatis kami masukkan ke waitinglist dan akan diprioritaskan. Admin akan menghubungi Anda bila ada slot tersedia."}
          </p>
          <button
            onClick={() => setPopup(null)}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-3 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
          >
            <CalendarClock className="h-4 w-4" /> Selesai
          </button>
        </Modal>
      )}
    </>
  );
}
