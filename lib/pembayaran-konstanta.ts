/** Konstanta pembayaran yang aman dipakai di komponen client (tanpa akses database). */

export const HARGA_KONSULTASI = 29900;
export const NAMA_LAYANAN = "Konsultasi Online";

export const METODE_BAYAR = ["bank"] as const;
export type MetodeBayar = (typeof METODE_BAYAR)[number];

export const BANK_LIST = [
  "BCA",
  "Mandiri",
  "BNI",
  "BRI",
  "BTN",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "OCBC",
  "Maybank",
  "Panin",
  "Mega",
  "BTPN / Jenius",
  "Bank Jago",
  "SeaBank",
  "blu by BCA Digital",
  "Allo Bank",
  "Neo Commerce (BNC)",
  "Bank Syariah Indonesia (BSI)",
  "Bank lainnya",
] as const;

export const EWALLET_LIST = [
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
  "i.saku",
  "Sakuku",
  "E-wallet lainnya",
] as const;

/** Semua channel pengirim yang diterima (bank + e-wallet). */
export const BANK_OPTIONS = [...BANK_LIST, ...EWALLET_LIST] as const;

export const STATUS_BAYAR = {
  menunggu: "Menunggu verifikasi",
  dikonfirmasi: "Dikonfirmasi",
  ditolak: "Ditolak",
} as const;

export type StatusBayar = keyof typeof STATUS_BAYAR;

export const BUKTI_PREFIX = "/api/bukti-bayar/";

/** Nama file bukti hanya boleh UUID + ekstensi gambar yang diizinkan. */
export const BUKTI_NAME_RE = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
export const BUKTI_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const MAX_BUKTI_SIZE = 5 * 1024 * 1024; // 5 MB

export function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

/** Metode tetap transfer; channel pengirim boleh bank atau e-wallet. */
export function channelOptions(_metode: string): readonly string[] {
  return BANK_OPTIONS;
}

export function buktiUrl(fileName: string) {
  return `${BUKTI_PREFIX}${fileName}`;
}

export function fileNameFromBukti(url: string) {
  if (!url.startsWith(BUKTI_PREFIX)) return "";
  const name = url.slice(BUKTI_PREFIX.length);
  return BUKTI_NAME_RE.test(name) ? name : "";
}

/* ---------------- rekening / tujuan transfer (diatur admin) ---------------- */

export const KEY_REKENING = {
  bankNama: "pembayaran_bank_nama",
  bankNo: "pembayaran_bank_no",
  bankAtasNama: "pembayaran_bank_atas_nama",
} as const;

export type Rekening = {
  bankNama: string;
  bankNo: string;
  bankAtasNama: string;
};

export const REKENING_KOSONG: Rekening = {
  bankNama: "",
  bankNo: "",
  bankAtasNama: "",
};
