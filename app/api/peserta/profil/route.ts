import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import { passwordSchema } from "@/lib/validations";
import { catatGagal, resetGagal, sisaKunciMenit } from "@/lib/batas-percobaan";

export const dynamic = "force-dynamic";

const schema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi.").max(255),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .regex(/^\+?[0-9][0-9\s-]{6,24}$/, "Masukkan nomor WhatsApp yang valid."),
  // Password baru kosong = tidak ganti password. Jika diisi, password lama wajib.
  passwordLama: z.string().max(72).optional().default(""),
  passwordBaru: z.string().max(72).optional().default(""),
});

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** PUT — peserta mengubah profil (nama, WhatsApp) dan/atau password sendiri. */
export async function PUT(req: Request) {
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.");
    const { nama, whatsapp, passwordLama, passwordBaru } = parsed.data;

    const data: { nama: string; whatsapp: string; password?: string } = { nama, whatsapp };

    if (passwordBaru) {
      const cek = passwordSchema.safeParse(passwordBaru);
      if (!cek.success) return fail(cek.error.issues[0].message);

      // Password lama wajib dan harus cocok. Yang lupa memakai "Lupa password" via email.
      if (!passwordLama) return fail("Password lama wajib diisi untuk mengganti password.");

      const kunci = `profil:${peserta.id}`;
      const sisa = sisaKunciMenit(kunci);
      if (sisa > 0) {
        return fail(`Terlalu banyak percobaan salah. Coba lagi dalam ${sisa} menit atau reset lewat email.`, 429);
      }
      const row = await prisma.pendaftaran.findUnique({
        where: { id: peserta.id },
        select: { password: true },
      });
      const cocok = row?.password ? await bcrypt.compare(passwordLama, row.password) : false;
      if (!cocok) {
        catatGagal(kunci);
        return fail("Password lama salah.");
      }
      resetGagal(kunci);
      data.password = await bcrypt.hash(passwordBaru, 10);
    }

    await prisma.pendaftaran.update({ where: { id: peserta.id }, data });
    return NextResponse.json({ success: true, passwordDiganti: !!data.password });
  } catch (e) {
    console.error("PUT /api/peserta/profil error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
