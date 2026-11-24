"use client";

import { formatJadwal, STATUS_LABEL } from "@/lib/jadwal-format";
import { eventLabel } from "@/lib/event";
import EventSelect from "@/components/EventSelect";
import { afiliasiLabel, type AfiliasiInfo } from "@/lib/afiliasi-info";
import { formatPosisi, POSISI_OPSI, posisiLabel } from "@/lib/posisi";
import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Clock,
  Users,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

type JadwalRow = {
  id: number;
  tanggal: string;
  jam: string;
  status: string;
  catatan: string | null;
};

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
  wilayah?: string | null;
  eventStatus?: string;
  videoSelesaiAt?: string | null;
  konsultasiAt?: string | null;
  posisiKonsultasi?: string | null;
  ijazahS1?: boolean;
  jadwal?: JadwalRow | null;
  afiliasi?: AfiliasiInfo;
  createdAt?: string;
  created_at?: string;
};

type ApiResp = {
  success: boolean;
  data: PendaftarRow[];
  total: number;
  totalSemua: number;
  totalMeeting: number;
  page: number;
  totalPages: number;
};

type Tab = "semua" | "meeting" | "waiting";

type WaitingRow = {
  id: number;
  pendaftaranId: number;
  posisi: string | null;
  catatan: string | null;
  status: string;
  createdAt: string;
  afiliasi?: AfiliasiInfo;
  pendaftaran: {
    id: number;
    nama: string;
    whatsapp: string;
    email: string;
    eventStatus: string;
    posisiKonsultasi: string | null;
  };
};

type WaitingResp = { success: boolean; data: WaitingRow[] };

const WAITING_STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu",
  diproses: "Diproses",
  ditambahkan: "Ditambahkan",
  batal: "Batal",
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

function formatWaktu(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
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

const WILAYAH_LABEL: Record<string, string> = {
  jabodetabek: "Jabodetabek",
  luar_jabodetabek: "Luar Jabodetabek",
  luar_negeri: "Luar Negeri",
};

function formatWilayah(r: PendaftarRow) {
  return WILAYAH_LABEL[r.wilayah ?? ""] || r.wilayah || "-";
}

function formatTanggal(r: PendaftarRow) {
  return formatWaktu(r.createdAt || r.created_at);
}

function formatJadwalRow(r: PendaftarRow) {
  return r.jadwal ? formatJadwal(r.jadwal.tanggal, r.jadwal.jam) : "Belum";
}

// konsultasiAt juga dipakai data lama hasil checkout; hanya yang punya posisi
// yang benar-benar sudah submit konfirmasi konsultasi lanjutan.
function formatMeeting(r: PendaftarRow) {
  return r.konsultasiAt && r.posisiKonsultasi ? formatWaktu(r.konsultasiAt) : "Belum";
}

// Tinggi baris tabel (px) dan tinggi footer; dipakai menghitung berapa baris yang muat di layar.
const ROW_H = 53;
const FOOTER_H = 57;
const HEAD_H_FALLBACK = 42;

const COLUMNS: { key: string; label: string; width: number; get: (r: PendaftarRow) => string }[] = [
  { key: "nama", label: "Nama", width: 180, get: (r) => r.nama ?? "" },
  { key: "whatsapp", label: "WhatsApp", width: 140, get: (r) => r.whatsapp ?? "" },
  { key: "email", label: "Email", width: 210, get: (r) => r.email ?? "" },
  { key: "wilayah", label: "Wilayah", width: 150, get: formatWilayah },
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
  { key: "status", label: "Pekerjaan", width: 130, get: (r) => r.status ?? "" },
  { key: "event", label: "Status Join Program", width: 170, get: (r) => eventLabel(r.eventStatus) },
  { key: "ide", label: "Ide Bisnis", width: 220, get: (r) => r.ide ?? "" },
  { key: "pendapatan", label: "Personal Income", width: 150, get: (r) => r.pendapatan ?? "" },
  {
    key: "tujuan",
    label: "Tujuan Program",
    width: 200,
    get: (r) => (Array.isArray(r.tujuan) ? r.tujuan.join(", ") : (r.tujuan ?? "")),
  },
  { key: "sumber", label: "Sumber Info", width: 140, get: (r) => r.sumber ?? "" },
  {
    key: "afiliasi",
    label: "Afiliasi",
    width: 180,
    get: (r) => afiliasiLabel(r.afiliasi ?? null),
  },
  { key: "tanggal", label: "Tanggal Daftar", width: 160, get: formatTanggal },
  {
    key: "posisi",
    label: "Posisi Konsultasi",
    width: 240,
    get: (r) => formatPosisi(r.posisiKonsultasi) || "Belum",
  },
  { key: "jadwal", label: "Jadwal Konsultasi", width: 170, get: formatJadwalRow },
  {
    key: "meeting",
    label: "Konsultasi Lanjutan",
    width: 150,
    get: formatMeeting,
  },
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
  const router = useRouter();
  const urlQuery = searchParams.get("q") ?? "";
  const urlEvent = searchParams.get("event") ?? "";
  // Kategori jadi satu-satunya sumber kebenaran lewat URL, supaya pilihan select
  // tidak bisa beda dengan filter yang benar-benar dikirim ke API.
  const kodeKategori = (searchParams.get("kategori") ?? "").trim().toUpperCase();
  const kategoriFilter = POSISI_OPSI.some((o) => o.kode === kodeKategori) ? kodeKategori : "";
  const [data, setData] = useState<PendaftarRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalSemua, setTotalSemua] = useState(0);
  const [totalMeeting, setTotalMeeting] = useState(0);
  const [tab, setTab] = useState<Tab>("semua");
  const [waiting, setWaiting] = useState<WaitingRow[]>([]);
  const [loadingWaiting, setLoadingWaiting] = useState(false);
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

  // Jumlah baris per halaman = jumlah baris yang muat penuh di tinggi tabel layar ini.
  // Halaman baru (pagination) baru muncul jika data lebih banyak dari itu.
  const [limit, setLimit] = useState(0);
  const limitRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const calc = () => {
      const toolbarH = toolbarRef.current?.offsetHeight ?? 76;
      const headH =
        card.querySelector("thead")?.getBoundingClientRect().height || HEAD_H_FALLBACK;
      const space = card.clientHeight - toolbarH - FOOTER_H - headH - 8;
      const n = Math.max(5, Math.floor(space / ROW_H));
      if (limitRef.current !== n) {
        if (limitRef.current !== 0) setPage(1);
        limitRef.current = n;
        setLimit(n);
      }
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  const fetchData = useCallback(() => {
    if (!limit) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort: "created_at",
      order: "desc",
    });
    if (search) params.set("search", search);
    if (kategoriFilter) params.set("kategori", kategoriFilter);
    // Filter event dari link dashboard tetap dihormati walau tidak ada UI-nya.
    if (urlEvent) params.set("event", urlEvent);
    if (tab === "meeting") params.set("meeting", "1");

    fetch(`/api/pendaftaran?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat data");
        return r.json() as Promise<ApiResp>;
      })
      .then((json) => {
        setData(json.data);
        setSelected(new Set());
        setTotal(json.total);
        setTotalSemua(json.totalSemua ?? json.total);
        setTotalMeeting(json.totalMeeting ?? 0);
        setTotalPages(json.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, kategoriFilter, urlEvent, tab, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Waitinglist diambil terpisah (endpoint admin yang sudah ada).
  const fetchWaiting = useCallback(() => {
    setLoadingWaiting(true);
    fetch("/api/admin/waitinglist", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat waitinglist.");
        return r.json() as Promise<WaitingResp>;
      })
      .then((json) => setWaiting(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingWaiting(false));
  }, []);

  useEffect(() => {
    if (tab === "waiting") fetchWaiting();
  }, [tab, fetchWaiting]);

  const filteredWaiting = waiting.filter((w) => {
    if (kategoriFilter) {
      // Pakai field posisi yang memang ditampilkan di tabel waitinglist;
      // fallback ke data pendaftaran untuk baris lama.
      const posisi = w.posisi ?? w.pendaftaran.posisiKonsultasi ?? "";
      if (posisi.trim().toUpperCase() !== kategoriFilter) return false;
    }
    if (urlEvent) {
      const event = w.pendaftaran.eventStatus || "belum";
      if (event !== urlEvent) return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      w.pendaftaran.nama,
      w.pendaftaran.whatsapp,
      w.pendaftaran.email,
      w.posisi ?? "",
      w.catatan ?? "",
      afiliasiLabel(w.afiliasi ?? null),
    ].some((v) => v.toLowerCase().includes(q));
  });

  // Sinkronkan dengan pencarian dari header (?q=...)
  useEffect(() => {
    setSearchInput(urlQuery);
    setSearch(urlQuery);
    setPage(1);
  }, [urlQuery]);

  // Event dari dashboard (?event=) tetap dipakai sebagai filter tambahan.
  function pilihKategori(kode: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (kode) params.set("kategori", kode);
    else params.delete("kategori");
    setPage(1);
    router.replace(`/admin/pendaftaran?${params.toString()}`, { scroll: false });
  }

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
      "Wilayah",
      "Domisili",
      "Negara",
      "Provinsi/State",
      "Kota/Kabupaten",
      "Kecamatan",
      "Desa/Kelurahan",
      "Alamat Lengkap",
      "Pekerjaan",
      "Ide Bisnis",
      "Personal Income",
      "Tujuan Program",
      "Cerita Bisnis",
      "Sumber Informasi",
      "Afiliasi",
      "Tanggal Daftar",
      "Status Join Program",
      "Video Selesai",
      "Konsultasi Lanjutan",
      "Posisi Konsultasi",
      "Jadwal Konsultasi",
      "Status Jadwal",
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
        formatWilayah(r),
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
        afiliasiLabel(r.afiliasi ?? null),
        tanggalText,
        eventLabel(r.eventStatus),
        formatWaktu(r.videoSelesaiAt) || "Belum",
        formatMeeting(r),
        formatPosisi(r.posisiKonsultasi) || "Belum",
        formatJadwalRow(r),
        r.jadwal ? (STATUS_LABEL[r.jadwal.status]?.label ?? r.jadwal.status) : "Belum",
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
      if (kategoriFilter) params.set("kategori", kategoriFilter);
      if (urlEvent) params.set("event", urlEvent);
      if (tab === "meeting") params.set("meeting", "1");

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
      if (kategoriFilter) params.set("kategori", kategoriFilter);
      if (urlEvent) params.set("event", urlEvent);
      if (tab === "meeting") params.set("meeting", "1");

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
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => {
            setTab("semua");
            setPage(1);
          }}
          className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
            tab === "semua"
              ? "bg-white font-semibold text-[#0052A4] shadow-sm"
              : "bg-white/60 font-medium text-slate-500 hover:bg-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Semua pendaftar
          <span className="rounded-full bg-[#0052A4] px-2 py-0.5 text-[11px] font-semibold text-white">
            {totalSemua}
          </span>
        </button>
        <button
          onClick={() => {
            setTab("meeting");
            setPage(1);
          }}
          className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
            tab === "meeting"
              ? "bg-white font-semibold text-[#0052A4] shadow-sm"
              : "bg-white/60 font-medium text-slate-500 hover:bg-white"
          }`}
        >
          <MessagesSquare className="h-4 w-4" />
          Konsultasi lanjutan
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
              totalMeeting > 0 ? "bg-emerald-600" : "bg-slate-400"
            }`}
          >
            {totalMeeting}
          </span>
        </button>
        <button
          onClick={() => {
            setTab("waiting");
            setPage(1);
          }}
          className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
            tab === "waiting"
              ? "bg-white font-semibold text-[#0052A4] shadow-sm"
              : "bg-white/60 font-medium text-slate-500 hover:bg-white"
          }`}
        >
          <Clock className="h-4 w-4" />
          Waitinglist
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
              waiting.length > 0 ? "bg-amber-500" : "bg-slate-400"
            }`}
          >
            {waiting.length}
          </span>
        </button>
      </div>

      <div
        ref={cardRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
      >
        {/* Toolbar */}
        <div
          ref={toolbarRef}
          className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
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

          <div className="relative w-full sm:mr-auto sm:w-[19rem]">
            <select
              value={kategoriFilter}
              onChange={(e) => pilihKategori(e.target.value)}
              autoComplete="off"
              aria-label="Filter kategori"
              className={`h-11 w-full cursor-pointer appearance-none truncate rounded-full border bg-white py-0 pl-4 pr-9 text-sm font-medium shadow-none outline-none transition-colors focus:ring-0 ${
                kategoriFilter
                  ? "border-[#0052A4]/40 text-[#0052A4]"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <option value="">Semua kategori</option>
              {POSISI_OPSI.map((o) => (
                <option key={o.kode} value={o.kode}>
                  {formatPosisi(o.kode)}
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
          {tab !== "waiting" && (
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
          )}
        </div>

        {/* Tabel */}
        {tab === "waiting" ? (
          loadingWaiting ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
            </div>
          ) : filteredWaiting.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
              <Clock className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {search || kategoriFilter || urlEvent
                  ? "Tidak ada peserta waitinglist yang cocok."
                  : "Belum ada peserta di waitinglist."}
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto pl-3">
              <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
                <thead>
                  <tr className="text-xs font-medium text-slate-500">
                    <th className="w-14 rounded-l-lg border-y border-l border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-4 py-3 font-medium">
                      No
                    </th>
                    {[
                      "Nama",
                      "WhatsApp",
                      "Email",
                      "Afiliasi",
                      "Posisi",
                      "Status",
                      "Tanggal Masuk",
                      "Catatan",
                    ].map(
                      (label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap border-y border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-3 py-3 font-medium"
                        >
                          {label}
                        </th>
                      )
                    )}
                    <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-y border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-medium">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaiting.map((w, i) => (
                    <tr key={w.id} className="group h-[53px]">
                      <td className="border-b border-l border-r border-slate-200 bg-white px-4 py-3.5 text-slate-400">
                        {i + 1}
                      </td>
                      <td className="max-w-[220px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        <Link
                          href={`/admin/pendaftaran/${w.pendaftaranId}`}
                          className="block truncate font-medium text-slate-900 hover:text-[#0052A4]"
                          title={w.pendaftaran.nama}
                        >
                          {w.pendaftaran.nama}
                        </Link>
                      </td>
                      <td className="border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        {waLink(w.pendaftaran.whatsapp) ? (
                          <a
                            href={waLink(w.pendaftaran.whatsapp)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0052A4] hover:underline"
                          >
                            {w.pendaftaran.whatsapp}
                          </a>
                        ) : (
                          w.pendaftaran.whatsapp
                        )}
                      </td>
                      <td className="max-w-[220px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        <span className="block truncate text-slate-600" title={w.pendaftaran.email}>
                          {w.pendaftaran.email}
                        </span>
                      </td>
                      <td className="border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        {w.afiliasi ? (
                          <span
                            className="inline-flex max-w-full items-center gap-1.5"
                            title={afiliasiLabel(w.afiliasi)}
                          >
                            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              {w.afiliasi.nama}
                            </span>
                            <span className="truncate text-[11px] text-slate-400">
                              {w.afiliasi.kode}
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        {w.posisi ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="shrink-0 rounded bg-[#0052A4]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#0052A4]">
                              {w.posisi.toUpperCase()}
                            </span>
                            <span className="truncate">{posisiLabel(w.posisi)}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            w.status === "ditambahkan"
                              ? "bg-emerald-50 text-emerald-700"
                              : w.status === "batal"
                                ? "bg-rose-50 text-rose-600"
                                : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {WAITING_STATUS_LABEL[w.status] ?? w.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-r border-slate-200 bg-white px-3 py-3.5 text-slate-500 group-hover:bg-slate-50">
                        {formatWaktu(w.createdAt)}
                      </td>
                      <td className="max-w-[220px] border-b border-r border-slate-200 bg-white px-3 py-3.5 group-hover:bg-slate-50">
                        <span className="block truncate text-slate-500" title={w.catatan ?? ""}>
                          {w.catatan || "-"}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-slate-200 bg-white px-3 py-3.5 text-right group-hover:bg-slate-50">
                        <IconAction
                          href={`/admin/pendaftaran/${w.pendaftaranId}`}
                          icon={Eye}
                          label="Detail"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : loading ? (
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
                    <tr key={r.id} className="group h-[53px]">
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
                        } else if (c.key === "afiliasi") {
                          content = r.afiliasi ? (
                            <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
                              <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                {r.afiliasi.nama}
                              </span>
                              <span className="truncate text-[11px] text-slate-400">
                                {r.afiliasi.kode}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          );
                        } else if (c.key === "posisi") {
                          content = r.posisiKonsultasi ? (
                            <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
                              <span className="shrink-0 rounded bg-[#0052A4]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#0052A4]">
                                {r.posisiKonsultasi.toUpperCase()}
                              </span>
                              <span className="truncate">
                                {posisiLabel(r.posisiKonsultasi)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Belum</span>
                          );
                        } else if (c.key === "jadwal") {
                          content = r.jadwal ? (
                            <span className="inline-flex max-w-full flex-col items-start gap-0.5 align-middle leading-tight">
                              <span className="truncate font-medium text-slate-700">{text}</span>
                              <span className="truncate text-[11px] text-slate-400">
                                {STATUS_LABEL[r.jadwal.status]?.label ?? r.jadwal.status}
                                {r.jadwal.catatan ? ` • ${r.jadwal.catatan}` : ""}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Belum</span>
                          );
                        } else if (c.key === "meeting") {
                          content = r.konsultasiAt && r.posisiKonsultasi ? (
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 align-middle text-[11px] font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                              <span className="truncate">{text}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Belum</span>
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
                {Array.from({ length: Math.max(0, limit - data.length) }).map((_, k) => (
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
        {tab === "waiting" ? (
          !loadingWaiting && (
            <div className="flex h-[57px] shrink-0 items-center border-t border-slate-100 px-4 text-xs text-slate-500">
              {filteredWaiting.length} peserta di waitinglist
              {(search || kategoriFilter || urlEvent) && ` dari ${waiting.length} total`}
            </div>
          )
        ) : !loading && !error && (
          <div className="flex h-[57px] shrink-0 flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 text-xs text-slate-500 sm:flex-row">
            <span>
              {total === 0
                ? "0 pendaftar"
                : `${(page - 1) * limit + 1}–${(page - 1) * limit + data.length} dari ${total} pendaftar`}
            </span>
            {totalPages > 1 && (
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
            )}
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
