"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Clock3,
  CreditCard,
  FileImage,
  Loader2,
  MailCheck,
  Users,
} from "lucide-react";
import {
  BANK_OPTIONS,
  HARGA_KONSULTASI,
  NAMA_LAYANAN,
  STATUS_BAYAR,
  formatRupiah,
  type Rekening,
} from "@/lib/pembayaran-konstanta";

type Pembayaran = {
  id: number;
  metode: string;
  namaChannel: string;
  namaPengirim: string;
  buktiBayar: string;
  jumlah: number;
  status: string;
  catatanAdmin: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

type Props = {
  grupKonsultasi: { nama: string; deskripsi: string; url: string };
  profil: { nama: string; whatsapp: string; email: string };
  videoSelesai: boolean;
  konsultasiSelesai: boolean;
  rekening: Rekening;
  pembayaran: Pembayaran | null;
};

type Langkah = "detail" | "form" | "menunggu" | "verified";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";
const btnPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60";

function tanggal(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-900">{value || "-"}</span>
    </div>
  );
}

function GrupKonsultasiLink({ grup }: { grup: Props["grupKonsultasi"] }) {
  if (!grup.url) return null;
  return (
    <a
      href={grup.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1EBE5A]"
    >
      <Users className="h-4 w-4" /> Gabung {grup.nama}
    </a>
  );
}

export default function CheckoutKonsultasi({
  grupKonsultasi,
  profil,
  videoSelesai,
  konsultasiSelesai,
  rekening,
  pembayaran,
}: Props) {
  const [langkah, setLangkah] = useState<Langkah>(() => {
    if (konsultasiSelesai || pembayaran?.status === "dikonfirmasi") return "verified";
    if (pembayaran?.status === "menunggu") return "menunggu";
    return "detail";
  });
  // Metode pembayaran tunggal: transfer bank.
  const metode = "bank" as const;
  const [namaChannel, setNamaChannel] = useState("");
  const [namaPengirim, setNamaPengirim] = useState(profil.nama);
  const [bukti, setBukti] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [kiriman, setKiriman] = useState<{
    metode: string;
    namaChannel: string;
    namaPengirim: string;
    buktiBayar: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    if (!bukti) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(bukti);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bukti]);

  const rekeningBank = rekening.bankNama || rekening.bankNo || rekening.bankAtasNama;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!namaChannel) return setError("Pilih nama bank terlebih dahulu.");
    if (!bukti) return setError("Unggah bukti pembayaran terlebih dahulu.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("metode", metode);
      fd.append("namaChannel", namaChannel);
      fd.append("namaPengirim", namaPengirim);
      fd.append("bukti", bukti);
      const res = await fetch("/api/peserta/pembayaran", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengirim bukti bayar.");
      setKiriman({
        metode,
        namaChannel,
        namaPengirim,
        buktiBayar: preview,
        createdAt: new Date().toISOString(),
      });
      setSent(true);
      setLangkah("menunggu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim bukti bayar.");
    } finally {
      setBusy(false);
    }
  }

  if (langkah === "verified") {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="bg-emerald-500 px-5 py-6 text-center text-white">
          <BadgeCheck className="mx-auto h-10 w-10" />
          <h2 className="mt-2 text-lg font-bold">Pembayaran dikonfirmasi</h2>
          <p className="mt-1 text-sm text-emerald-50">
            Konsultasi online Anda sudah aktif. Email konfirmasi telah dikirim.
          </p>
        </div>
        <div className="p-5">
          <div className="rounded-xl bg-slate-50 px-4 py-1 ring-1 ring-slate-200">
            <Baris label="Layanan" value={NAMA_LAYANAN} />
            <Baris label="Jumlah" value={formatRupiah(pembayaran?.jumlah ?? HARGA_KONSULTASI)} />
            <Baris
              label="Metode"
              value={`Transfer bank — ${pembayaran?.namaChannel || "-"}`}
            />
            <Baris label="Status" value={STATUS_BAYAR.dikonfirmasi} />
          </div>
          <GrupKonsultasiLink grup={grupKonsultasi} />
          <Link href="/peserta" className={`${btnPrimary} mt-5`}>
            Kembali ke dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  if (langkah === "menunggu") {
    const info = pembayaran ?? kiriman;
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="bg-amber-50 px-5 py-6 text-center">
          <Clock3 className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-2 text-lg font-bold text-amber-900">
            {sent ? "Bukti berhasil dikirim" : "Menunggu verifikasi admin"}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-amber-800">
            Pembayaran Anda sedang kami periksa. Kami akan mengirim email konfirmasi setelah bukti
            diverifikasi.
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-slate-50 px-4 py-1 ring-1 ring-slate-200">
            <Baris label="Layanan" value={NAMA_LAYANAN} />
            <Baris label="Jumlah" value={formatRupiah(pembayaran?.jumlah ?? HARGA_KONSULTASI)} />
            <Baris
              label="Metode"
              value={`Transfer bank — ${info?.namaChannel || "-"}`}
            />
            <Baris label="Nama pengirim" value={info?.namaPengirim || "-"} />
            <Baris label="Waktu kirim" value={info ? tanggal(info.createdAt) : "-"} />
          </div>
          {info?.buktiBayar && (
            <div>
              <p className={labelCls}>Bukti pembayaran</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={info.buktiBayar}
                alt="Bukti pembayaran"
                className="mx-auto max-h-80 w-auto rounded-xl border border-slate-200"
              />
            </div>
          )}
          <GrupKonsultasiLink grup={grupKonsultasi} />
          <Link href="/peserta" className={`${btnPrimary} mt-1`}>
            Kembali ke dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  if (langkah === "form") {
    return (
      <form onSubmit={kirim} className="space-y-5">
        {pembayaran?.status === "ditolak" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <b>Pembayaran sebelumnya ditolak.</b>
              {pembayaran.catatanAdmin ? ` ${pembayaran.catatanAdmin}` : " Silakan kirim ulang bukti."}
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Konfirmasi data diri</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Data ini otomatis terisi dari pendaftaran.</p>
          </div>
          <div className="px-5 py-1">
            <Baris label="Nama" value={profil.nama} />
            <Baris label="WhatsApp" value={profil.whatsapp} />
            <Baris label="Email" value={profil.email} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Detail pembayaran</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Isi data pengirim dan unggah bukti transfer.</p>
          </div>

          <div>
            <span className={labelCls}>Metode pembayaran</span>
            <p className="flex items-center gap-2 rounded-xl border border-[#0052A4]/20 bg-[#0052A4]/5 px-3.5 py-3 text-sm font-semibold text-[#0052A4]">
              <Banknote className="h-4 w-4" /> Transfer bank
            </p>
          </div>

          <div>
            <label className={labelCls} htmlFor="nama-channel">Nama bank</label>
            <select
              id="nama-channel"
              className={inputCls}
              value={namaChannel}
              onChange={(e) => setNamaChannel(e.target.value)}
            >
              <option value="">— Pilih bank —</option>
              {BANK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="nama-pengirim">Nama pengirim</label>
            <input
              id="nama-pengirim"
              className={inputCls}
              value={namaPengirim}
              placeholder="Nama sesuai rekening bank"
              onChange={(e) => setNamaPengirim(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="bukti">Upload bukti pembayaran</label>
            <label
              htmlFor="bukti"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-[#0052A4]/50 hover:bg-[#0052A4]/5"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Pratinjau bukti" className="max-h-56 rounded-lg" />
              ) : (
                <FileImage className="h-8 w-8 text-slate-400" />
              )}
              <span className="text-xs font-semibold text-slate-700">
                {bukti ? bukti.name : "Klik untuk pilih gambar bukti transfer"}
              </span>
              <span className="text-[11px] text-slate-500">JPG, PNG, atau WebP • maks. 5 MB</span>
            </label>
            <input
              id="bukti"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => setBukti(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {busy ? "Mengirim..." : "Cekout Konsultasi Online"}
          </button>
          <button
            type="button"
            onClick={() => setLangkah("detail")}
            className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Kembali ke detail pembayaran
          </button>
        </section>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {pembayaran?.status === "ditolak" && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <b>Pembayaran sebelumnya ditolak.</b>
            {pembayaran.catatanAdmin ? ` ${pembayaran.catatanAdmin}` : " Silakan kirim ulang bukti."}
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-[#0052A4]/[0.04] px-5 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0052A4] text-white">
            <HeadphonesIcon />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">{NAMA_LAYANAN}</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Sesi konsultasi personal bersama mentor Indonesia-Korea Business Project.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-[#0052A4] sm:text-2xl">
              {formatRupiah(HARGA_KONSULTASI)}
            </p>
            <p className="text-[10px] text-slate-400">sekali bayar</p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cara pembayaran</h3>
            <ol className="mt-3 space-y-2.5">
              {[
                "Transfer Rp49.000 ke rekening bank di bawah ini.",
                "Klik Lanjut Cekout, isi data pengirim, lalu unggah bukti pembayaran.",
                "Admin akan memverifikasi bukti dan mengirim email konfirmasi ke Anda.",
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0052A4]/10 text-[10px] font-bold text-[#0052A4]">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Banknote className="h-4 w-4 text-[#0052A4]" /> Rekening tujuan transfer bank
            </p>
            {rekeningBank ? (
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>
                  <b>{rekening.bankNama || "Bank"}</b>
                </p>
                <p className="font-mono text-sm font-bold text-slate-900">
                  {rekening.bankNo || "-"}
                </p>
                <p>a.n. {rekening.bankAtasNama || "-"}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Belum diatur admin.</p>
            )}
          </div>

          {!rekeningBank && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Admin belum mengatur rekening tujuan. Hubungi admin sebelum melakukan pembayaran.
            </p>
          )}

          {!videoSelesai && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Selesaikan video pengarahan di dashboard terlebih dulu sebelum checkout.
            </p>
          )}

          <button
            type="button"
            disabled={!videoSelesai}
            onClick={() => setLangkah("form")}
            className={btnPrimary}
          >
            Lanjut Cekout <ArrowRight className="h-4 w-4" />
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <MailCheck className="h-3.5 w-3.5" /> Konfirmasi dikirim ke email setelah verifikasi
          </p>
        </div>
      </section>
    </div>
  );
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Zm16 0h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5Z"
      />
    </svg>
  );
}
