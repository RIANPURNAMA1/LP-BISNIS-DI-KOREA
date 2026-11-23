"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  Link2,
  Loader2,
  LogOut,
  RefreshCw,
  Save,
  Users,
  Wallet,
} from "lucide-react";
import {
  STATUS_KOMISI,
  STATUS_PAYOUT,
  STATUS_REFERRAL,
} from "@/lib/afiliasi-konstanta";

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
  referrals: {
    id: number;
    kode: string;
    status: string;
    createdAt: string;
    pendaftaran: { nama: string; email: string; aksesAktifAt: string | null };
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

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const tanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";
const card = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";
const cardHead = "flex items-center gap-3 border-b border-slate-100 px-5 py-4";
const iconBox = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]";
const th = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const td = "px-4 py-3 text-sm text-slate-700";

function badge(status: string, map: Record<string, string>) {
  const style =
    status === "terverifikasi" || status === "dibayar" || status === "tersedia"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "menunggu" || status === "diproses" || status === "terdaftar"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${style}`}>
      {map[status] ?? status}
    </span>
  );
}

export default function DashboardAfiliasi() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rekening, setRekening] = useState({ bankNama: "", bankNo: "", bankAtasNama: "" });
  const [simpanLoading, setSimpanLoading] = useState(false);
  const [pesanRekening, setPesanRekening] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [cairLoading, setCairLoading] = useState(false);
  const [pesanCair, setPesanCair] = useState("");

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

  async function salinLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setPesanCair("Salin tautan manual dari kolom yang tersedia.");
    }
  }

  async function simpanRekening(e: React.FormEvent) {
    e.preventDefault();
    setPesanRekening("");
    setSimpanLoading(true);
    try {
      const res = await fetch("/api/afiliasi/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rekening),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan rekening.");
      setPesanRekening("Rekening berhasil disimpan.");
      await muat();
    } catch (e) {
      setPesanRekening(e instanceof Error ? e.message : "Gagal menyimpan rekening.");
    } finally {
      setSimpanLoading(false);
    }
  }

  async function ajukanCair() {
    setPesanCair("");
    setCairLoading(true);
    try {
      const res = await fetch("/api/afiliasi/pencairan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konfirmasi }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Pengajuan gagal.");
      setKonfirmasi(false);
      await muat();
    } catch (e) {
      setPesanCair(e instanceof Error ? e.message : "Pengajuan gagal.");
    } finally {
      setCairLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF1F8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0052A4]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF1F8] px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">{error || "Data tidak tersedia."}</p>
          <button onClick={() => void muat()} className="mt-4 rounded-full bg-[#0052A4] px-4 py-2 text-sm font-semibold text-white">
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1F8]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0052A4] text-white">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Dashboard Affiliate</p>
            <p className="truncate text-[11px] text-slate-500">
              {data.profil.nama} · {data.profil.email}
            </p>
          </div>
          <button
            onClick={() => void muat()}
            aria-label="Muat ulang"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {/* Kode & tautan */}
        <section className={card}>
          <div className={cardHead}>
            <span className={iconBox}><Link2 className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kode & tautan undangan Anda</h2>
              <p className="text-[11px] text-slate-500">Bagikan kepada calon peserta. Komisi dihitung otomatis setelah pembayaran mereka terverifikasi.</p>
            </div>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-[180px_1fr]">
            <div className="rounded-xl bg-[#0052A4]/5 px-4 py-3 text-center ring-1 ring-[#0052A4]/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0052A4]/70">Kode affiliate</p>
              <p className="mt-1 text-lg font-extrabold tracking-widest text-[#0052A4]">{data.kode}</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="link-afiliasi">Tautan pendaftaran</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="link-afiliasi" readOnly value={data.link} className={`${inputCls} font-mono text-xs`} onFocus={(e) => e.target.select()} />
                <button
                  onClick={() => void salinLink()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004080]"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              {pesanCair && !konfirmasi && <p className="mt-1 text-xs text-amber-600">{pesanCair}</p>}
            </div>
          </div>
        </section>

        {/* Statistik */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Saldo tersedia", value: rupiah(data.saldo), icon: Wallet },
            { label: "Total komisi", value: rupiah(data.totalKomisi), icon: Gift },
            { label: "Total referral", value: String(data.statistik.referral), icon: Users },
            { label: "Terverifikasi", value: String(data.statistik.terverifikasi), icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-center gap-2 text-slate-500">
                <s.icon className="h-4 w-4 text-[#0052A4]" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </section>

        {/* Rekening & pencairan */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <div className={cardHead}>
              <span className={iconBox}><Wallet className="h-4 w-4" /></span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Rekening pencairan</h2>
                <p className="text-[11px] text-slate-500">Snapshot rekening disimpan saat Anda mengajukan pencairan.</p>
              </div>
            </div>
            <form onSubmit={simpanRekening} className="space-y-3 p-5">
              <div>
                <label className={labelCls} htmlFor="rek-bank">Nama bank</label>
                <input id="rek-bank" className={inputCls} value={rekening.bankNama} onChange={(e) => setRekening({ ...rekening, bankNama: e.target.value })} placeholder="BCA" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="rek-no">Nomor rekening</label>
                  <input id="rek-no" inputMode="numeric" className={inputCls} value={rekening.bankNo} onChange={(e) => setRekening({ ...rekening, bankNo: e.target.value })} placeholder="1234567890" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="rek-nama">Atas nama</label>
                  <input id="rek-nama" className={inputCls} value={rekening.bankAtasNama} onChange={(e) => setRekening({ ...rekening, bankAtasNama: e.target.value })} placeholder="Nama pemilik rekening" />
                </div>
              </div>
              {pesanRekening && (
                <p className={`text-xs font-medium ${pesanRekening.includes("berhasil") ? "text-emerald-600" : "text-red-600"}`}>{pesanRekening}</p>
              )}
              <button type="submit" disabled={simpanLoading} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {simpanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan rekening
              </button>
            </form>
          </div>

          <div className={card}>
            <div className={cardHead}>
              <span className={iconBox}><Gift className="h-4 w-4" /></span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Ajukan pencairan</h2>
                <p className="text-[11px] text-slate-500">Minimal pencairan {rupiah(data.minimalPencairan)}.</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">Saldo siap dicairkan</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{rupiah(data.saldo)}</p>
              </div>
              {data.adaPencairanAktif && (
                <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  <Clock className="h-4 w-4" /> Pengajuan sebelumnya masih diproses admin.
                </p>
              )}
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
                <input type="checkbox" checked={konfirmasi} onChange={(e) => setKonfirmasi(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0052A4]" />
                Saya mengajukan pencairan seluruh saldo tersedia ke rekening yang tersimpan.
              </label>
              <button
                onClick={() => void ajukanCair()}
                disabled={!data.bisaCairkan || !konfirmasi || cairLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cairLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Ajukan pencairan
              </button>
              {!data.bisaCairkan && !data.adaPencairanAktif && (
                <p className="text-center text-xs text-slate-500">
                  Saldo belum mencapai minimal atau rekening belum lengkap.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Riwayat */}
        <section className={card}>
          <div className={cardHead}>
            <span className={iconBox}><Users className="h-4 w-4" /></span>
            <h2 className="text-sm font-bold text-slate-900">Referral Anda</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead className="bg-slate-50"><tr><th className={th}>Nama</th><th className={th}>Email</th><th className={th}>Status</th><th className={th}>Waktu</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.referrals.length === 0 && <tr><td colSpan={4} className={`${td} text-center text-slate-400`}>Belum ada referral.</td></tr>}
                {data.referrals.map((r) => (
                  <tr key={r.id}>
                    <td className={td}>{r.pendaftaran.nama}</td>
                    <td className={td}>{r.pendaftaran.email}</td>
                    <td className={td}>{badge(r.status, STATUS_REFERRAL)}</td>
                    <td className={td}>{tanggal(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <div className={cardHead}><span className={iconBox}><Gift className="h-4 w-4" /></span><h2 className="text-sm font-bold text-slate-900">Riwayat komisi</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse">
                <thead className="bg-slate-50"><tr><th className={th}>Referral</th><th className={th}>Jumlah</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.komisi.length === 0 && <tr><td colSpan={3} className={`${td} text-center text-slate-400`}>Belum ada komisi.</td></tr>}
                  {data.komisi.map((k) => (
                    <tr key={k.id}>
                      <td className={td}>{k.referral.pendaftaran.nama}<span className="block text-[11px] text-slate-400">{tanggal(k.createdAt)}</span></td>
                      <td className={`${td} font-semibold`}>{rupiah(k.jumlah)}</td>
                      <td className={td}>{badge(k.status, STATUS_KOMISI as Record<string, string>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={card}>
            <div className={cardHead}><span className={iconBox}><Wallet className="h-4 w-4" /></span><h2 className="text-sm font-bold text-slate-900">Riwayat pencairan</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse">
                <thead className="bg-slate-50"><tr><th className={th}>Jumlah</th><th className={th}>Status</th><th className={th}>Bukti</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payouts.length === 0 && <tr><td colSpan={3} className={`${td} text-center text-slate-400`}>Belum ada pencairan.</td></tr>}
                  {data.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className={`${td} font-semibold`}>{rupiah(p.jumlah)}<span className="block text-[11px] font-normal text-slate-400">{tanggal(p.createdAt)}</span></td>
                      <td className={td}>{badge(p.status, STATUS_PAYOUT)}</td>
                      <td className={td}>
                        {p.bukti ? (
                          <a href={p.bukti} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0052A4] hover:underline">Lihat bukti</a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        {p.catatanAdmin && <span className="mt-1 block text-[11px] text-slate-500">{p.catatanAdmin}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
