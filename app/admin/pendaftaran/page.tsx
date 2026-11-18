"use client";

import { EVENT_OPTIONS, eventLabel } from "@/lib/event";
import EventSelect from "@/components/EventSelect";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  ListFilter,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  type LucideIcon,
} from "lucide-react";

type PendaftarRow = {
  id: number;
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  status: string;
  ide: string;
  pendapatan: string;
  tujuan: string[] | string;
  cerita: string;
  sumber: string;
  eventStatus?: string;
  createdAt?: string;
  created_at?: string;
};

type ApiResp = {
  success: boolean;
  data: PendaftarRow[];
  total: number;
  page: number;
  totalPages: number;
};

// Bungkus nilai dalam tanda kutip dan escape tanda kutip ganda sesuai RFC 4180,
// supaya karakter koma, kutip, atau baris baru tidak merusak kolom CSV.
function csvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join("; ")
        : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Ubah nomor ke format wa.me (hanya digit, awalan 0 -> 62)
function waLink(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return `https://wa.me/${n}`;
}

function formatTanggal(r: PendaftarRow) {
  const d = new Date(r.createdAt || r.created_at || "");
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

const MIN_ROWS = 40; // baris kosong pengisi agar tabel penuh sampai bawah layar

const COLUMNS: { key: string; label: string; width: number; get: (r: PendaftarRow) => string }[] = [
  { key: "nama", label: "Nama", width: 180, get: (r) => r.nama ?? "" },
  { key: "whatsapp", label: "WhatsApp", width: 140, get: (r) => r.whatsapp ?? "" },
  { key: "email", label: "Email", width: 210, get: (r) => r.email ?? "" },
  {
    key: "domisili",
    label: "Domisili",
    width: 150,
    get: (r) => (r.provinsi === "Luar Negeri" ? r.kabupaten : r.provinsi || r.kabupaten) ?? "",
  },
  {
    key: "kota",
    label: "Kota/Kabupaten",
    width: 150,
    get: (r) => (r.provinsi === "Luar Negeri" ? r.desa : r.kabupaten) ?? "",
  },
  { key: "status", label: "Status", width: 130, get: (r) => r.status ?? "" },
  { key: "event", label: "Status Event", width: 170, get: (r) => eventLabel(r.eventStatus) },
  { key: "ide", label: "Ide Bisnis", width: 220, get: (r) => r.ide ?? "" },
  { key: "pendapatan", label: "Personal Income", width: 150, get: (r) => r.pendapatan ?? "" },
  {
    key: "tujuan",
    label: "Tujuan Program",
    width: 200,
    get: (r) => (Array.isArray(r.tujuan) ? r.tujuan.join(", ") : (r.tujuan ?? "")),
  },
  { key: "sumber", label: "Sumber Info", width: 140, get: (r) => r.sumber ?? "" },
  { key: "tanggal", label: "Tanggal Daftar", width: 160, get: formatTanggal },
];

export default function PendaftaranPage() {
  return (
    <Suspense fallback={null}>
      <PendaftaranList />
    </Suspense>
  );
}

function PendaftaranList() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlEvent = searchParams.get("event") ?? "";
  const [data, setData] = useState<PendaftarRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [eventFilter, setEventFilter] = useState("");

  const limit = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort: "created_at",
      order: "desc",
    });
    if (search) params.set("search", search);
    if (eventFilter) params.set("event", eventFilter);

    fetch(`/api/pendaftaran?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat data");
        return r.json() as Promise<ApiResp>;
      })
      .then((json) => {
        setData(json.data);
        setSelected(new Set());
        setTotal(json.total);
        setTotalPages(json.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, eventFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sinkronkan dengan pencarian dari header (?q=...)
  useEffect(() => {
    setSearchInput(urlQuery);
    setSearch(urlQuery);
    setPage(1);
  }, [urlQuery]);

  // Filter event dari link (mis. dari dashboard: ?event=webinar)
  useEffect(() => {
    setEventFilter(urlEvent);
    setPage(1);
  }, [urlEvent]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function changeEvent(id: number, next: string) {
    const prev = data.find((r) => r.id === id)?.eventStatus ?? "";
    setData((list) => list.map((r) => (r.id === id ? { ...r, eventStatus: next } : r)));
    try {
      const res = await fetch(`/api/pendaftaran/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventStatus: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData((list) => list.map((r) => (r.id === id ? { ...r, eventStatus: prev } : r)));
      alert("Gagal menyimpan status event. Coba lagi.");
    }
  }

  async function handleDelete(id: number, nama: string) {
    if (!confirm(`Yakin hapus pendaftaran "${nama}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/pendaftaran/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchData();
    } catch {
      alert("Gagal menghapus data. Coba lagi.");
    } finally {
      setDeleting(null);
    }
  }

  function buildCsv(list: PendaftarRow[]) {
    const headers = [
      "No",
      "Nama",
      "WhatsApp",
      "Email",
      "Domisili",
      "Negara",
      "Provinsi/State",
      "Kota/Kabupaten",
      "Kecamatan",
      "Desa/Kelurahan",
      "Alamat Lengkap",
      "Status",
      "Ide Bisnis",
      "Personal Income",
      "Tujuan Program",
      "Cerita Bisnis",
      "Sumber Informasi",
      "Tanggal Daftar",
      "Status Event",
    ];

    const rows = list.map((r, i) => {
      const isLuar = r.provinsi === "Luar Negeri";
      const tanggal = new Date(r.createdAt || r.created_at || "");
      const tanggalText = isNaN(tanggal.getTime())
        ? ""
        : tanggal.toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

      return [
        i + 1,
        r.nama,
        r.whatsapp,
        r.email,
        isLuar ? "Luar Negeri" : "Indonesia",
        isLuar ? r.kabupaten : "",
        isLuar ? r.kecamatan : r.provinsi,
        isLuar ? r.desa : r.kabupaten,
        isLuar ? "" : r.kecamatan,
        isLuar ? "" : r.desa,
        r.alamat,
        r.status,
        r.ide,
        r.pendapatan,
        r.tujuan,
        r.cerita,
        r.sumber,
        tanggalText,
        eventLabel(r.eventStatus),
      ].map(csvCell);
    });

    const csv = [headers.map(csvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    // BOM UTF-8 + CRLF supaya aman dibuka/diimpor di Excel, Google Sheets, dll.
    triggerDownload(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }),
      `pendaftar-bisnis-korea-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  }

  async function handleExportCsv() {
    setExporting("csv");
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10000",
        sort: "created_at",
        order: "desc",
      });
      if (search) params.set("search", search);
      if (eventFilter) params.set("event", eventFilter);

      const res = await fetch(`/api/pendaftaran?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = (await res.json()) as ApiResp;
      buildCsv(json.data);
    } catch {
      alert("Gagal mengexport CSV.");
    } finally {
      setExporting(null);
    }
  }

  function handleExportSelected() {
    buildCsv(data.filter((r) => selected.has(r.id)));
  }

  async function handleDeleteSelected() {
    if (!confirm(`Yakin hapus ${selected.size} pendaftaran terpilih?`)) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selected).map((id) => fetch(`/api/pendaftaran/${id}`, { method: "DELETE" })),
      );
      if (results.some((r) => !r.ok)) alert("Sebagian data gagal dihapus.");
      setSelected(new Set());
      fetchData();
    } catch {
      alert("Gagal menghapus data. Coba lagi.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (eventFilter) params.set("event", eventFilter);

      const res = await fetch(`/api/pendaftaran/export?${params}`);
      if (!res.ok) throw new Error("Gagal membuat file Excel");

      const blob = await res.blob();
      triggerDownload(
        blob,
        `pendaftar-bisnis-korea-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch {
      alert("Gagal mengexport Excel.");
    } finally {
      setExporting(null);
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const allSelected = data.length > 0 && data.every((r) => selected.has(r.id));
  const someSelected = data.some((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(data.map((r) => r.id)));
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[520px] flex-col gap-4">
      {/* Tab */}
      <div className="flex shrink-0 items-end gap-1 px-1">
        <div className="flex items-center gap-2 rounded-t-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0052A4]">
          <Users className="h-4 w-4" />
          Semua pendaftar
          <span className="rounded-full bg-[#0052A4] px-2 py-0.5 text-[11px] font-semibold text-white">
            {total}
          </span>
        </div>
      </div>

      <div className="-mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl rounded-tl-none bg-white shadow-sm ring-1 ring-slate-200/60">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex h-11 w-full items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-1.5 transition-colors focus-within:border-[#0052A4]/50 sm:max-w-sm"
          >
            <ListFilter className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, email, atau WhatsApp..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
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

          <div className="relative sm:mr-auto">
            <select
              value={eventFilter}
              onChange={(e) => {
                setPage(1);
                setEventFilter(e.target.value);
              }}
              aria-label="Filter status event"
              className={`h-11 cursor-pointer appearance-none rounded-full border bg-white py-0 pl-4 pr-9 text-sm font-medium shadow-none outline-none transition-colors focus:ring-0 ${
                eventFilter
                  ? "border-[#0052A4]/40 text-[#0052A4]"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <option value="">Semua event</option>
              <option value="belum">Belum ikut</option>
              {EVENT_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting !== null}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting === "csv" ? "Menyiapkan..." : "Export CSV"}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting !== null}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0052A4] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {exporting === "excel" ? "Menyiapkan..." : "Export Excel"}
            </button>
          </div>
        </div>

        {/* Tabel */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
          </div>
        ) : error ? (
          <div className="flex-1 px-5 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-red-500 underline">
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto pl-3">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr className="text-xs font-medium text-slate-500">
                  <th className="w-12 rounded-l-lg border-y border-l border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-4 py-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onChange={toggleAll}
                      label="Pilih semua"
                    />
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      style={{ minWidth: c.width }}
                      className="whitespace-nowrap border-y border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-3 py-3 font-medium"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-y border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const isSel = selected.has(r.id);
                  const bg = isSel ? "bg-[#0052A4]/[0.06]" : "bg-white group-hover:bg-slate-50";
                  return (
                    <tr key={r.id} className="group">
                      <td className={`relative border-b border-l border-r border-slate-200 px-4 py-3.5 ${bg}`}>
                        {isSel && (
                          <span className="absolute inset-y-0 left-0 w-1 rounded-r bg-[#0052A4]" />
                        )}
                        <Checkbox
                          checked={isSel}
                          onChange={() => toggleOne(r.id)}
                          label={`Pilih ${r.nama}`}
                        />
                      </td>
                      {COLUMNS.map((c) => {
                        const text = c.get(r);
                        let content: React.ReactNode = text;
                        if (c.key === "nama") {
                          content = (
                            <Link
                              href={`/admin/pendaftaran/${r.id}`}
                              className="font-medium text-slate-900 hover:text-[#0052A4]"
                            >
                              {text}
                            </Link>
                          );
                        } else if (c.key === "whatsapp" && waLink(text)) {
                          content = (
                            <a
                              href={waLink(text)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0052A4] hover:underline"
                            >
                              {text}
                            </a>
                          );
                        } else if (c.key === "event") {
                          content = (
                            <EventSelect
                              value={r.eventStatus ?? ""}
                              onChange={(v) => changeEvent(r.id, v)}
                            />
                          );
                        } else if (c.key === "status" && text) {
                          content = (
                            <span className="inline-block max-w-full truncate rounded-full bg-[#0052A4]/10 px-2.5 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-[#0052A4]">
                              {text}
                            </span>
                          );
                        }
                        return (
                          <td
                            key={c.key}
                            title={text}
                            className={`border-b border-r border-slate-200 px-3 py-3.5 align-middle text-slate-600 ${bg}`}
                            style={{ minWidth: c.width, maxWidth: c.width }}
                          >
                            <div className="truncate">{content}</div>
                          </td>
                        );
                      })}
                      <td
                        className={`sticky right-0 z-10 whitespace-nowrap border-b border-l border-slate-200 px-3 py-3.5 ${
                          isSel ? "bg-[#f0f5fa]" : "bg-white group-hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            href={`/admin/pendaftaran/${r.id}`}
                            icon={Eye}
                            label="Detail"
                          />
                          <IconAction
                            onClick={() => handleDelete(r.id, r.nama)}
                            disabled={deleting === r.id}
                            icon={deleting === r.id ? Loader2 : Trash2}
                            label="Hapus"
                            danger
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: Math.max(0, MIN_ROWS - data.length) }).map((_, k) => (
                  <tr key={`empty-${k}`}>
                    <td className="h-[53px] border-b border-l border-r border-slate-200 bg-white" />
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="border-b border-r border-slate-200 bg-white" />
                    ))}
                    <td className="sticky right-0 z-10 border-b border-l border-slate-200 bg-white" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / paginasi */}
        {!loading && !error && total > 0 && (
          <div className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row">
            <span>
              {(page - 1) * limit + 1}–{(page - 1) * limit + data.length} dari {total} pendaftar
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Halaman <b className="text-slate-700">{page}</b> dari{" "}
                <b className="text-slate-700">{totalPages}</b>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bar aksi melayang saat ada yang dipilih */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-white shadow-2xl">
          <button
            onClick={() => setSelected(new Set())}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Batal pilih"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
            {selected.size}
          </span>
          <span className="mr-2 hidden text-sm sm:inline">dipilih</span>
          <button
            onClick={handleExportSelected}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={bulkDeleting}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-500 px-4 text-sm font-semibold hover:bg-rose-600 disabled:opacity-60"
          >
            {bulkDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}{" "}
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#0052A4]"
    />
  );
}

function IconAction({
  href,
  onClick,
  disabled,
  icon: Icon,
  label,
  danger,
}: {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  const cls = `grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors disabled:opacity-50 ${
    danger ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-[#0052A4]/10 hover:text-[#0052A4]"
  }`;
  const icon = <Icon className={`h-4 w-4 ${disabled ? "animate-spin" : ""}`} />;
  return href ? (
    <Link href={href} title={label} aria-label={label} className={cls}>
      {icon}
    </Link>
  ) : (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className={cls}>
      {icon}
    </button>
  );
}
