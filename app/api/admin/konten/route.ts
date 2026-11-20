import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import {
  KEY_ARAHAN,
  KEY_JAM,
  KEY_VIDEO_URL,
  getKontenPeserta,
  parseJam,
  validVideoUrl,
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
    const jamInput = String(body?.jam ?? "");
    const jam = parseJam(jamInput);

    if (videoUrl && !validVideoUrl(videoUrl)) {
      return fail("Video harus berupa file upload, link YouTube, atau Vimeo.", 400);
    }
    if (arahan.length > 1000) return fail("Teks arahan maksimal 1000 karakter.", 400);

    const entries: [string, string][] = [
      [KEY_VIDEO_URL, videoUrl],
      [KEY_ARAHAN, arahan],
    ];
    if (jam.length) entries.push([KEY_JAM, jam.join(",")]);
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
