import { z } from "zod";

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
      /^\+?[0-9][0-9\s-]{7,17}$/,
      "Masukkan nomor WhatsApp yang valid, contoh +62 812 3456 7890."
    ),
  email: z
    .string()
    .min(1, "Email wajib diisi.")
    .email("Masukkan alamat email yang valid."),
  provinsi: z.string().min(1, "Provinsi wajib dipilih."),
  kabupaten: z.string().min(1, "Kabupaten/Kota wajib dipilih."),
  kecamatan: z.string().min(1, "Kecamatan wajib dipilih."),
  desa: z.string().min(1, "Desa/Kelurahan wajib dipilih."),
  alamat: z.string().optional().default(""),
  status: z.string().min(1, "Status wajib dipilih."),
  ide: z.string().min(1, "Kesiapan bisnis wajib dipilih."),
  cerita: z.string().optional().default(""),
  pendapatan: z.string().optional().default(""),
  tujuan: z
    .array(z.string())
    .min(1, "Pilih minimal satu tujuan."),
  sumber: z.string().optional().default(""),
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
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(""),
  sort: z
    .enum(["id", "nama", "email", "provinsi", "status", "createdAt", "created_at"])
    .transform((val) => (val === "created_at" ? "createdAt" : val))
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
