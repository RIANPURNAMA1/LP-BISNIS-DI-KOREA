/** Konstanta afiliasi yang aman dipakai di komponen client (tanpa database). */

export const KEY_AFILIASI_KOMISI = "afiliasi_komisi";
export const KEY_AFILIASI_MIN_PENCAIRAN = "afiliasi_minimal_pencairan";

/** Nominal komisi per referral terverifikasi (dapat diubah admin di Pengaturan). */
export const DEFAULT_KOMISI = 10000;
/** Minimal saldo untuk mengajukan pencairan (dapat diubah admin). */
export const DEFAULT_MIN_PENCAIRAN = 50000;

/** Kode afiliasi: huruf kapital, angka, dan tanda hubung. */
export const KODE_AFILIASI_RE = /^[A-Z0-9-]{4,30}$/;

/** Bukti transfer pencairan hanya bisa dilihat admin & affiliate pemiliknya. */
export const BUKTI_PENCAIRAN_PREFIX = "/api/bukti-pencairan/";

export const STATUS_REFERRAL = {
  terdaftar: "Terdaftar",
  terverifikasi: "Terverifikasi",
  kedaluwarsa: "Kedaluwarsa",
  batal: "Batal",
} as const;

export const STATUS_KOMISI = {
  tersedia: "Tersedia",
  diproses: "Diproses",
  dibayar: "Dibayar",
  dibatalkan: "Dibatalkan",
} as const;

export const STATUS_PAYOUT = {
  menunggu: "Menunggu",
  dibayar: "Dibayar",
  ditolak: "Ditolak",
} as const;

export type StatusKomisi = keyof typeof STATUS_KOMISI;
export type StatusPayout = keyof typeof STATUS_PAYOUT;

/** Rekening tujuan pencairan milik affiliate. */
export type RekeningAfiliasi = {
  bankNama: string;
  bankNo: string;
  bankAtasNama: string;
};

export const REKENING_AFILIASI_KOSONG: RekeningAfiliasi = {
  bankNama: "",
  bankNo: "",
  bankAtasNama: "",
};

export const BANK_AFILIASI = [
  "BCA",
  "Mandiri",
  "BNI",
  "BRI",
  "CIMB Niaga",
  "Permata",
  "Bank Syariah Indonesia (BSI)",
  "Bank lainnya",
] as const;

/**
 * Masa atribusi referral: peserta yang mendaftar lewat link affiliate harus
 * menyelesaikan pembayaran dalam jangka waktu ini (dihitung dari tanggal daftar).
 * Lewat dari itu, peserta tidak lagi terafiliasi dan komisi tidak diberikan.
 */
export const REFERRAL_BERLAKU_HARI = 90;

const HARI_MS = 24 * 60 * 60 * 1000;

/** Batas akhir atribusi referral. */
export function batasReferral(daftarAt: Date | string): Date {
  return new Date(new Date(daftarAt).getTime() + REFERRAL_BERLAKU_HARI * HARI_MS);
}

/** Sisa hari (dibulatkan ke atas) sampai batas; 0 atau kurang = sudah lewat. */
export function sisaHariReferral(daftarAt: Date | string, now: Date = new Date()): number {
  return Math.ceil((batasReferral(daftarAt).getTime() - now.getTime()) / HARI_MS);
}
