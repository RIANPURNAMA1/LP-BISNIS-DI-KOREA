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
