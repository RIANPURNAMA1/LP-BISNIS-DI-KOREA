import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import { getGrupLanjutan } from "@/lib/grup";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── POST — catat progres: { aksi: "video" | "konsultasi" } ──────
// video       : peserta selesai menonton video pengarahan.
// konsultasi  : peserta mengonfirmasi data diri; mengembalikan link grup.
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const aksi = body?.aksi;

    const row = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { videoSelesaiAt: true, konsultasiAt: true },
    });
    if (!row) return fail("Data peserta tidak ditemukan.", 404);

    if (aksi === "video") {
      if (!row.videoSelesaiAt) {
        await prisma.pendaftaran.update({
          where: { id: peserta.id },
          data: { videoSelesaiAt: new Date() },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (aksi === "konsultasi") {
      if (!row.videoSelesaiAt) return fail("Selesaikan video terlebih dulu.", 403);
      if (!row.konsultasiAt) {
        await prisma.pendaftaran.update({
          where: { id: peserta.id },
          data: { konsultasiAt: new Date() },
        });
      }
      return NextResponse.json({ success: true, grup: await getGrupLanjutan() });
    }

    return fail("Aksi tidak dikenal.", 400);
  } catch (error) {
    console.error("POST /api/peserta/progres error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
