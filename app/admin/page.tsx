"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ChartItem = { label: string; value: number };

type Stats = {
  total: number;
  today: number;
  week: number;
  month: number;
  byProvinsi: ChartItem[];
  byStatus: ChartItem[];
  byIde: ChartItem[];
  bySumber: ChartItem[];
  recent: {
    id: number;
    nama: string;
    email: string;
    provinsi: string;
    status: string;
    createdAt?: string;
    created_at?: string;
  }[];
};

/* ------------------------------------------------------------------ */
/* Chart Components                                                    */
/* ------------------------------------------------------------------ */

const COLORS = [
  "#0052A4", "#FB3F11", "#2563eb", "#16a34a", "#eab308",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

function BarChart({ data, title }: { data: ChartItem[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Belum ada data</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-gray-600" title={item.label}>
                {item.label || "(kosong)"}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-gray-100">
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                    minWidth: item.value > 0 ? "1.5rem" : "0",
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-gray-700">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PieChart({ data, title }: { data: ChartItem[]; title: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  // Compute SVG pie slices
  let cumAngle = 0;
  const slices = data.map((item, i) => {
    const angle = (item.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path =
      data.length === 1
        ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, path, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Belum ada data</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0">
            {slices.map((s) => (
              <path key={s.label} d={s.path} fill={s.color} stroke="white" strokeWidth="1" />
            ))}
          </svg>
          <div className="space-y-1.5">
            {slices.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-gray-600">{s.label || "(kosong)"}</span>
                <span className="font-semibold text-gray-900">
                  {s.value} ({Math.round((s.value / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-lg text-lg"
          style={{ backgroundColor: color + "15", color }}
        >
          {icon}
        </span>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard Page                                                      */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pendaftaran/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Gagal memuat statistik");
        return r.json();
      })
      .then((json) => setStats(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0052A4]" />
          <p className="mt-3 text-sm text-gray-500">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-6 text-center">
          <p className="text-sm font-medium text-red-700">{error || "Gagal memuat data."}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="👥" label="Total Pendaftar" value={stats.total} color="#0052A4" />
        <StatCard icon="📅" label="Hari Ini" value={stats.today} color="#16a34a" />
        <StatCard icon="📆" label="Minggu Ini" value={stats.week} color="#2563eb" />
        <StatCard icon="📈" label="Bulan Ini" value={stats.month} color="#8b5cf6" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart data={stats.byProvinsi} title="🗺️ Top Provinsi Pendaftar" />
        <PieChart data={stats.byStatus} title="👤 Distribusi Status" />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PieChart data={stats.byIde} title="💡 Kesiapan Bisnis" />
        <BarChart data={stats.bySumber} title="📣 Sumber Informasi" />
      </div>

      {/* Recent Registrations */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">📋 Pendaftar Terbaru</h3>
          <Link
            href="/admin/pendaftaran"
            className="text-xs font-medium text-[#0052A4] hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Belum ada pendaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-2.5 font-semibold text-gray-500">Nama</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-500">Email</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-500">Provinsi</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-500">Status</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-500">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/pendaftaran/${r.id}`}
                        className="font-medium text-[#0052A4] hover:underline"
                      >
                        {r.nama}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{r.email}</td>
                    <td className="px-5 py-3 text-gray-600">{r.provinsi}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(r.createdAt || r.created_at || "").toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
