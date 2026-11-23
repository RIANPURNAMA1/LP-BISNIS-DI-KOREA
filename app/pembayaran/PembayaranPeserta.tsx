"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  BANK_OPTIONS,
  formatRupiah,
  HARGA_KONSULTASI,
  STATUS_BAYAR,
} from "@/lib/pembayaran";
import LogoutButton from "@/app/peserta/LogoutButton";

type PembayaranRingkas = {
  id: number;
  status: string;
  catatanAdmin: string | null;
  namaChannel: string;
  namaPengirim: string;
  buktiBayar: string;
  jumlah: number;
  createdAt: string;
  verifiedAt: string | null;
};

type Props = {
  nama: string;
  whatsapp: string;
  email: string;
  rekening: { bankNama: string; bankNo: string; bankAtasNama: string };
  grupUmum: { nama: string; deskripsi: string; url: string };
  pembayaran: PembayaranRingkas | null;
};

const input =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

export default function PembayaranPeserta({
  nama,
  whatsapp,
  email,
  rekening,
  grupUmum,
  pembayaran,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(pembayaran?.status ?? "");
  const [namaChannel, setNamaChannel] = useState<string>(BANK_OPTIONS[0]);
  const [namaPengirim, setNamaPengirim] = useState(nama);
  const [bukti, setBukti] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [disalin, setDisalin] = useState(false);

  useEffect(() => {
    setStatus(pembayaran?.status ?? "");
  }, [pembayaran?.status]);

  async function salinNoRekening() {
    if (!rekening.bankNo) return;
    try {
      await navigator.clipboard.writeText(rekening.bankNo);
      setDisalin(true);
      window.setTimeout(() => setDisalin(false), 1800);
    } catch {
      setDisalin(false);
    }
  }

  async function kirimBukti(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!bukti) {
      setError("Unggah bukti transfer terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("metode", "bank");
      form.set("namaChannel", namaChannel);
      form.set("namaPengirim", namaPengirim.trim());
      form.set("bukti", bukti);

      const res = await fetch("/api/pembayaran/bukti", {
        method: "POST",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengirim bukti. Coba lagi.");
      }
      // Jangan ubah state ke "menunggu": itu akan sempat merender card
      // verifikasi di halaman ini. Langsung pindah ke ruang member yang
      // menampilkan card tersebut dalam mode terkunci.
      setBukti(null);
      router.push("/peserta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim bukti. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const menunggu = status === "menunggu";
  const dikonfirmasi = status === "dikonfirmasi";
  const ditolak = status === "ditolak";

  return (
    <div className="min-h-screen bg-[#EEF1F8] font-sans">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-slate-900">
              Indonesia-Korea Business Project
            </p>
            <p className="truncate text-xs text-slate-500">{nama}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:py-10">
        <section className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
              Aktifasi Akun Peserta
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Untuk masuk ke ruang member, transfer biaya layanan{" "}
              <b className="text-slate-900">{formatRupiah(HARGA_KONSULTASI)}</b> lalu unggah
              bukti transfernya. Akun Anda aktif setelah admin memverifikasi pembayaran.
            </p>
          </div>
        </section>

        {dikonfirmasi ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <h2 className="font-bold text-slate-900">Pembayaran dikonfirmasi</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Akun Anda sudah aktif. Silakan masuk ke halaman peserta.
                </p>
                <a
                  href="/peserta"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0052A4] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00438a]"
                >
                  Masuk ke Halaman Peserta <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ) : menunggu ? (
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-6 w-6 shrink-0 animate-spin text-amber-600" />
              <div>
                <h2 className="font-bold text-slate-900">Menunggu verifikasi admin</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Bukti transfer Anda sudah kami terima. Akses peserta akan terbuka otomatis
                  setelah admin menyetujui pembayaran. Biasanya memakan waktu beberapa saat.
                </p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" /> Cek status terbaru
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {ditolak && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <h2 className="font-bold text-red-800">Bukti perlu diperbaiki</h2>
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {pembayaran?.catatanAdmin ||
                        "Admin tidak dapat memverifikasi bukti Anda. Silakan unggah ulang."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold text-slate-900">1. Transfer ke rekening berikut</h2>
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Bank</dt>
                    <dd className="font-semibold text-slate-900">
                      {rekening.bankNama || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Nomor rekening</dt>
                    <dd className="flex items-center gap-2 font-semibold text-slate-900">
                      {rekening.bankNo || "-"}
                      {rekening.bankNo && (
                        <button
                          type="button"
                          onClick={salinNoRekening}
                          className="rounded p-1 text-[#0052A4] hover:bg-blue-50"
                          aria-label="Salin nomor rekening"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Atas nama</dt>
                    <dd className="font-semibold text-slate-900">
                      {rekening.bankAtasNama || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
                    <dt className="text-slate-500">Jumlah</dt>
                    <dd className="font-bold text-[#0052A4]">
                      {formatRupiah(HARGA_KONSULTASI)}
                    </dd>
                  </div>
                </dl>
                {disalin && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">Nomor rekening disalin.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-bold text-slate-900">
                2. Unggah bukti transfer {ditolak ? "yang benar" : ""}
              </h2>
              <form onSubmit={kirimBukti} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="namaChannel" className="block text-xs font-medium text-slate-700">
                    Bank pengirim
                  </label>
                  <select
                    id="namaChannel"
                    value={namaChannel}
                    onChange={(e) => setNamaChannel(e.target.value)}
                    className={input}
                  >
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="namaPengirim" className="block text-xs font-medium text-slate-700">
                    Nama pada rekening pengirim
                  </label>
                  <input
                    id="namaPengirim"
                    value={namaPengirim}
                    onChange={(e) => setNamaPengirim(e.target.value)}
                    required
                    minLength={2}
                    maxLength={255}
                    className={input}
                    placeholder="Nama sesuai bukti transfer"
                  />
                </div>

                <div>
                  <label htmlFor="bukti" className="block text-xs font-medium text-slate-700">
                    Gambar bukti transfer (JPG/PNG/WebP, maks. 5 MB)
                  </label>
                  <input
                    id="bukti"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setBukti(e.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0052A4] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#00438a]"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#00438a] disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {ditolak ? "Unggah Ulang Bukti" : "Kirim Bukti Pembayaran"}
                </button>
              </form>
            </section>
          </>
        )}

        {pembayaran && (
          <p className="text-center text-xs text-slate-500">
            Status terakhir: {STATUS_BAYAR[status as keyof typeof STATUS_BAYAR] ?? status} &middot;{" "}
            {new Date(pembayaran.createdAt).toLocaleString("id-ID")}
          </p>
        )}

        {grupUmum.url && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Butuh bantuan verifikasi?</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Hubungi admin melalui grup {grupUmum.nama} dengan menyertakan nama dan email Anda
              ({email} / {whatsapp}).
            </p>
            <a
              href={grupUmum.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Buka grup WhatsApp <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
