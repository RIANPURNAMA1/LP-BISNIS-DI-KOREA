"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type PendaftarRow = {
  id: number;
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string;
  kabupaten: string;
  status: string;
  ide: string;
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

export default function PendaftaranList() {
  const [data, setData] = useState<PendaftarRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

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

    fetch(`/api/pendaftaran?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat data");
        return r.json() as Promise<ApiResp>;
      })
      .then((json) => {
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
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

  async function handleExport() {
    try {
      const res = await fetch(`/api/pendaftaran?page=1&limit=10000&sort=created_at&order=desc${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = await res.json() as ApiResp;

      const headers = ["No", "Nama", "WhatsApp", "Email", "Provinsi/Negara", "Status", "Ide Bisnis", "Tanggal Daftar"];
      const rows = json.data.map((r, i) => [
        i + 1,
        `"${r.nama}"`,
        `"${r.whatsapp}"`,
        `"${r.email}"`,
        `"${r.provinsi === "Luar Negeri" ? `Luar Negeri - ${r.kabupaten}` : r.provinsi}"`,
        `"${r.status}"`,
        `"${r.ide}"`,
        `"${new Date(r.createdAt || r.created_at || "").toLocaleDateString("id-ID")}"`,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pendaftar-bisnis-korea-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengexport data.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Data Pendaftar</h2>
          <p className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-700">{total}</span> pendaftar
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari nama, email, atau WhatsApp..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#0052A4] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004080]"
        >
          Cari
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50"
          >
            ✕
          </button>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-[#0052A4]" />
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-2 text-sm text-red-500 underline">
              Coba lagi
            </button>
          </div>
        ) : data.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            {search ? "Tidak ada hasil untuk pencarian tersebut." : "Belum ada data pendaftar."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 font-semibold text-gray-500">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Nama</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">WhatsApp</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Provinsi/Negara</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Tanggal</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pendaftaran/${r.id}`}
                        className="font-medium text-[#0052A4] hover:underline"
                      >
                        {r.nama}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.whatsapp}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.provinsi === "Luar Negeri" ? r.kabupaten : r.provinsi}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(r.createdAt || r.created_at || "").toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/pendaftaran/${r.id}`}
                          className="text-xs font-medium text-gray-500 hover:text-[#0052A4]"
                        >
                          Detail
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id, r.nama)}
                          disabled={deleting === r.id}
                          className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {deleting === r.id ? "..." : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Halaman <span className="font-semibold text-gray-700">{page}</span> dari{" "}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
