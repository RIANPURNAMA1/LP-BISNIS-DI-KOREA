import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { hashToken } from "@/lib/password-reset";
import { passwordSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/), password: passwordSchema });

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

const TIDAK_VALID = "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.";

async function cariToken(token: string) {
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  return row && !row.usedAt && row.expiresAt > new Date() ? row : null;
}

/** GET — cek token masih berlaku (untuk halaman reset). */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!/^[0-9a-f]{64}$/.test(token) || !(await cariToken(token))) return fail(TIDAK_VALID);
  return NextResponse.json({ success: true });
}

/** POST — pasang password baru. */
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      const pesanPassword = parsed.error.issues.find((i) => i.path[0] === "password")?.message;
      return fail(pesanPassword ?? TIDAK_VALID);
    }
    const { token, password } = parsed.data;

    const row = await cariToken(token);
    if (!row) return fail(TIDAK_VALID);

    // Klaim token lebih dulu (atomik) supaya tidak bisa dipakai dua kali.
    const klaim = await prisma.passwordReset.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (!klaim.count) return fail(TIDAK_VALID);

    const hash = await bcrypt.hash(password, 10);
    if (row.tipe === "admin")
      await prisma.adminUser.update({ where: { id: row.userId }, data: { password: hash } });
    else if (row.tipe === "afiliasi")
      await prisma.affiliate.update({ where: { id: row.userId }, data: { password: hash } });
    else if (row.tipe === "peserta")
      await prisma.pendaftaran.update({ where: { id: row.userId }, data: { password: hash } });
    else return fail(TIDAK_VALID);

    // Semua tautan lain milik akun ini ikut hangus.
    await prisma.passwordReset.updateMany({
      where: { tipe: row.tipe, userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return fail("Terjadi kesalahan server. Coba lagi.", 500);
  }
}
