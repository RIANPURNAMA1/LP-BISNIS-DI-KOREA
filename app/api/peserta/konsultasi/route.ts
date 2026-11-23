import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { konsultasiPosisiSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/** Status konfirmasi konsultasi lanjutan milik peserta yang sedang login. */
export async function GET() {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: {
        videoSelesaiAt: true,
        konsultasiAt: true,
        posisiKonsultasi: true,
        ijazahS1: true,
      },
    });
    if (!p) return fail("Data peserta tidak ditemukan.", 404);

    return NextResponse.json({
      success: true,
      data: {
        videoSelesai: !!p.videoSelesaiAt,
        konsultasiSelesai: !!p.konsultasiAt && !!p.posisiKonsultasi,
        posisi: p.posisiKonsultasi,
        ijazahS1: p.ijazahS1,
      },
    });
  } catch (error) {
    console.error("GET /api/peserta/konsultasi error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/**
 * Simpan konfirmasi konsultasi lanjutan (opsi A–D).
 * Opsi D hanya valid jika peserta mencentang pernyataan ijazah S1.
 */
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const parsed = konsultasiPosisiSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
    }

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { videoSelesaiAt: true, posisiKonsultasi: true },
    });
    if (!p) return fail("Data peserta tidak ditemukan.", 404);
    if (!p.videoSelesaiAt)
      return fail("Silahkan tonton video di atas sampai selesai terlebih dahulu.", 403);
    if (p.posisiKonsultasi)
      return fail("Konfirmasi konsultasi lanjutan sudah dikirim.", 409);

    const sekarang = new Date();
    await prisma.pendaftaran.update({
      where: { id: peserta.id },
      data: {
        posisiKonsultasi: parsed.data.posisi,
        ijazahS1: parsed.data.ijazahS1,
        posisiDijawabAt: sekarang,
        konsultasiAt: sekarang,
      },
    });

    return NextResponse.json({ success: true, data: { posisi: parsed.data.posisi } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/peserta/konsultasi error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
