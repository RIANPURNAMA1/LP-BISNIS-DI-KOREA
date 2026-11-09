"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Hash,
  Lightbulb,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Target,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";

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
  pendapatan: string;
  tujuan: string[];
  sumber: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// Ubah 08xxx menjadi 628xxx supaya link wa.me valid
function toWaNumber(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.startsWith("0") ? "62" + digits.slice(1) : digits;
}

/* ------------------------------------------------------------------ */
/* UI Components                                                       */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0052A4]/10 text-[#0052A4]">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3.5 last:border-b-0 sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">
        {value || <span className="text-gray-300">—</span>}
      </dd>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "green" | "gray";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/15",
    green: "bg-green-50 text-green-700 ring-green-600/15",
    gray: "bg-gray-100 text-gray-700 ring-gray-500/15",
  }[tone];
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

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
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0052A4]" />
          <p className="mt-3 text-sm text-gray-500">Memuat data pendaftar...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            {error || "Data tidak ditemukan."}
          </p>
          <Link
            href="/admin/pendaftaran"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0052A4] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const createdAt = new Date(data.createdAt || data.created_at || "").toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const lokasi = [data.desa, data.kecamatan, data.kabupaten, data.provinsi]
    .filter(Boolean)
    .join(", ");

  const isLuarNegeri = data.provinsi === "Luar Negeri";

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link
          href="/admin/pendaftaran"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-[#0052A4]"
        >
          <ArrowLeft className="h-4 w-4" />
          Data Pendaftar
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-300" />
        <span className="font-medium text-gray-900">{data.nama}</span>
      </nav>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="h-1.5 bg-gradient-to-r from-[#0052A4] via-[#0a6bd1] to-[#E3081C]" />
        <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#0052A4] text-lg font-bold text-white shadow-md shadow-[#0052A4]/25">
              {getInitials(data.nama)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-gray-900">{data.nama}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  ID {data.id}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Terdaftar {createdAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/${toWaNumber(data.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard icon={User} title="Data Diri">
            <dl>
              <InfoRow label="Nama Lengkap" value={data.nama} />
              <InfoRow
                label="WhatsApp"
                value={
                  <a
                    href={`https://wa.me/${toWaNumber(data.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#0052A4] hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {data.whatsapp}
                  </a>
                }
              />
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${data.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[#0052A4] hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {data.email}
                  </a>
                }
              />
            </dl>
          </SectionCard>

          <SectionCard icon={MapPin} title="Alamat">
            <dl>
              <InfoRow
                label={isLuarNegeri ? "Domisili" : "Provinsi"}
                value={data.provinsi}
              />
              <InfoRow
                label={isLuarNegeri ? "Negara" : "Kabupaten/Kota"}
                value={data.kabupaten}
              />
              <InfoRow
                label={isLuarNegeri ? "Provinsi/State" : "Kecamatan"}
                value={data.kecamatan}
              />
              <InfoRow
                label={isLuarNegeri ? "Kota" : "Desa/Kelurahan"}
                value={data.desa}
              />
              <InfoRow label="Alamat Lengkap" value={data.alamat} />
            </dl>
          </SectionCard>

          <SectionCard icon={Lightbulb} title="Cerita Bisnis">
            <div className="py-4">
              {data.cerita ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {data.cerita}
                </p>
              ) : (
                <p className="text-sm text-gray-300">Belum ada cerita bisnis.</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <SectionCard icon={Briefcase} title="Profil & Kesiapan">
            <dl>
              <InfoRow
                label="Status"
                value={data.status ? <Badge tone="blue">{data.status}</Badge> : null}
              />
              <InfoRow
                label="Kesiapan Bisnis"
                value={data.ide ? <Badge tone="green">{data.ide}</Badge> : null}
              />
              <InfoRow
                label="Personal Income"
                value={data.pendapatan ? <Badge tone="gray">{data.pendapatan}</Badge> : null}
              />
              <InfoRow label="Lokasi" value={lokasi} />
            </dl>
          </SectionCard>

          <SectionCard icon={Target} title="Tujuan Program">
            <div className="py-4">
              {data.tujuan && data.tujuan.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.tujuan.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0052A4]" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-300">—</p>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={Megaphone} title="Sumber Informasi">
            <div className="py-4">
              {data.sumber ? (
                <Badge tone="gray">{data.sumber}</Badge>
              ) : (
                <p className="text-sm text-gray-300">—</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}