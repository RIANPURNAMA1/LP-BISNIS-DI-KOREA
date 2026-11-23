"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Gift,
  Link2,
  ListFilter,
  Loader2,
  RefreshCw,
  Search,
  type LucideIcon,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  STATUS_KOMISI,
  STATUS_PAYOUT,
  STATUS_REFERRAL,
} from "@/lib/afiliasi-konstanta";

type AffiliateRow = {
  id: number;
  nama: string;
  email: string;
  whatsapp: string;
  kode: string;
  aktif: boolean;
  createdAt: string;
  bankNama: string;
  bankNo: string;
  bankAtasNama: string;
  totalReferral: number;
  terverifikasi: number;
  totalKomisi: number;
  saldo: number;
  pencairanAktif: number;
};

type PayoutRow = {
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
  affiliate: { id: number; nama: string; email: string; whatsapp: string; kode: string };
};

type Detail = {
  id: number;
  nama: string;
  email: string;
  whatsapp: string;
  kode: string;
  link: string;
  aktif: boolean;
  bankNama: string;
  bankNo: string;
  bankAtasNama: string;
  createdAt: string;
  referrals: { id: number; status: string; createdAt: string; pendaftaran: { nama: string; email: string } }[];
  komisi: { id: number; jumlah: number; status: string; keterangan: string | null; createdAt: string; referral: { pendaftaran: { nama: string } } }[];
  payouts: PayoutRow[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const tanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const th = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const td = "px-4 py-3 text-sm text-slate-700";

function badge(status: string, map: Record<string, string>) {
  const style =
    status === "terverifikasi" || status === "dibayar" || status === "tersedia"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "menunggu" || status === "diproses" || status === "terdaftar"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${style}`}>{map[status] ?? status}</span>;
}

export default function AdminAfiliasi() {
  const [tab, setTab] = useState<"afiliasi" | "pencairan">("afiliasi");
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [ringkasan, setRingkasan] = useState({ affiliate: 0, referral: 0, terverifikasi: 0, saldo: 0, menunggu: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [proses, setProses] = useState<PayoutRow | null>(null);
  const [statusProses, setStatusProses] = useState<"dibayar" | "ditolak">("dibayar");
  const [catatan, setCatatan] = useState("");
  const [bukti, setBukti] = useState<File | null>(null);
  const [prosesLoading, setProsesLoading] = useState(false);
  const [pesan, setPesan] = useState("");
  const [daftarUrl, setDaftarUrl] = useState("/afiliasi");
  const [linkTersalin, setLinkTersalin] = useState(false);
  const [linkPesan, setLinkPesan] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const [ra, rp] = await Promise.all([
        fetch(`/api/admin/afiliasi?search=${encodeURIComponent(search)}`, { cache: "no-store" }),
        fetch("/api/admin/afiliasi/pencairan", { cache: "no-store" }),
      ]);
      if (ra.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const ja = await ra.json();
      const jp = await rp.json();
      if (!ja.success || !jp.success) throw new Error(ja.error || jp.error || "Gagal memuat data.");
      setAffiliates(ja.data);
      setPayouts(jp.data);
      setRingkasan({ ...ja.ringkasan, menunggu: jp.ringkasan.menunggu });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => void muat(), 250);
    return () => clearTimeout(t);
  }, [muat]);

  useEffect(() => {
    setDaftarUrl(`${window.location.origin}/afiliasi`);
  }, []);

  async function salinDaftarUrl() {
    try {
      await navigator.clipboard.writeText(daftarUrl);
      setLinkPesan("");
      setLinkTersalin(true);
      setTimeout(() => setLinkTersalin(false), 2000);
    } catch {
      setLinkPesan("Salin tautan manual dari kolom yang tersedia.");
    }
  }

  async function bukaDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/afiliasi/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat detail.");
      setDetail(json.data);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal memuat detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function kirimProses() {
    if (!proses) return;
    setProsesLoading(true);
    setPesan("");
    try {
      const form = new FormData();
      form.set("status", statusProses);
      form.set("catatan", catatan);
      if (bukti) form.set("bukti", bukti);
      const res = await fetch(`/api/admin/afiliasi/pencairan/${proses.id}`, {
        method: "PUT",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memproses pencairan.");
      setProses(null);
      setBukti(null);
      setCatatan("");
      if (fileRef.current) fileRef.current.value = "";
      await muat();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal memproses pencairan.");
    } finally {
      setProsesLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[520px] flex-col gap-4">
      {/* Judul — mengikuti gaya halaman Data Pendaftar */}
      <div className="flex shrink-0 items-start gap-3 px-1">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Afiliasi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Kelola affiliate, komisi, dan pencairan manual dengan bukti transfer.
          </p>
        </div>
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Affiliate", value: ringkasan.affiliate, icon: Gift },
          { label: "Total referral", value: ringkasan.referral, icon: Eye },
          { label: "Terverifikasi", value: ringkasan.terverifikasi, icon: CheckCircle2 },
          { label: "Saldo belum dicairkan", value: rupiah(ringkasan.saldo), icon: Wallet },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
            <div className="flex items-center gap-2 text-slate-500">
              <s.icon className="h-4 w-4 text-[#0052A4]" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tautan pendaftaran affiliate: publik, bisa disalin admin untuk dibagikan. */}
      <section className="shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
              <Link2 className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tautan daftar affiliate</h3>
              <p className="mt-1 text-xs text-slate-500">
                Bagikan ke calon affiliate. Halaman pendaftaran bersifat publik dan langsung aktif tanpa persetujuan admin.
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Saat admin sedang login, buka tautan ini di browser/incognito yang belum login agar tidak dialihkan ke dashboard.
              </p>
            </div>
          </div>
          <a
            href="/afiliasi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Buka halaman
          </a>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Tautan daftar affiliate"
            readOnly
            value={daftarUrl}
            className={`${inputCls} font-mono text-xs`}
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() => void salinDaftarUrl()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004080]"
          >
            {linkTersalin ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {linkTersalin ? "Tersalin" : "Salin"}
          </button>
        </div>
        {linkPesan && <p className="mt-1 text-xs text-amber-600">{linkPesan}</p>}
      </section>

      {/* Tab — mengikuti gaya tab Data Pendaftar */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-1">
        <button
          onClick={() => setTab("afiliasi")}
          className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
            tab === "afiliasi"
              ? "bg-white font-semibold text-[#0052A4] shadow-sm"
              : "bg-white/60 font-medium text-slate-500 hover:bg-white"
          }`}
        >
          <Gift className="h-4 w-4" />
          Daftar Affiliate
          <span className="rounded-full bg-[#0052A4] px-2 py-0.5 text-[11px] font-semibold text-white">
            {ringkasan.affiliate}
          </span>
        </button>
        <button
          onClick={() => setTab("pencairan")}
          className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
            tab === "pencairan"
              ? "bg-white font-semibold text-[#0052A4] shadow-sm"
              : "bg-white/60 font-medium text-slate-500 hover:bg-white"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Pencairan
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
              ringkasan.menunggu > 0 ? "bg-amber-500" : "bg-slate-400"
            }`}
          >
            {ringkasan.menunggu}
          </span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          {tab === "afiliasi" && (
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex h-11 w-full items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-1.5 transition-colors focus-within:border-[#0052A4]/50 sm:max-w-sm"
            >
              <ListFilter className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, atau kode..."
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="grid h-8 w-8 place-items-center rounded-full bg-[#0052A4]/10 text-[#0052A4] transition-colors hover:bg-[#0052A4]/20"
                aria-label="Cari"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          )}
          <button
            onClick={() => void muat()}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
          </button>
        </div>

        {error && (
          <div className="flex shrink-0 items-start gap-2 border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
          </div>
        ) : tab === "afiliasi" ? (
          <>
            <div className="min-h-0 flex-1 overflow-auto pl-3">
              <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                <thead>
                  <tr className="text-xs font-medium text-slate-500">
                    <th className="w-12 rounded-l-lg border-y border-l border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-4 py-3 font-medium">#</th>
                    {["Affiliate", "Kode", "Referral", "Terverifikasi", "Total komisi", "Saldo"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-y border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-3 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-y border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="border-b border-slate-200 px-4 py-10 text-center text-slate-400">
                        Belum ada affiliate.
                      </td>
                    </tr>
                  )}
                  {affiliates.map((a, i) => {
                    const bg = "bg-white group-hover:bg-slate-50";
                    return (
                      <tr key={a.id} className="group h-[53px]">
                        <td className={`border-b border-l border-r border-slate-200 px-4 py-3.5 text-slate-400 ${bg}`}>
                          {i + 1}
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>
                          <div className="flex flex-col leading-tight">
                            <span className="truncate font-medium text-slate-900">{a.nama}</span>
                            <span className="truncate text-[11px] text-slate-400">{a.email}</span>
                          </div>
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 font-mono text-xs text-[#0052A4] ${bg}`}>
                          {a.kode}
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>{a.totalReferral}</td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>{a.terverifikasi}</td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>{rupiah(a.totalKomisi)}</td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 font-semibold ${bg}`}>
                          {rupiah(a.saldo)}
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                          <div className="flex items-center justify-end">
                            <IconAction onClick={() => void bukaDetail(a.id)} icon={Eye} label="Detail" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex h-[57px] shrink-0 items-center border-t border-slate-100 px-4 text-xs text-slate-500">
              {affiliates.length} affiliate{search ? " yang cocok" : ""}
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto pl-3">
              <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                <thead>
                  <tr className="text-xs font-medium text-slate-500">
                    <th className="w-12 rounded-l-lg border-y border-l border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-4 py-3 font-medium">#</th>
                    {["Affiliate", "Jumlah", "Rekening", "Status", "Waktu"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-y border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-3 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-y border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border-b border-slate-200 px-4 py-10 text-center text-slate-400">
                        Belum ada pengajuan pencairan.
                      </td>
                    </tr>
                  )}
                  {payouts.map((p, i) => {
                    const bg = "bg-white group-hover:bg-slate-50";
                    return (
                      <tr key={p.id} className="group h-[53px]">
                        <td className={`border-b border-l border-r border-slate-200 px-4 py-3.5 text-slate-400 ${bg}`}>
                          {i + 1}
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>
                          <div className="flex flex-col leading-tight">
                            <span className="truncate font-medium text-slate-900">{p.affiliate.nama}</span>
                            <span className="truncate text-[11px] text-slate-400">{p.affiliate.email}</span>
                          </div>
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 font-semibold ${bg}`}>
                          {rupiah(p.jumlah)}
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>
                          <span className="truncate">{p.bankNama} · {p.bankNo}</span>
                          <span className="block truncate text-[11px] text-slate-400">a.n. {p.bankAtasNama}</span>
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>
                          {badge(p.status, STATUS_PAYOUT)}
                        </td>
                        <td className={`border-b border-r border-slate-200 px-3 py-3.5 ${bg}`}>
                          {tanggal(p.createdAt)}
                        </td>
                        <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                          <div className="flex items-center justify-end">
                            {p.status === "menunggu" ? (
                              <button
                                onClick={() => {
                                  setProses(p);
                                  setStatusProses("dibayar");
                                  setCatatan("");
                                  setBukti(null);
                                  setPesan("");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#0052A4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004080]"
                              >
                                <Wallet className="h-3.5 w-3.5" /> Proses
                              </button>
                            ) : p.bukti ? (
                              <a
                                href={p.bukti}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-[#0052A4] hover:underline"
                              >
                                Lihat bukti
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex h-[57px] shrink-0 items-center border-t border-slate-100 px-4 text-xs text-slate-500">
              {payouts.length} pengajuan pencairan
            </div>
          </>
        )}
      </div>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">Detail affiliate</h3>
              <button onClick={() => setDetail(null)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" /></div>
            ) : detail ? (
              <div className="space-y-5 p-5">
                <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <p><span className="text-slate-500">Nama: </span><b>{detail.nama}</b></p>
                  <p><span className="text-slate-500">Email: </span>{detail.email}</p>
                  <p><span className="text-slate-500">WhatsApp: </span>{detail.whatsapp}</p>
                  <p><span className="text-slate-500">Kode: </span><b className="font-mono text-[#0052A4]">{detail.kode}</b></p>
                  <p className="sm:col-span-2"><span className="text-slate-500">Tautan: </span><span className="break-all text-xs text-[#0052A4]">{detail.link}</span></p>
                  <p className="sm:col-span-2"><span className="text-slate-500">Rekening: </span>{detail.bankNama} · {detail.bankNo} a.n. {detail.bankAtasNama}</p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-800">Referral</h4>
                  <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                    <table className="w-full min-w-[420px] border-collapse">
                      <thead className="bg-slate-50"><tr><th className={th}>Nama</th><th className={th}>Status</th><th className={th}>Waktu</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.referrals.length === 0 && <tr><td colSpan={3} className={`${td} text-center text-slate-400`}>Belum ada.</td></tr>}
                        {detail.referrals.map((r) => <tr key={r.id}><td className={td}>{r.pendaftaran.nama}</td><td className={td}>{badge(r.status, STATUS_REFERRAL)}</td><td className={td}>{tanggal(r.createdAt)}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-slate-800">Komisi</h4>
                  <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                    <table className="w-full min-w-[420px] border-collapse">
                      <thead className="bg-slate-50"><tr><th className={th}>Referral</th><th className={th}>Jumlah</th><th className={th}>Status</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail.komisi.length === 0 && <tr><td colSpan={3} className={`${td} text-center text-slate-400`}>Belum ada.</td></tr>}
                        {detail.komisi.map((k) => <tr key={k.id}><td className={td}>{k.referral.pendaftaran.nama}</td><td className={td}>{rupiah(k.jumlah)}</td><td className={td}>{badge(k.status, STATUS_KOMISI)}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {proses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Proses pencairan</h3>
                <p className="mt-1 text-sm text-slate-500">{proses.affiliate.nama} · {rupiah(proses.jumlah)}</p>
              </div>
              <button onClick={() => setProses(null)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">Keputusan</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStatusProses("dibayar")}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusProses === "dibayar" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <CheckCircle2 className="mx-auto mb-1 h-4 w-4" /> Dibayar
                  </button>
                  <button
                    onClick={() => setStatusProses("ditolak")}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusProses === "ditolak" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <XCircle className="mx-auto mb-1 h-4 w-4" /> Ditolak
                  </button>
                </div>
              </div>

              {statusProses === "dibayar" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Bukti transfer (JPG/PNG/WebP, maks. 5 MB)</label>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setBukti(e.target.files?.[0] ?? null)} className="w-full text-xs text-slate-600" />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Catatan (opsional)</label>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} className={inputCls} placeholder="Contoh: transfer via BCA" />
              </div>

              {pesan && <p className="text-xs font-medium text-red-600">{pesan}</p>}

              <button
                onClick={() => void kirimProses()}
                disabled={prosesLoading || (statusProses === "dibayar" && !bukti)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prosesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Simpan hasil pencairan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconAction({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-[#0052A4]/10 hover:text-[#0052A4]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
