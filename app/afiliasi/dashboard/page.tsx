"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  Mail,
  Phone,
  Save,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { STATUS_PAYOUT, STATUS_REFERRAL } from "@/lib/afiliasi-konstanta";
import {
  AfiliasiHeader,
  Badge,
  FOCUS,
  KontakPeserta,
  SisaWaktu,
  StatusJoin,
  Statistik,
  tanggal,
} from "./referral-ui";

type DashboardData = {
  profil: {
    id: number;
    nama: string;
    email: string;
    whatsapp: string;
    kode: string;
    bankNama: string;
    bankNo: string;
    bankAtasNama: string;
    createdAt: string;
  };
  kode: string;
  link: string;
  saldo: number;
  totalKomisi: number;
  minimalPencairan: number;
  bisaCairkan: boolean;
  adaPencairanAktif: boolean;
  statistik: {
    referral: number;
    terverifikasi: number;
    komisi: number;
    pencairan: number;
  };
  berlakuHari: number;
  referrals: {
    id: number;
    kode: string;
    status: string;
    createdAt: string;
    batasAt: string;
    /** Sisa hari menunggu closing; null bila sudah closing / kedaluwarsa. */
    sisaHari: number | null;
    pendaftaran: {
      nama: string;
      email: string;
      whatsapp: string;
      aksesAktifAt: string | null;
      eventStatus: string;
      joinAt: string | null;
    };
  }[];
  komisi: {
    id: number;
    jumlah: number;
    status: string;
    keterangan: string | null;
    createdAt: string;
    referral: { pendaftaran: { nama: string } };
  }[];
  payouts: {
    id: number;
    jumlah: number;
    bankNama: string;
    bankNo: string;
    bankAtasNama: string;
    status: string;
    bukti: string | null;
    catatanAdmin: string | null;
    diprosesAt: string | null;
    createdAt: string;
  }[];
};


/** Jumlah baris referral di tampilan awal, dan tambahan tiap "Lihat lebih banyak". */
const JUMLAH_AWAL = 5;
const JUMLAH_TAMBAH = 10;

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

/* ---------- Komponen kecil ---------- */

function Step({
  no,
  title,
  status,
  done,
  last,
  children,
}: {
  no: number;
  title: string;
  status?: string;
  done?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-10 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className={`absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-px ${
            done ? "bg-[#0052A4]" : "bg-slate-200"
          }`}
        />
      )}
      <span
        className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
          done
            ? "bg-[#0052A4] text-white"
            : "border-2 border-[#0052A4] bg-white text-[#0052A4]"
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : no}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {status && <span className="text-sm text-slate-500">{status}</span>}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
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

/* ---------- Halaman ---------- */

export default function DashboardAfiliasi() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tampil, setTampil] = useState(JUMLAH_AWAL);
  const [copied, setCopied] = useState<"link" | "kode" | null>(null);
  const [rekening, setRekening] = useState({ bankNama: "", bankNo: "", bankAtasNama: "" });
  const [simpanLoading, setSimpanLoading] = useState(false);
  const [pesanRekening, setPesanRekening] = useState<{ ok: boolean; text: string } | null>(null);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/afiliasi/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login?callbackUrl=%2Fafiliasi%2Fdashboard";
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat data.");
      setData(json.data);
      setRekening({
        bankNama: json.data.profil.bankNama ?? "",
        bankNo: json.data.profil.bankNo ?? "",
        bankAtasNama: json.data.profil.bankAtasNama ?? "",
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function salin(jenis: "link" | "kode") {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(jenis === "link" ? data.link : data.kode);
      setCopied(jenis);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard tidak tersedia; link tetap bisa disalin manual dari kolomnya */
    }
  }

  async function simpanRekening(e: React.FormEvent) {
    e.preventDefault();
    setPesanRekening(null);
    setSimpanLoading(true);
    try {
      const res = await fetch("/api/afiliasi/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rekening),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan rekening.");
      setPesanRekening({ ok: true, text: "Rekening berhasil disimpan." });
      await muat();
    } catch (e) {
      setPesanRekening({
        ok: false,
        text: e instanceof Error ? e.message : "Gagal menyimpan rekening.",
      });
    } finally {
      setSimpanLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">{error || "Data tidak tersedia."}</p>
          <button
            onClick={() => void muat()}
            className={`mt-4 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const { referrals, berlakuHari } = data;
  const belumIkut = referrals.filter((r) => !r.pendaftaran.eventStatus).length;
  const closing = referrals.filter((r) => r.pendaftaran.eventStatus === "join").length;
  const rekeningLengkap = !!(data.profil.bankNama && data.profil.bankNo && data.profil.bankAtasNama);
  const pesanWa = `Halo! Yuk gabung program Indonesia-Korea Business Project lewat link saya: ${data.link}`;

  return (
    <div className="min-h-screen bg-white">
      <AfiliasiHeader aktif="dashboard" onRefresh={() => void muat()} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Sapaan */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Halo, {data.profil.nama}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Ajak calon peserta lewat link Anda.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* ALUR */}
          <ol className="min-w-0">
            {/* 1. Bagikan */}
            <Step
              no={1}
              title="Bagikan link Anda"
              done={referrals.length > 0}
              status={referrals.length > 0 ? `${referrals.length} referral` : "Belum ada referral"}
            >
              <p className="max-w-prose text-sm leading-6 text-slate-600">
                Setiap orang yang mendaftar lewat link ini tercatat sebagai referral Anda.
              </p>

              <label className={`${labelCls} mt-4`} htmlFor="link-afiliasi">
                Link pendaftaran
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="link-afiliasi"
                  readOnly
                  value={data.link}
                  onFocus={(e) => e.target.select()}
                  className={`${inputCls} font-mono text-[13px]`}
                />
                <button
                  type="button"
                  onClick={() => void salin("link")}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
                >
                  {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "link" ? "Tersalin" : "Salin link"}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(pesanWa)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 ${FOCUS}`}
                >
                  <Send className="h-4 w-4 text-[#1B9A4B]" /> Bagikan lewat WhatsApp
                </a>
                <p className="text-sm text-slate-500">
                  Kode:{" "}
                  <button
                    type="button"
                    onClick={() => void salin("kode")}
                    title="Salin kode"
                    className={`rounded px-1 font-mono font-semibold tracking-wider text-[#0052A4] hover:bg-slate-100 ${FOCUS}`}
                  >
                    {data.kode}
                  </button>
                  {copied === "kode" && <span className="ml-1 text-emerald-600">tersalin</span>}
                </p>
              </div>
            </Step>

            {/* 2. Pantau referral */}
            <Step
              no={2}
              last
              title="Pantau referral Anda"
              done={closing > 0}
              status={closing > 0 ? `${closing} sudah join` : undefined}
            >
              <div className="mb-4 flex items-start gap-2.5 rounded-md bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-[#0052A4]" />
                <span>
                  Peserta harus <b>Join Bisnis dalam {berlakuHari} hari</b> sejak mendaftar lewat link
                  Anda. Selama masa itu peserta <b>terkunci atas nama Anda</b> dan tidak bisa ikut
                  affiliate lain. Begitu peserta join, hitung mundur berhenti dan tercatat{" "}
                  <b>Sudah join bisnis</b> beserta tanggalnya. Lewat {berlakuHari} hari tanpa join, peserta
                  tidak bisa lagi dihitung join atas nama Anda dan tidak lagi terafiliasi dengan link
                  Anda.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Statistik label="Total" nilai={referrals.length} hint="Semua referral" />
                <Statistik label="Belum ikut" nilai={belumIkut} hint="Belum ikut program" />
                <Statistik label="Sudah join bisnis" nilai={closing} hint="Join bisnis" />
              </div>

              {referrals.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed border-slate-300 px-4 py-8 text-center">
                  <Users className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-900">Belum ada referral</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Bagikan link di langkah 1. Peserta yang mendaftar akan muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                        <tr>
                          <th scope="col" className="px-4 py-2.5">Nama</th>
                          <th scope="col" className="px-4 py-2.5">Kontak (follow up)</th>
                          <th scope="col" className="px-4 py-2.5">Mendaftar</th>
                          <th scope="col" className="px-4 py-2.5">Status Join Program</th>
                          <th scope="col" className="px-4 py-2.5">Sisa waktu bayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {referrals.slice(0, tampil).map((r) => (
                          <tr key={r.id} className="align-top">
                            <td className="px-4 py-3">
                              <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                                {r.pendaftaran.nama}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              {r.status === "kedaluwarsa" ? (
                                <span className="text-xs text-slate-400">Tidak lagi terafiliasi</span>
                              ) : (
                                <KontakPeserta r={r} />
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                              {tanggal(r.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusJoin value={r.pendaftaran.eventStatus} />
                            </td>
                            <td className="px-4 py-3">
                              <SisaWaktu r={r} total={berlakuHari} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Menampilkan {Math.min(tampil, referrals.length)} dari {referrals.length} referral
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/afiliasi/dashboard/pendaftar"
                        className={`inline-flex items-center gap-2 rounded-md bg-[#0052A4] px-4 py-2 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
                      >
                        <Users className="h-4 w-4" /> Data pendaftar
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      {tampil > JUMLAH_AWAL && (
                        <button
                          type="button"
                          onClick={() => setTampil(JUMLAH_AWAL)}
                          className={`rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 ${FOCUS}`}
                        >
                          Tampilkan lebih sedikit
                        </button>
                      )}
                      {tampil < referrals.length && (
                        <button
                          type="button"
                          onClick={() => setTampil((n) => n + JUMLAH_TAMBAH)}
                          className={`rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 ${FOCUS}`}
                        >
                          Lihat lebih banyak
                          <span className="ml-1.5 text-slate-500">
                            ({Math.min(JUMLAH_TAMBAH, referrals.length - tampil)} lagi)
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Step>
          </ol>

          {/* SIDEBAR */}
          <aside className="space-y-6 lg:border-l lg:border-slate-200 lg:pl-8">
            <section>
              <p className="truncate text-base font-semibold text-slate-900">{data.profil.nama}</p>
              <p className="text-sm text-slate-500">Affiliate · bergabung {tanggal(data.profil.createdAt)}</p>
              <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-200">
                <InfoRow icon={Phone} label="WhatsApp" value={data.profil.whatsapp} />
                <InfoRow icon={Mail} label="Email" value={data.profil.email} />
              </dl>
            </section>

            <section className="border-t border-slate-200 pt-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Info className="h-4 w-4 text-[#0052A4]" /> Ketentuan singkat
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Peserta tercatat saat mendaftar lewat link Anda.</li>
                <li>Peserta harus Join Bisnis maksimal {berlakuHari} hari sejak mendaftar.</li>
                <li>Selama {berlakuHari} hari itu, peserta terkunci untuk Anda dan tidak bisa ikut affiliate lain.</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
