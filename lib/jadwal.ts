import prisma from "@/lib/db";

// Kunci pengaturan (tabel `pengaturan`) untuk halaman peserta.
export const KEY_VIDEO_URL = "peserta_video_url";
export const KEY_ARAHAN = "peserta_arahan";
export const KEY_JAM = "jadwal_jam";

export const DEFAULT_JAM = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
export const DEFAULT_ARAHAN =
  "Silakan tonton video berikut sampai selesai. Setelah itu, jadwalkan sesi meeting online untuk membahas Project Indonesia-Korea.";

/** Hari ke depan yang bisa dipilih, dan hari kerja yang tersedia (0 = Minggu). */
export const RANGE_HARI = 21;
const HARI_AKTIF = new Set([1, 2, 3, 4, 5]);

export const STATUS_AKTIF = ["menunggu", "dikonfirmasi"] as const;
export const STATUS_JADWAL = ["menunggu", "dikonfirmasi", "selesai", "batal", "ditolak"] as const;
export type StatusJadwal = (typeof STATUS_JADWAL)[number];

export type KontenPeserta = { videoUrl: string; arahan: string; jam: string[] };

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Pecah teks "09:00, 10:00" menjadi daftar jam valid, unik, dan terurut. */
export function parseJam(input: string): string[] {
  const list = input.split(/[\s,;]+/).filter((j) => HH_MM.test(j));
  return Array.from(new Set(list)).sort();
}

export async function getKontenPeserta(): Promise<KontenPeserta> {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [KEY_VIDEO_URL, KEY_ARAHAN, KEY_JAM] } },
  });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const jam = parseJam(m.get(KEY_JAM) ?? "");
  return {
    videoUrl: (m.get(KEY_VIDEO_URL) ?? "").trim(),
    arahan: (m.get(KEY_ARAHAN) ?? "").trim() || DEFAULT_ARAHAN,
    jam: jam.length ? jam : DEFAULT_JAM,
  };
}

/** Ubah link YouTube/Vimeo ke URL embed. Mengembalikan "" jika bukan link yang dikenali. */
export function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : "";
      }
      if (u.pathname.startsWith("/embed/")) return raw;
    }
    if (host === "vimeo.com" && /^\/\d+$/.test(u.pathname))
      return `https://player.vimeo.com/video${u.pathname}`;
    if (host === "player.vimeo.com") return raw;
  } catch {
    /* URL tidak valid */
  }
  return "";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Tanggal "YYYY-MM-DD" sekarang di WIB (UTC+7), terlepas dari zona waktu server. */
function wibNow() {
  return new Date(Date.now() + 7 * 3600_000);
}

export function wibToday() {
  const d = wibNow();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Tanggal yang bisa dipilih: besok s.d. RANGE_HARI ke depan, hanya hari kerja. */
export function tanggalTersedia(): string[] {
  const base = wibNow();
  const out: string[] = [];
  for (let i = 1; i <= RANGE_HARI; i++) {
    const d = new Date(base.getTime() + i * 86400_000);
    if (!HARI_AKTIF.has(d.getUTCDay())) continue;
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return out;
}

export const slotKey = (tanggal: string, jam: string) => `${tanggal}_${jam}`;
