import crypto from "crypto";
import prisma from "@/lib/db";

export const RESET_BERLAKU_MENIT = 60;

export type TipeAkun = "admin" | "afiliasi" | "peserta";

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Akun yang memakai email ini (login mencoba admin, affiliate, lalu peserta). */
export async function cariAkun(email: string) {
  const [admin, affiliate, peserta] = await Promise.all([
    prisma.adminUser.findUnique({ where: { email }, select: { id: true, name: true } }),
    prisma.affiliate.findUnique({
      where: { email },
      select: { id: true, nama: true, aktif: true },
    }),
    prisma.pendaftaran.findFirst({
      where: { email, password: { not: null } },
      select: { id: true, nama: true },
    }),
  ]);
  const hasil: { tipe: TipeAkun; id: number; nama: string }[] = [];
  if (admin) hasil.push({ tipe: "admin", id: admin.id, nama: admin.name });
  if (affiliate?.aktif) hasil.push({ tipe: "afiliasi", id: affiliate.id, nama: affiliate.nama });
  if (peserta) hasil.push({ tipe: "peserta", id: peserta.id, nama: peserta.nama });
  return hasil;
}

/** Buat token baru; token lama akun yang sama otomatis tidak berlaku. */
export async function buatToken(tipe: TipeAkun, userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  await prisma.$transaction([
    prisma.passwordReset.updateMany({
      where: { tipe, userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordReset.create({
      data: {
        tipe,
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + RESET_BERLAKU_MENIT * 60_000),
      },
    }),
  ]);
  return token;
}

/* Pembatas sederhana (per proses): maks. 3 permintaan / 15 menit per email dan per IP. */
const JENDELA_MS = 15 * 60_000;
const MAKS = 3;
const catatan = new Map<string, number[]>();

export function kenaLimit(kunci: string) {
  const now = Date.now();
  const daftar = (catatan.get(kunci) ?? []).filter((t) => now - t < JENDELA_MS);
  if (daftar.length >= MAKS) {
    catatan.set(kunci, daftar);
    return true;
  }
  daftar.push(now);
  catatan.set(kunci, daftar);
  if (catatan.size > 5000) {
    for (const [k, v] of catatan) if (v.every((t) => now - t >= JENDELA_MS)) catatan.delete(k);
  }
  return false;
}
