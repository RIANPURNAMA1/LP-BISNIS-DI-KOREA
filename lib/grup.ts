import prisma from "@/lib/db";

export const WILAYAH_VALUES = [
  "jabodetabek",
  "luar_jabodetabek",
  "luar_negeri",
] as const;

export type Wilayah = (typeof WILAYAH_VALUES)[number];

// Kunci pengaturan di tabel `pengaturan`.
export const KEY_GRUP_UMUM = "wa_group_korean_bisnis_klub";
export const KEY_GRUP_KONSULTASI = "wa_group_konsultasi_online";

// Kunci lama dipakai sebagai cadangan saat pertama kali migrasi,
// supaya link yang sudah diisi admin tidak hilang.
const KEY_LEGACY_UMUM = [
  "wa_group_jabodetabek",
  "wa_group_luar_jabodetabek",
] as const;
const KEY_LEGACY_KONSULTASI = ["wa_group_meeting_lanjutan"] as const;

export type GrupItem = { nama: string; deskripsi: string; url: string };
export type GrupPeserta = GrupItem[];

const NAMA_GRUP = "Korean Bisnis Klub";
const DESKRIPSI_GRUP =
  "Grup umum untuk seluruh peserta Indonesia-Korea Business Project.";

const NAMA_GRUP_KONSULTASI = "Grup Konsultasi Online";
const DESKRIPSI_GRUP_KONSULTASI =
  "Grup khusus peserta yang sudah checkout konsultasi online.";

export type GrupLinks = { umum: string; konsultasi: string };

/** Ambil link grup umum & grup konsultasi online. */
export async function getGrupLinks(): Promise<GrupLinks> {
  const keys = [
    KEY_GRUP_UMUM,
    KEY_GRUP_KONSULTASI,
    ...KEY_LEGACY_UMUM,
    ...KEY_LEGACY_KONSULTASI,
  ];
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [...keys] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value.trim()]));
  const umum = map.has(KEY_GRUP_UMUM)
    ? map.get(KEY_GRUP_UMUM) ?? ""
    : KEY_LEGACY_UMUM.map((k) => map.get(k) ?? "").find(Boolean) ?? "";
  const konsultasi = map.has(KEY_GRUP_KONSULTASI)
    ? map.get(KEY_GRUP_KONSULTASI) ?? ""
    : KEY_LEGACY_KONSULTASI.map((k) => map.get(k) ?? "").find(Boolean) ?? "";
  return { umum, konsultasi };
}

/** Satu grup umum yang ditampilkan ke semua peserta (tanpa pembagian wilayah). */
export async function getGrupUmum(): Promise<GrupItem> {
  const { umum } = await getGrupLinks();
  return { nama: NAMA_GRUP, deskripsi: DESKRIPSI_GRUP, url: umum };
}

/** Grup konsultasi online: hanya ditampilkan setelah peserta checkout. */
export async function getGrupKonsultasi(): Promise<GrupItem> {
  const { konsultasi } = await getGrupLinks();
  return {
    nama: NAMA_GRUP_KONSULTASI,
    deskripsi: DESKRIPSI_GRUP_KONSULTASI,
    url: konsultasi,
  };
}

/** Dipakai alur lama: grup konsultasi online (bukan lagi grup umum). */
export async function getGrupLanjutan(): Promise<GrupPeserta> {
  return [await getGrupKonsultasi()];
}
