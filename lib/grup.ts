import prisma from "@/lib/db";

export const WILAYAH_VALUES = [
  "jabodetabek",
  "luar_jabodetabek",
  "luar_negeri",
] as const;

export type Wilayah = (typeof WILAYAH_VALUES)[number];

// Kunci pengaturan di tabel `pengaturan`.
export const KEY_GRUP_JABODETABEK = "wa_group_jabodetabek";
export const KEY_GRUP_LUAR = "wa_group_luar_jabodetabek";

/** Ambil dua link grup WhatsApp dari database (kosong jika belum diatur). */
export async function getGrupLinks() {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [KEY_GRUP_JABODETABEK, KEY_GRUP_LUAR] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value.trim()]));
  return {
    jabodetabek: map.get(KEY_GRUP_JABODETABEK) ?? "",
    luarJabodetabek: map.get(KEY_GRUP_LUAR) ?? "",
  };
}

/** Pilih link grup sesuai wilayah. Luar negeri memakai grup "luar Jabodetabek". */
export async function getGrupUrlUntuk(wilayah: Wilayah): Promise<string> {
  const links = await getGrupLinks();
  return wilayah === "jabodetabek" ? links.jabodetabek : links.luarJabodetabek;
}
