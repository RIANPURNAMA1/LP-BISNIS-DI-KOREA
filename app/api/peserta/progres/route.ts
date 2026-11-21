import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── POST — catat progres video pengarahan ────────────────────────
// Aksi "konsultasi" sengaja dihapus: dulu aksi itu bisa menset konsultasiAt
// tanpa pembayaran, sehingga peserta mengira pembayarannya sudah lunas.
// Sekarang konsultasiAt/aksesAktifAt hanya ditulis admin saat verifikasi.
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const body = await req.json().catch(() => null);
    if (body?.aksi !== "video") return fail("Aksi tidak dikenal.", 400);

    const row = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { videoSelesaiAt: true },
    });
    if (!row) return fail("Data peserta tidak ditemukan.", 404);

    if (!row.videoSelesaiAt) {
      await prisma.pendaftaran.update({
        where: { id: peserta.id },
        data: { videoSelesaiAt: new Date() },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/peserta/progres error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
