"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Pendaftar = {
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
  cerita: string;
  tujuan: string[];
  sumber: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}

export default function PendaftaranDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<Pendaftar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/pendaftaran/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Data tidak ditemukan");
        return r.json();
      })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleDelete() {
    if (!data || !confirm(`Yakin hapus pendaftaran "${data.nama}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pendaftaran/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      router.push("/admin/pendaftaran");
    } catch {
      alert("Gagal menghapus data.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0052A4]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error || "Data tidak ditemukan."}</p>
          <Link href="/admin/pendaftaran" className="mt-2 inline-block text-sm text-[#0052A4] underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = new Date(data.createdAt || data.created_at || "").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/pendaftaran" className="hover:text-[#0052A4]">
          Data Pendaftar
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{data.nama}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{data.nama}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              ID #{data.id} · Terdaftar {createdAt}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Menghapus..." : "🗑️ Hapus"}
          </button>
        </div>

        {/* Section: Data Diri */}
        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0052A4]">
            Data Diri
          </h3>
          <dl>
            <InfoRow label="Nama Lengkap" value={data.nama} />
            <InfoRow
              label="WhatsApp"
              value={
                <a
                  href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0052A4] hover:underline"
                >
                  {data.whatsapp}
                </a>
              }
            />
            <InfoRow
              label="Email"
              value={
                <a href={`mailto:${data.email}`} className="text-[#0052A4] hover:underline">
                  {data.email}
                </a>
              }
            />
            <InfoRow label="Provinsi" value={data.provinsi} />
            <InfoRow label="Kabupaten/Kota" value={data.kabupaten} />
            <InfoRow label="Kecamatan" value={data.kecamatan} />
            <InfoRow label="Desa/Kelurahan" value={data.desa} />
            <InfoRow label="Alamat Lengkap" value={data.alamat} />
          </dl>
        </div>

        {/* Section: Profil Bisnis */}
        <div className="border-t border-gray-100 px-6 py-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0052A4]">
            Profil & Kesiapan Bisnis
          </h3>
          <dl>
            <InfoRow
              label="Status"
              value={
                <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">
                  {data.status}
                </span>
              }
            />
            <InfoRow
              label="Kesiapan Bisnis"
              value={
                <span className="inline-block rounded-full bg-green-50 px-3 py-0.5 text-xs font-medium text-green-700">
                  {data.ide}
                </span>
              }
            />
            <InfoRow
              label="Cerita Bisnis"
              value={
                data.cerita ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{data.cerita}</p>
                ) : null
              }
            />
          </dl>
        </div>

        {/* Section: Tujuan */}
        <div className="border-t border-gray-100 px-6 py-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0052A4]">
            Tujuan & Sumber
          </h3>
          <dl>
            <InfoRow
              label="Tujuan Program"
              value={
                data.tujuan && data.tujuan.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1">
                    {data.tujuan.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : null
              }
            />
            <InfoRow
              label="Sumber Informasi"
              value={
                data.sumber ? (
                  <span className="inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700">
                    {data.sumber}
                  </span>
                ) : null
              }
            />
          </dl>
        </div>
      </div>
    </div>
  );
}
