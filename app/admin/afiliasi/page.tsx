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
  Loader2,
  RefreshCw,
  Search,
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
            <Gift className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Afiliasi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kelola affiliate, komisi, dan pencairan manual dengan bukti transfer.
            </p>
          </div>
        </div>
        <button onClick={() => void muat()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 sm:p-5">
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

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {(["afiliasi", "pencairan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t ? "border-[#0052A4] text-[#0052A4]" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "afiliasi" ? "Daftar Affiliate" : `Pencairan${ringkasan.menunggu ? ` (${ringkasan.menunggu})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "afiliasi" && (
        <div className="relative mb-3 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau kode..."
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" /></div>
      ) : tab === "afiliasi" ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className={th}>Affiliate</th><th className={th}>Kode</th><th className={th}>Referral</th>
                  <th className={th}>Terverifikasi</th><th className={th}>Total komisi</th><th className={th}>Saldo</th><th className={th}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affiliates.length === 0 && <tr><td colSpan={7} className={`${td} text-center text-slate-400`}>Belum ada affiliate.</td></tr>}
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>
                      <p className="font-semibold text-slate-900">{a.nama}</p>
                      <p className="text-[11px] text-slate-500">{a.email}</p>
                    </td>
                    <td className={`${td} font-mono text-xs text-[#0052A4]`}>{a.kode}</td>
                    <td className={td}>{a.totalReferral}</td>
                    <td className={td}>{a.terverifikasi}</td>
                    <td className={td}>{rupiah(a.totalKomisi)}</td>
                    <td className={`${td} font-semibold`}>{rupiah(a.saldo)}</td>
                    <td className={td}>
                      <button onClick={() => void bukaDetail(a.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className={th}>Affiliate</th><th className={th}>Jumlah</th><th className={th}>Rekening</th>
                  <th className={th}>Status</th><th className={th}>Waktu</th><th className={th}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.length === 0 && <tr><td colSpan={6} className={`${td} text-center text-slate-400`}>Belum ada pengajuan pencairan.</td></tr>}
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={td}>
                      <p className="font-semibold text-slate-900">{p.affiliate.nama}</p>
                      <p className="text-[11px] text-slate-500">{p.affiliate.email}</p>
                    </td>
                    <td className={`${td} font-semibold`}>{rupiah(p.jumlah)}</td>
                    <td className={td}>
                      {p.bankNama} · {p.bankNo}<span className="block text-[11px] text-slate-500">a.n. {p.bankAtasNama}</span>
                    </td>
                    <td className={td}>{badge(p.status, STATUS_PAYOUT)}</td>
                    <td className={td}>{tanggal(p.createdAt)}</td>
                    <td className={td}>
                      {p.status === "menunggu" ? (
                        <button onClick={() => { setProses(p); setStatusProses("dibayar"); setCatatan(""); setBukti(null); setPesan(""); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#0052A4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004080]">
                          <Wallet className="h-3.5 w-3.5" /> Proses
                        </button>
                      ) : p.bukti ? (
                        <a href={p.bukti} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0052A4] hover:underline">Lihat bukti</a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
