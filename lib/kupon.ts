import { randomInt } from "crypto";

/** Kode kupon: huruf besar/angka/strip, 3–40 karakter. */
export const KUPON_RE = /^[A-Z0-9-]{3,40}$/;

export const normalisasiKode = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

// Tanpa karakter yang mudah tertukar (0/O, 1/I).
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const generateKode = (len = 8) =>
  Array.from({ length: len }, () => CHARS[randomInt(CHARS.length)]).join("");

/** Tanggal "YYYY-MM-DD" dari admin → akhir hari itu (WIB). */
export function akhirHariWib(tanggal: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return null;
  const d = new Date(`${tanggal}T23:59:59+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

// Pembatas tebakan kode per peserta (in-memory, per instance server).
const MAX_FAIL = 5;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map<number, { n: number; first: number }>();

export function kuponTerkunci(pesertaId: number) {
  const f = fails.get(pesertaId);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    fails.delete(pesertaId);
    return false;
  }
  return f.n >= MAX_FAIL;
}

export function catatGagalKupon(pesertaId: number) {
  const f = fails.get(pesertaId);
  if (!f || Date.now() - f.first > WINDOW_MS) fails.set(pesertaId, { n: 1, first: Date.now() });
  else f.n += 1;
}

export function resetGagalKupon(pesertaId: number) {
  fails.delete(pesertaId);
}
