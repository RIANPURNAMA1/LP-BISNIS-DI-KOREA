import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cek ketersediaan email secara cepat untuk formulir pendaftaran.
 * Tidak mengembalikan data pendaftar, hanya status terdaftar/tersedia.
 */
export async function GET(req: NextRequest) {
  try {
    const email = (new URL(req.url).searchParams.get("email") ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 255);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    const ada = await prisma.pendaftaran.findFirst({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      email,
      terdaftar: !!ada,
      tersedia: !ada,
    });
  } catch (e) {
    console.error("GET /api/pendaftaran/cek-email error:", e);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
