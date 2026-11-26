"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, Loader2, Search } from "lucide-react";

type Status = "belum" | "proses" | "selesai";
type Baris = {
  id: number;
  nama: string;
  email: string;
  whatsapp: string;
  status: Status;
  sedangMenonton: boolean;
  persen: number;
  mulaiAt: string | null;
  terakhirAt: string | null;
  selesaiAt: string | null;
};
type Ringkasan = { total: number; belum: number; proses: number; selesai: number; menonton: number };

const POLL_MS = 7000;

// Link WhatsApp (sama dengan halaman pendaftar).
function waLink(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return `https://wa.me/${n}`;
}

const waktu = (v: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

function lalu(v: string | null, now: number) {
  if (!v) return "-";
  const d = Math.max(0, Math.floor((now - new Date(v).getTime()) / 1000));
  if (d < 60) return `${d} detik lalu`;
  if (d < 3600) return `${Math.floor(d / 60)} menit lalu`;
  if (d < 86400) return `${Math.floor(d / 3600)} jam lalu`;
  return waktu(v);
}

const BADGE: Record<Status, { label: string; cls: string }> = {
  belum: { label: "Belum mulai", cls: "bg-slate-100 text-slate-600" },
  proses: { label: "Belum selesai", cls: "bg-amber-50 text-amber-700" },
  selesai: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700" },
};

const FILTER: { v: string; label: string }[] = [
  { v: "", label: "Semua" },
  { v: "menonton", label: "Sedang menonton" },
  { v: "proses", label: "Belum selesai" },
  { v: "belum", label: "Belum mulai" },
  { v: "selesai", label: "Selesai" },
];

export default function VideoTrackingPage() {
  const [data, setData] = useState<Baris[]>([]);
  const [ring, setRing] = useState<Ringkasan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [diperbarui, setDiperbarui] = useState<Date | null>(null);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const reqId = useRef(0);

  const muat = useCallback(async () => {
    const id = ++reqId.current;
    try {
      const p = new URLSearchParams();
      if (search.trim()) p.set("search", search.trim());
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/video-tracking?${p}`, { cache: "no-store" });
      const json = await res.json();
      if (id !== reqId.current) return; // abaikan respons usang
      if (!res.ok || !json.success) throw new Error();
      setData(json.data);
      setRing(json.ringkasan);
      setNow(Date.now());
      setDiperbarui(new Date());
      setError("");
    } catch {
      if (id === reqId.current) setError("Gagal memuat data. Mencoba lagi otomatis...");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [search, status]);

  // Muat saat filter berubah (dengan jeda ketik), lalu polling; berhenti saat tab tersembunyi.
  useEffect(() => {
    const t = window.setTimeout(muat, 300);
    const iv = window.setInterval(() => {
      if (document.visibilityState === "visible") muat();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && muat();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [muat]);

  async function exportFile(format: "csv" | "xlsx") {
    setExporting(format);
    try {
      const p = new URLSearchParams({ format });
      if (search.trim()) p.set("search", search.trim());
      if (status) p.set("status", status);
      const res = await fetch(`/api/admin/video-tracking/export?${p}`);
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `tracking-video-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengekspor file.");
    } finally {
      setExporting(null);
    }
  }

  const kartu: { label: string; nilai: number | undefined; cls: string }[] = [
    { label: "Total peserta aktif", nilai: ring?.total, cls: "text-slate-900" },
    { label: "Sedang menonton", nilai: ring?.menonton, cls: "text-sky-600" },
    { label: "Belum mulai", nilai: ring?.belum, cls: "text-slate-600" },
    { label: "Belum selesai", nilai: ring?.proses, cls: "text-amber-600" },
    { label: "Selesai", nilai: ring?.selesai, cls: "text-emerald-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0052A4]/10 text-[#0052A4]">
            <Eye className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">Tracking Video</h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Realtime, diperbarui tiap {POLL_MS / 1000} detik
              {diperbarui && ` · terakhir ${diperbarui.toLocaleTimeString("id-ID")}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["csv", "xlsx"] as const).map((f) => (
            <button
              key={f}
              onClick={() => exportFile(f)}
              disabled={exporting !== null}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === f ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {f === "csv" ? "Export CSV" : "Export Excel"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.cls}`}>{k.nilai ?? "-"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau WhatsApp..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER.map((f) => (
            <button
              key={f.v}
              onClick={() => setStatus(f.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                status === f.v
                  ? "border-[#0052A4] bg-[#0052A4] text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Eye className="h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              {search || status ? "Tidak ada peserta yang cocok." : "Belum ada peserta dengan akses aktif."}
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-26rem)] min-h-[320px] overflow-auto px-4 pt-3">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr className="text-xs font-medium text-slate-500">
                  <th className="sticky top-0 z-10 w-14 rounded-l-lg border-y border-l border-r border-slate-200 bg-slate-100 px-4 py-3 font-medium">
                    No
                  </th>
                  {["Nama", "WhatsApp", "Email", "Status", "Progres", "Terakhir Menonton", "Selesai"].map((label, k, arr) => (
                    <th
                      key={label}
                      className={`sticky top-0 z-10 whitespace-nowrap border-y border-r border-slate-200 bg-slate-100 px-3 py-3 font-medium ${
                        k === arr.length - 1 ? "rounded-r-lg" : ""
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.id} className="group h-[53px]">
                    <td className="border-b border-l border-r border-slate-200 bg-white px-4 py-3.5 text-slate-400">
                      {i + 1}
                    </td>
                    <td className="max-w-[220px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                      <span className="block truncate font-medium text-slate-900" title={r.nama}>
                        {r.nama}
                      </span>
                    </td>
                    <td className="border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                      {waLink(r.whatsapp) ? (
                        <a
                          href={waLink(r.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0052A4] hover:underline"
                        >
                          {r.whatsapp}
                        </a>
                      ) : (
                        r.whatsapp
                      )}
                    </td>
                    <td className="max-w-[220px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                      <span className="block truncate text-slate-600" title={r.email}>
                        {r.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[r.status].cls}`}>
                          {BADGE[r.status].label}
                        </span>
                        {r.sedangMenonton && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                            Menonton
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="min-w-[180px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-[width] duration-700 ${
                              r.status === "selesai" ? "bg-emerald-500" : "bg-[#0052A4]"
                            }`}
                            style={{ width: `${r.persen}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold text-slate-700">{r.persen}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 bg-white px-3 py-3.5 text-slate-500 group-hover:bg-slate-50">
                      {lalu(r.terakhirAt, now)}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 bg-white px-3 py-3.5 text-slate-500 group-hover:bg-slate-50">
                      {waktu(r.selesaiAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data.length > 0 && (
          <div className="flex h-[57px] items-center border-t border-slate-100 px-4 text-xs text-slate-500">
            {data.length} peserta
            {(search || status) && ` dari ${ring?.total ?? data.length} total`}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Hanya peserta dengan akses aktif yang bisa membuka video. &quot;Menonton&quot; berarti ada aktivitas
        dalam 1 menit terakhir.
      </p>
    </div>
  );
}
