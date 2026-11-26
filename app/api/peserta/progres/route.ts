import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── POST — catat progres video pengarahan ────────────────────────
// Aksi "konsultasi" sengaja dihapus: dulu aksi itu bisa menset konsultasiAt
// tanpa konfirmasi posisi. Sekarang konsultasiAt ditulis endpoint
// /api/peserta/konsultasi setelah video selesai dan posisi dipilih.
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const body = await req.json().catch(() => null);
    if (body?.aksi !== "video" && body?.aksi !== "heartbeat") {
      return fail("Aksi tidak dikenal.", 400);
    }

    const row = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: {
        videoSelesaiAt: true,
        videoMulaiAt: true,
        videoTerakhirAt: true,
        videoPersen: true,
        videoPosisiDetik: true,
      },
    });
    if (!row) return fail("Data peserta tidak ditemukan.", 404);
    const now = new Date();

    if (body.aksi === "heartbeat") {
      const detik = Math.floor(Number(body.detik));
      const persen = Math.floor(Number(body.persen));
      const valid =
        Number.isFinite(detik) && detik >= 0 && Number.isFinite(persen) && persen >= 0 && persen <= 100;

      // Tolak lonjakan tidak wajar: posisi tidak boleh maju lebih cepat dari waktu nyata.
      const selang = row.videoTerakhirAt
        ? Math.max(0, (now.getTime() - row.videoTerakhirAt.getTime()) / 1000)
        : 0;
      const wajar = valid && detik <= row.videoPosisiDetik + selang + 45;

      const data: {
        videoMulaiAt?: Date;
        videoTerakhirAt: Date;
        videoPersen?: number;
        videoPosisiDetik?: number;
      } = { videoTerakhirAt: now };
      if (!row.videoMulaiAt) data.videoMulaiAt = now;
      // Persen tidak boleh turun; yang sudah selesai tetap 100.
      if (wajar && !row.videoSelesaiAt) {
        if (persen > row.videoPersen) data.videoPersen = Math.min(persen, 99);
        if (detik > row.videoPosisiDetik) data.videoPosisiDetik = detik;
      }
      await prisma.pendaftaran.update({ where: { id: peserta.id }, data });
      return NextResponse.json({ success: true });
    }

    if (!row.videoSelesaiAt) {
      await prisma.pendaftaran.update({
        where: { id: peserta.id },
        data: {
          videoSelesaiAt: now,
          videoTerakhirAt: now,
          videoPersen: 100,
          ...(row.videoMulaiAt ? {} : { videoMulaiAt: now }),
        },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/peserta/progres error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
