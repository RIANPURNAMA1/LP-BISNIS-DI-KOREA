"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, Loader2, Search, Users } from "lucide-react";
import {
  AfiliasiHeader,
  FOCUS,
  KontakPeserta,
  SisaWaktu,
  StatusJoin,
  Statistik,
  tanggal,
  type ReferralItem,
} from "../referral-ui";

const PER_HALAMAN = 10;

type Filter = "semua" | "belum" | "join" | "event";
const FILTER: { kunci: Filter; label: string }[] = [
  { kunci: "semua", label: "Semua" },
  { kunci: "belum", label: "Belum ikut" },
  { kunci: "event", label: "Ikut webinar / seminar" },
  { kunci: "join", label: "Sudah join bisnis" },
];

function cocokFilter(r: ReferralItem, f: Filter) {
  const e = r.pendaftaran.eventStatus;
  if (f === "belum") return !e;
  if (f === "join") return e === "join";
  if (f === "event") return e === "webinar" || e === "seminar" || e === "keduanya";
  return true;
}

export default function DataPendaftarAfiliasi() {
  const [referrals, setReferrals] = useState<ReferralItem[] | null>(null);
  const [berlakuHari, setBerlakuHari] = useState(90);
  const [error, setError] = useState("");
  const [cari, setCari] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [halaman, setHalaman] = useState(1);

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/afiliasi/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login?callbackUrl=%2Fafiliasi%2Fdashboard%2Fpendaftar";
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat data.");
      setReferrals(json.data.referrals);
      setBerlakuHari(json.data.berlakuHari ?? 90);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const hitung = useMemo(() => {
    const list = referrals ?? [];
    return {
      semua: list.length,
      belum: list.filter((r) => cocokFilter(r, "belum")).length,
      event: list.filter((r) => cocokFilter(r, "event")).length,
      join: list.filter((r) => cocokFilter(r, "join")).length,
    };
  }, [referrals]);

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return (referrals ?? []).filter((r) => {
      if (!cocokFilter(r, filter)) return false;
      if (!q) return true;
      const { nama, email, whatsapp } = r.pendaftaran;
      return (
        nama.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        whatsapp.replace(/\s|-/g, "").includes(q.replace(/\s|-/g, ""))
      );
    });
  }, [referrals, cari, filter]);

  const totalHalaman = Math.max(1, Math.ceil(hasil.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const awal = (halamanAktif - 1) * PER_HALAMAN;
  const baris = hasil.slice(awal, awal + PER_HALAMAN);

  return (
    <div className="min-h-screen bg-white">
      <AfiliasiHeader aktif="pendaftar" onRefresh={() => void muat()} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href="/afiliasi/dashboard"
          className={`mb-4 inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-500 hover:text-[#0052A4] ${FOCUS}`}
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
        </Link>

        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Data pendaftar
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Semua orang yang mendaftar lewat link Anda. Hubungi lewat WhatsApp atau email
            secepatnya.
          </p>
        </div>

        {error ? (
          <div className="max-w-sm py-10">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm font-medium text-slate-700">{error}</p>
            <button
              onClick={() => void muat()}
              className={`mt-4 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#00438a] ${FOCUS}`}
            >
              Coba lagi
            </button>
          </div>
        ) : !referrals ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Statistik label="Total" nilai={hitung.semua} hint="Semua pendaftar" />
              <Statistik label="Belum ikut" nilai={hitung.belum} hint="Belum ikut program" />
              <Statistik label="Ikut event" nilai={hitung.event} hint="Webinar / seminar" />
              <Statistik label="Sudah join bisnis" nilai={hitung.join} hint="Join bisnis" />
            </div>

            {/* Cari & filter */}
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label="Filter status"
                className="flex flex-wrap gap-1.5"
              >
                {FILTER.map((f) => (
                  <button
                    key={f.kunci}
                    role="tab"
                    aria-selected={filter === f.kunci}
                    onClick={() => {
                      setFilter(f.kunci);
                      setHalaman(1);
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      filter === f.kunci
                        ? "bg-[#0052A4] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    } ${FOCUS}`}
                  >
                    {f.label}
                    <span className={filter === f.kunci ? "ml-1.5 text-white/80" : "ml-1.5 text-slate-400"}>
                      {hitung[f.kunci]}
                    </span>
                  </button>
                ))}
              </div>
              <label className="relative block w-full lg:w-72">
                <span className="sr-only">Cari pendaftar</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={cari}
                  onChange={(e) => {
                    setCari(e.target.value);
                    setHalaman(1);
                  }}
                  placeholder="Cari nama, email, atau WhatsApp"
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
                />
              </label>
            </div>

            {/* Tabel */}
            {hasil.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 px-4 py-12 text-center">
                <Users className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {referrals.length === 0 ? "Belum ada pendaftar" : "Tidak ada data yang cocok"}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {referrals.length === 0
                    ? "Bagikan link affiliate Anda. Peserta yang mendaftar akan muncul di sini."
                    : "Coba ubah kata kunci atau filter status."}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                      <tr>
                        <th scope="col" className="w-12 px-4 py-2.5">No</th>
                        <th scope="col" className="px-4 py-2.5">Nama</th>
                        <th scope="col" className="px-4 py-2.5">Kontak (follow up)</th>
                        <th scope="col" className="px-4 py-2.5">Mendaftar</th>
                        <th scope="col" className="px-4 py-2.5">Status Join Program</th>
                        <th scope="col" className="px-4 py-2.5">Sisa waktu bayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {baris.map((r, i) => (
                        <tr key={r.id} className="align-top">
                          <td className="px-4 py-3 text-sm tabular-nums text-slate-400">
                            {awal + i + 1}
                          </td>
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

                {/* Halaman */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Menampilkan {awal + 1}–{awal + baris.length} dari {hasil.length} pendaftar
                  </p>
                  {totalHalaman > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHalaman(halamanAktif - 1)}
                        disabled={halamanAktif === 1}
                        aria-label="Halaman sebelumnya"
                        className={`grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-slate-700">
                        Halaman {halamanAktif} / {totalHalaman}
                      </span>
                      <button
                        onClick={() => setHalaman(halamanAktif + 1)}
                        disabled={halamanAktif === totalHalaman}
                        aria-label="Halaman berikutnya"
                        className={`grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
