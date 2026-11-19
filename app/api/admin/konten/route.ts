import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import {
  KEY_ARAHAN,
  KEY_JAM,
  KEY_VIDEO_URL,
  getKontenPeserta,
  parseJam,
  toEmbedUrl,
} from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

export async function GET() {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    return NextResponse.json({ success: true, data: await getKontenPeserta() });
  } catch (error) {
    console.error("GET /api/admin/konten error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const videoUrl = String(body?.videoUrl ?? "").trim();
    const arahan = String(body?.arahan ?? "").trim();
    const jam = parseJam(String(body?.jam ?? ""));

    if (videoUrl && !toEmbedUrl(videoUrl)) {
      return fail("Link video harus berupa link YouTube atau Vimeo.", 400);
    }
    if (arahan.length > 1000) return fail("Teks arahan maksimal 1000 karakter.", 400);
    if (!jam.length) return fail("Isi minimal satu jam sesi, contoh 09:00.", 400);

    const entries: [string, string][] = [
      [KEY_VIDEO_URL, videoUrl],
      [KEY_ARAHAN, arahan],
      [KEY_JAM, jam.join(",")],
    ];
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.pengaturan.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/konten error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
