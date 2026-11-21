import prisma from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { getWaSnapshot, normalizeNumber, sendWaText } from "@/lib/whatsapp";

export const KEY_NOTIF_ENABLED = "wa_notif_enabled";
export const KEY_NOTIF_NUMBERS = "wa_notif_numbers";

export type NotifSettings = { enabled: boolean; numbers: string[] };

/** Pecah teks (satu nomor per baris / dipisah koma) jadi daftar nomor unik & valid. */
export function parseNumbers(input: string | string[]): string[] {
  const list = Array.isArray(input) ? input : String(input).split(/[\n,;]+/);
  const out: string[] = [];
  for (const item of list) {
    const n = normalizeNumber(item);
    if (n.length >= 8 && n.length <= 15 && !out.includes(n)) out.push(n);
  }
  return out;
}

export async function getNotifSettings(): Promise<NotifSettings> {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [KEY_NOTIF_ENABLED, KEY_NOTIF_NUMBERS] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.get(KEY_NOTIF_ENABLED) === "1",
    numbers: parseNumbers(map.get(KEY_NOTIF_NUMBERS) ?? ""),
  };
}

export async function saveNotifSettings(s: NotifSettings) {
  const entries: [string, string][] = [
    [KEY_NOTIF_ENABLED, s.enabled ? "1" : "0"],
    [KEY_NOTIF_NUMBERS, s.numbers.join("\n")],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.pengaturan.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );
}

type PendaftarPesan = {
  id: number;
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string;
  kabupaten: string;
  desa: string;
  status: string;
  ide: string;
  pendapatan?: string | null;
  tujuan: string[];
  sumber?: string | null;
  createdAt?: Date;
};

function buildMessage(p: PendaftarPesan) {
  const luar = p.provinsi === "Luar Negeri";
  const domisili = luar
    ? [p.desa, p.kabupaten].filter(Boolean).join(", ") + " (Luar Negeri)"
    : [p.kabupaten, p.provinsi].filter(Boolean).join(", ");
  const waNumber = normalizeNumber(p.whatsapp);
  const waktu = (p.createdAt ?? new Date()).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines = [
    "*Pendaftar baru*",
    `_${waktu} WIB_`,
    "",
    `Nama: ${p.nama}`,
    `WhatsApp: ${p.whatsapp}${waNumber ? ` (https://wa.me/${waNumber})` : ""}`,
    `Email: ${p.email}`,
    `Domisili: ${domisili}`,
    `Status: ${p.status}`,
    `Ide bisnis: ${p.ide}`,
  ];
  if (p.pendapatan) lines.push(`Personal income: ${p.pendapatan}`);
  if (p.tujuan.length) lines.push(`Tujuan: ${p.tujuan.join(", ")}`);
  if (p.sumber) lines.push(`Sumber info: ${p.sumber}`);
  lines.push("", `Detail: ${SITE_URL}/admin/pendaftaran/${p.id}`);
  return lines.join("\n");
}

/**
 * Kirim notifikasi pendaftar baru ke nomor admin.
 * Tidak pernah melempar error: kegagalan hanya dicatat di log,
 * supaya pendaftaran tidak ikut gagal.
 */
export async function notifyPendaftaranBaru(p: PendaftarPesan) {
  try {
    if (getWaSnapshot().status !== "connected") return;
    const settings = await getNotifSettings();
    if (!settings.enabled || settings.numbers.length === 0) return;

    const results = await sendWaText(settings.numbers, buildMessage(p));
    const gagal = results.filter((r) => !r.ok);
    if (gagal.length) console.error("[wa] notifikasi gagal ke:", gagal);
  } catch (e) {
    console.error("[wa] notifikasi error:", e);
  }
}

/** Notifikasi jadwal sesi baru ke admin. Tidak pernah melempar error. */
export async function notifyJadwalBaru(p: {
  nama: string;
  whatsapp: string;
  tanggal: string;
  jam: string;
  catatan?: string | null;
}) {
  try {
    if (getWaSnapshot().status !== "connected") return;
    const settings = await getNotifSettings();
    if (!settings.enabled || settings.numbers.length === 0) return;

    const lines = [
      "*Jadwal sesi baru*",
      `Nama: ${p.nama}`,
      `WhatsApp: ${p.whatsapp}`,
      `Waktu: ${p.tanggal} pukul ${p.jam} WIB`,
      ...(p.catatan ? [`Catatan: ${p.catatan}`] : []),
      `${SITE_URL}/admin`,
    ];
    await sendWaText(settings.numbers, lines.join("\n"));
  } catch (e) {
    console.error("[wa] notifikasi jadwal error:", e);
  }
}

/** Notifikasi bukti pembayaran baru ke admin. Tidak pernah melempar error. */
export async function notifyPembayaranMasuk(p: {
  nama: string;
  whatsapp: string;
  namaChannel: string;
  namaPengirim: string;
  jumlah: number;
  buktiBayar?: string;
}) {
  try {
    if (getWaSnapshot().status !== "connected") return;
    const settings = await getNotifSettings();
    if (!settings.enabled || settings.numbers.length === 0) return;

    const waNumber = normalizeNumber(p.whatsapp);
    const waktu = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const lines = [
      "*Bukti pembayaran baru*",
      `_${waktu} WIB_`,
      "",
      `Nama: ${p.nama}`,
      `WhatsApp: ${p.whatsapp}${waNumber ? ` (https://wa.me/${waNumber})` : ""}`,
      `Bank: ${p.namaChannel}`,
      `Nama pengirim: ${p.namaPengirim}`,
      `Jumlah: Rp${new Intl.NumberFormat("id-ID").format(p.jumlah)}`,
      ...(p.buktiBayar ? [`Lihat bukti: ${SITE_URL}${p.buktiBayar}`] : []),
      `Verifikasi: ${SITE_URL}/admin/pembayaran`,
    ];
    await sendWaText(settings.numbers, lines.join("\n"));
  } catch (e) {
    console.error("[wa] notifikasi pembayaran error:", e);
  }
}

export const TEST_MESSAGE =
  "*Tes notifikasi*\nWhatsApp berhasil terhubung. Notifikasi pendaftar baru dan bukti pembayaran akan dikirim ke nomor ini.";
