"use client";

import Link from "next/link";
import { eventLabel } from "@/lib/event";
import { signOut } from "next-auth/react";
import { CheckCircle2, Lock, LogOut, Mail, Phone, RefreshCw } from "lucide-react";

export type ReferralItem = {
  id: number;
  kode: string;
  status: string;
  createdAt: string;
  batasAt: string;
  /** Sisa hari menunggu closing; null bila sudah closing / kedaluwarsa. */
  sisaHari: number | null;
  pendaftaran: {
    nama: string;
    email: string;
    whatsapp: string;
    aksesAktifAt: string | null;
    /** Status Join Program, diatur manual oleh admin. */
    eventStatus: string;
    joinAt: string | null;
  };
};

type Referral = ReferralItem;

export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052A4] focus-visible:ring-offset-2";

export const tanggal = (iso: string, dengan_jam = false) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dengan_jam ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));

/** Header ruang affiliate + navigasi antar halaman. */
export function AfiliasiHeader({
  aktif,
  onRefresh,
}: {
  aktif: "dashboard" | "pendaftar";
  onRefresh?: () => void;
}) {
  const nav = (ya: boolean) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      ya ? "bg-[#0052A4]/10 text-[#0052A4]" : "text-slate-600 hover:bg-slate-100"
    } ${FOCUS}`;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#0052A4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/3.webp" alt="" className="h-8 w-8 object-contain" />
          </span>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-semibold text-slate-900">
              Indonesia-Korea Business Project
            </p>
            <p className="truncate text-sm text-slate-500">Ruang affiliate</p>
          </div>
          <nav aria-label="Menu affiliate" className="flex items-center gap-1 sm:ml-4">
            <Link
              href="/afiliasi/dashboard"
              aria-current={aktif === "dashboard" ? "page" : undefined}
              className={nav(aktif === "dashboard")}
            >
              Dashboard
            </Link>
            <Link
              href="/afiliasi/dashboard/pendaftar"
              aria-current={aktif === "pendaftar" ? "page" : undefined}
              className={nav(aktif === "pendaftar")}
            >
              Data pendaftar
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Muat ulang data"
              title="Muat ulang data"
              className={`grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 ${FOCUS}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className={`inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${FOCUS}`}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Nomor WhatsApp untuk tautan wa.me (hanya angka, kode negara di depan). */
export function nomorWa(raw: string) {
  const digit = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  return digit;
}

/** Kontak peserta agar affiliate bisa menindaklanjuti (follow up). */
export function KontakPeserta({ r }: { r: Referral }) {
  const { nama, whatsapp, email } = r.pendaftaran;
  const pesan = `Halo ${nama}, saya ingin menindaklanjuti pendaftaran Anda di Indonesia-Korea Business Project.`;
  return (
    <div className="space-y-1.5">
      {whatsapp ? (
        <a
          href={`https://wa.me/${nomorWa(whatsapp)}?text=${encodeURIComponent(pesan)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat lewat WhatsApp"
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded text-sm font-medium text-slate-900 hover:text-[#0052A4] hover:underline ${FOCUS}`}
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-[#1B9A4B]" />
          {whatsapp}
        </a>
      ) : null}
      <a
        href={`mailto:${email}`}
        title="Kirim email"
        className={`flex max-w-[220px] items-center gap-1.5 rounded text-xs text-slate-500 hover:text-[#0052A4] hover:underline ${FOCUS}`}
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{email}</span>
      </a>
    </div>
  );
}

export function Badge({ status, map }: { status: string; map: Record<string, string> }) {
  const style =
    status === "terverifikasi" || status === "dibayar"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "menunggu" || status === "diproses" || status === "terdaftar"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${style}`}>
      {map[status] ?? status}
    </span>
  );
}

const EVENT_STYLE: Record<string, string> = {
  join: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  webinar: "bg-sky-50 text-sky-700 ring-sky-200",
  seminar: "bg-sky-50 text-sky-700 ring-sky-200",
  keduanya: "bg-sky-50 text-sky-700 ring-sky-200",
};

/** Badge Status Join Program (nilai dari admin). */
export function StatusJoin({ value }: { value: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        EVENT_STYLE[value] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {eventLabel(value)}
    </span>
  );
}

export function SisaWaktu({ r, total }: { r: Referral; total: number }) {
  if (r.pendaftaran.eventStatus === "join")
    return (
      <div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Sudah join bisnis
        </span>
        {r.pendaftaran.joinAt && (
          <p className="mt-0.5 text-xs text-slate-500">{tanggal(r.pendaftaran.joinAt)}</p>
        )}
      </div>
    );
  if (r.status === "kedaluwarsa")
    return <span className="text-sm text-slate-500">Berakhir {tanggal(r.batasAt)}</span>;
  if (r.sisaHari === null) return <span className="text-slate-400">-</span>;

  const mendesak = r.sisaHari <= 14;
  const persen = Math.max(0, Math.min(100, (r.sisaHari / total) * 100));
  return (
    <div className="min-w-[130px]">
      <p className={`text-sm font-semibold ${mendesak ? "text-red-600" : "text-slate-900"}`}>
        {r.sisaHari} hari lagi
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${mendesak ? "bg-red-500" : "bg-[#0052A4]"}`}
          style={{ width: `${persen}%` }}
        />
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <Lock className="h-3 w-3 shrink-0" />
        Terkunci untuk Anda s.d. {tanggal(r.batasAt)}
      </p>
    </div>
  );
}

export function Statistik({ label, nilai, hint }: { label: string; nilai: number; hint: string }) {
  return (
    <div className="rounded-md border border-slate-200 p-3.5">
      <p className="text-2xl font-semibold tabular-nums text-slate-900">{nilai}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

