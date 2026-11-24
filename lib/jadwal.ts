import prisma from "@/lib/db";

// Kunci pengaturan (tabel `pengaturan`) untuk halaman peserta.
export const KEY_VIDEO_URL = "peserta_video_url";
export const KEY_VIDEO_THUMB = "peserta_video_thumb";
export const THUMB_PREFIX = "/api/thumbnail/";
export const KEY_ARAHAN = "peserta_arahan";
export const KEY_JAM = "jadwal_jam";

export const DEFAULT_JAM = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
export const DEFAULT_ARAHAN =
  "Silakan tonton video berikut sampai selesai. Setelah itu, konfirmasi data diri Anda untuk melanjutkan program.";

/** Hari ke depan yang bisa dipilih, dan hari kerja yang tersedia (0 = Minggu). */
export const RANGE_HARI = 21;
const HARI_AKTIF = new Set([1, 2, 3, 4, 5]);

export const STATUS_AKTIF = ["menunggu", "dikonfirmasi"] as const;
export const STATUS_JADWAL = ["menunggu", "dikonfirmasi", "selesai", "batal", "ditolak"] as const;
export type StatusJadwal = (typeof STATUS_JADWAL)[number];

export type KontenPeserta = { videoUrl: string; thumbnailUrl: string; arahan: string; jam: string[] };

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Pecah teks "09:00, 10:00" menjadi daftar jam valid, unik, dan terurut. */
export function parseJam(input: string): string[] {
  const list = input.split(/[\s,;]+/).filter((j) => HH_MM.test(j));
  return Array.from(new Set(list)).sort();
}

export async function getKontenPeserta(): Promise<KontenPeserta> {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [KEY_VIDEO_URL, KEY_VIDEO_THUMB, KEY_ARAHAN, KEY_JAM] } },
  });
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const jam = parseJam(m.get(KEY_JAM) ?? "");
  return {
    videoUrl: (m.get(KEY_VIDEO_URL) ?? "").trim(),
    thumbnailUrl: (m.get(KEY_VIDEO_THUMB) ?? "").trim(),
    arahan: (m.get(KEY_ARAHAN) ?? "").trim() || DEFAULT_ARAHAN,
    jam: jam.length ? jam : DEFAULT_JAM,
  };
}

/** File video hasil upload admin, disajikan melalui /api/video/:nama. */
export const VIDEO_UPLOAD_PREFIX = "/api/video/";
const VIDEO_EXT = "(?:mp4|webm|ogg|mov|m4v)";

/** URL video valid: file hasil upload atau link YouTube/Vimeo. */
export function validVideoUrl(raw: string): boolean {
  const value = raw.trim();
  if (new RegExp(`^${VIDEO_UPLOAD_PREFIX}[A-Za-z0-9._-]+\\.${VIDEO_EXT}$`, "i").test(value))
    return true;
  return !!toEmbedUrl(value);
}

export function isUploadedVideo(raw: string): boolean {
  return raw.trim().startsWith(VIDEO_UPLOAD_PREFIX);
}

/** Ubah link YouTube/Vimeo ke URL embed. Mengembalikan "" jika bukan link yang dikenali. */
export function toEmbedUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be" && u.pathname.length > 1)
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : "";
      }
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
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

/* ------------------------------------------------------------------ */
/* Jadwal fix dari admin, kuota 5 peserta per slot                      */
/* ------------------------------------------------------------------ */

export const DEFAULT_KUOTA = 5;

export type SlotTersedia = {
  id: number;
  kategori: string;
  tanggal: string;
  jam: string;
  kuota: number;
  terisi: number;
  sisa: number;
};

/** Kategori A–D yang valid; mengembalikan null untuk data lama tanpa kategori. */
function normalKategori(kategori?: string | null): string | null {
  const v = kategori?.trim().toUpperCase();
  return v && /^[A-D]$/.test(v) ? v : null;
}

/**
 * Prefix kunci kursi: "kategori_tanggal_jam_" untuk slot baru.
 * Tanpa kategori dipakai format lama "tanggal_jam_" agar jadwal lama tetap terbaca.
 * Panjang kunci dengan kategori = 20 karakter, sesuai batas kolom `slot_key`.
 */
export const slotPrefix = (tanggal: string, jam: string, kategori?: string | null) => {
  const kat = normalKategori(kategori);
  return `${kat ? `${kat}_` : ""}${tanggal}_${jam}_`;
};

export const slotSeatKey = (
  tanggal: string,
  jam: string,
  kursi: number,
  kategori?: string | null,
) => `${slotPrefix(tanggal, jam, kategori)}${kursi}`;

/**
 * Slot yang ditetapkan admin untuk satu kategori (A–D), masih aktif, dan belum lewat.
 * Jika kategori kosong, semua slot dikembalikan (dipakai admin/legacy).
 * `terisi` dihitung dari jadwal aktif (menunggu/dikonfirmasi).
 */
export async function getSlotTersedia(kategori?: string | null): Promise<SlotTersedia[]> {
  const kat = normalKategori(kategori);
  const slots = await prisma.jadwalSlot.findMany({
    where: {
      aktif: true,
      tanggal: { gte: wibToday() },
      ...(kat ? { kategori: kat } : {}),
    },
    orderBy: [{ kategori: "asc" }, { tanggal: "asc" }, { jam: "asc" }],
  });
  if (!slots.length) return [];

  const tanggal = Array.from(new Set(slots.map((s) => s.tanggal)));
  const jam = Array.from(new Set(slots.map((s) => s.jam)));
  const dipakai = await prisma.jadwalSesi.findMany({
    where: {
      status: { in: [...STATUS_AKTIF] },
      tanggal: { in: tanggal },
      jam: { in: jam },
      slotKey: { not: null },
    },
    select: { slotKey: true },
  });
  const hitung = new Map<string, number>();
  for (const d of dipakai) {
    const prefix = (d.slotKey ?? "").replace(/_[0-9]+$/, "") + "_";
    hitung.set(prefix, (hitung.get(prefix) ?? 0) + 1);
  }

  return slots.map((s) => {
    const terisi = hitung.get(slotPrefix(s.tanggal, s.jam, s.kategori)) ?? 0;
    return {
      id: s.id,
      kategori: s.kategori,
      tanggal: s.tanggal,
      jam: s.jam,
      kuota: s.kuota,
      terisi,
      sisa: Math.max(0, s.kuota - terisi),
    };
  });
}

/** Cek apakah tanggal+jam termasuk slot fix kategori yang masih bisa dipilih. */
export async function cariSlot(tanggal: string, jam: string, kategori?: string | null) {
  if (tanggal < wibToday()) return null;
  const kat = normalKategori(kategori);
  return prisma.jadwalSlot.findFirst({
    where: { tanggal, jam, aktif: true, ...(kat ? { kategori: kat } : {}) },
  });
}

/** Nomor kursi yang masih kosong pada sebuah slot (1..kuota). */
export async function kursiTersedia(
  tanggal: string,
  jam: string,
  kategori?: string | null,
): Promise<number[]> {
  const slot = await cariSlot(tanggal, jam, kategori);
  if (!slot) return [];
  const dipakai = await prisma.jadwalSesi.findMany({
    where: {
      tanggal,
      jam,
      status: { in: [...STATUS_AKTIF] },
      slotKey: { startsWith: slotPrefix(tanggal, jam, kategori ?? slot.kategori) },
    },
    select: { slotKey: true },
  });
  const used = new Set(dipakai.map((d) => d.slotKey));
  return Array.from({ length: slot.kuota }, (_, i) => i + 1).filter(
    (n) => !used.has(slotSeatKey(tanggal, jam, n, kategori ?? slot.kategori)),
  );
}
