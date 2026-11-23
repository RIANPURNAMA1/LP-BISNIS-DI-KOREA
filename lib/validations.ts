import { z } from "zod";
import { KODE_AFILIASI_RE } from "./afiliasi-konstanta";

/** Kategori konsultasi lanjutan A–D. Dipakai form peserta, admin, dan slot jadwal. */
export const POSISI_KONSULTASI = ["A", "B", "C", "D"] as const;
export type PosisiKonsultasi = (typeof POSISI_KONSULTASI)[number];

// ─── Validasi Pendaftaran (dari formulir) ────────────────────────
export const pendaftaranSchema = z.object({
  nama: z
    .string()
    .min(1, "Nama wajib diisi.")
    .max(255, "Nama terlalu panjang."),
  whatsapp: z
    .string()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .regex(
      /^\+?[0-9][0-9\s-]{6,24}$/,
      "Masukkan nomor WhatsApp yang valid, contoh +62 812 3456 7890."
    ),
  email: z
    .string()
    .min(1, "Email wajib diisi.")
    .email("Masukkan alamat email yang valid."),
  // Untuk domisili Indonesia, kota/daerah disimpan di kolom kabupaten.
  // Kolom provinsi/kecamatan/desa boleh kosong (data lama tetap didukung).
  provinsi: z.string().optional().default(""),
  kabupaten: z.string().min(1, "Kota/Daerah domisili wajib diisi."),
  kecamatan: z.string().optional().default(""),
  desa: z.string().optional().default(""),
  alamat: z.string().optional().default(""),
  status: z.string().min(1, "Status wajib dipilih."),
  ide: z.string().min(1, "Kesiapan bisnis wajib dipilih."),
  cerita: z.string().optional().default(""),
  pendapatan: z.string().optional().default(""),
  tujuan: z
    .array(z.string())
    .min(1, "Pilih minimal satu tujuan."),
  sumber: z.string().optional().default(""),
  // Kode affiliate dari tautan /daftar?ref=IKXXXXXX. Kosong boleh.
  kodeAfiliasi: z
    .string()
    .trim()
    .max(30)
    .optional()
    .default("")
    .transform((v) => v.toUpperCase())
    .refine((v) => !v || KODE_AFILIASI_RE.test(v), "Kode afiliasi tidak valid."),
  wilayah: z.enum(["jabodetabek", "luar_jabodetabek", "luar_negeri"], {
    message: "Wilayah domisili wajib dipilih.",
  }),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(72, "Password maksimal 72 karakter."),
});

export type PendaftaranInput = z.infer<typeof pendaftaranSchema>;

// ─── Validasi Login ──────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Validasi Query Params ───────────────────────────────────────
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  search: z.string().optional().default(""),
  event: z.string().optional().default(""),
  // "1" = hanya pendaftar yang sudah submit konfirmasi meeting lanjutan.
  meeting: z.string().optional().default(""),
  sort: z
    .enum(["id", "nama", "email", "provinsi", "status", "createdAt", "created_at"])
    .transform((val) => (val === "created_at" ? "createdAt" : val))
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

// ─── Kolom `tujuan` ──────────────────────────────────────────────
// Di database disimpan sebagai teks JSON (contoh: ["A","B"]),
// di aplikasi dipakai sebagai array string.
export function serializeTujuan(tujuan: string[]): string {
  return JSON.stringify(tujuan);
}

export function parseTujuan(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return [value];
  }
}

// ─── Password peserta ────────────────────────────────────────────
export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.");

// ─── Jadwal sesi ─────────────────────────────────────────────────
export const jadwalSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  jam: z.string().regex(/^\d{2}:\d{2}$/, "Jam tidak valid."),
  catatan: z.string().max(500, "Catatan maksimal 500 karakter.").optional().default(""),
});

// ─── Slot jadwal yang ditetapkan admin ───────────────────────────
export const jadwalSlotSchema = z.object({
  kategori: z.enum(POSISI_KONSULTASI, { message: "Pilih kategori A–D." }).default("A"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  jam: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidak valid."),
  kuota: z.coerce.number().int().min(1, "Kuota minimal 1.").max(50, "Kuota maksimal 50.").default(5),
});

// ─── Konfirmasi konsultasi lanjutan (opsi A–D) ───────────────────
export const konsultasiPosisiSchema = z
  .object({
    posisi: z.enum(POSISI_KONSULTASI, { message: "Pilih salah satu posisi." }),
    ijazahS1: z.boolean().default(false),
  })
  .refine((v) => v.posisi !== "D" || v.ijazahS1, {
    message: "Opsi D wajib memiliki ijazah S1.",
    path: ["ijazahS1"],
  });

// ─── Waitinglist ─────────────────────────────────────────────────
export const waitinglistSchema = z.object({
  catatan: z.string().max(500, "Catatan maksimal 500 karakter.").optional().default(""),
});

// ─── Afiliasi ────────────────────────────────────────────────────
export const affiliateDaftarSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(255, "Nama terlalu panjang."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email wajib diisi.")
    .email("Masukkan alamat email yang valid."),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .regex(/^\+?[0-9][0-9\s-]{6,24}$/, "Masukkan nomor WhatsApp yang valid."),
  password: passwordSchema,
});

export const affiliateProfilSchema = z.object({
  bankNama: z.string().trim().max(100, "Nama bank terlalu panjang.").default(""),
  bankNo: z
    .string()
    .trim()
    .max(100, "Nomor rekening terlalu panjang.")
    .default(""),
  bankAtasNama: z
    .string()
    .trim()
    .max(150, "Atas nama terlalu panjang.")
    .default(""),
});

export const affiliatePencairanSchema = z.object({
  konfirmasi: z.literal(true, {
    message: "Konfirmasi pencairan wajib dicentang.",
  }),
});

export const adminPencairanSchema = z.object({
  status: z.enum(["dibayar", "ditolak"], {
    message: "Status harus dibayar atau ditolak.",
  }),
  catatan: z.string().trim().max(500, "Catatan maksimal 500 karakter.").default(""),
});
