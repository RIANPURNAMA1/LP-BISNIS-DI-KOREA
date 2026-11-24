import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buatToken, cariAkun, kenaLimit } from "@/lib/password-reset";
import { kirimEmailResetPassword } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(255) });

// Respons selalu sama agar email terdaftar/tidak terdaftar tidak bisa ditebak.
const ok = () =>
  NextResponse.json({
    success: true,
    message: "Jika email terdaftar, tautan untuk mengatur ulang password sudah kami kirim.",
  });

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { success: false, error: "Masukkan alamat email yang valid." },
        { status: 400 },
      );
    const { email } = parsed.data;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (kenaLimit(`email:${email}`) || kenaLimit(`ip:${ip}`))
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 15 menit." },
        { status: 429 },
      );

    const akun = await cariAkun(email);
    for (const a of akun) {
      const token = await buatToken(a.tipe, a.id);
      await kirimEmailResetPassword({ nama: a.nama, email, tipe: a.tipe, token });
    }
    return ok();
  } catch (error) {
    console.error("POST /api/auth/lupa-password error:", error);
    return ok();
  }
}
