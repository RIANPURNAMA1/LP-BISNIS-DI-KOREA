import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { waitinglistSchema } from "@/lib/validations";
import { notifyWaitinglistDiterima } from "@/lib/email";
import { notifyWaitinglistBaru } from "@/lib/wa-notif";
import { STATUS_AKTIF } from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/** Cek apakah peserta sudah masuk waitinglist. */
export async function GET() {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);
    const row = await prisma.waitinglist.findUnique({
      where: { pendaftaranId: peserta.id },
      select: { status: true, catatan: true, createdAt: true },
    });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error("GET /api/peserta/waitinglist error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/** Daftar ke waitinglist saat semua jadwal sudah penuh. */
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const parsed = waitinglistSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);

    const [p, aktif, sudah] = await Promise.all([
      prisma.pendaftaran.findUnique({
        where: { id: peserta.id },
        select: {
          nama: true,
          whatsapp: true,
          email: true,
          videoSelesaiAt: true,
          posisiKonsultasi: true,
        },
      }),
      prisma.jadwalSesi.findFirst({
        where: { pendaftaranId: peserta.id, status: { in: [...STATUS_AKTIF] } },
        select: { id: true },
      }),
      prisma.waitinglist.findUnique({
        where: { pendaftaranId: peserta.id },
        select: { id: true },
      }),
    ]);
    if (!p) return fail("Data peserta tidak ditemukan.", 404);
    if (!p.videoSelesaiAt)
      return fail("Silahkan tonton video di atas sampai selesai terlebih dahulu.", 403);
    if (!p.posisiKonsultasi)
      return fail("Isi konfirmasi konsultasi lanjutan terlebih dahulu.", 409);
    if (aktif) return fail("Anda sudah memiliki jadwal aktif.", 409);
    if (sudah) return fail("Anda sudah terdaftar di waitinglist.", 409);

    const row = await prisma.waitinglist.create({
      data: {
        pendaftaranId: peserta.id,
        posisi: p.posisiKonsultasi,
        catatan: parsed.data.catatan.trim() || null,
      },
    });

    void notifyWaitinglistBaru({
      nama: p.nama,
      whatsapp: p.whatsapp,
      posisi: p.posisiKonsultasi,
      catatan: row.catatan,
    });
    void notifyWaitinglistDiterima({ nama: p.nama, email: p.email });

    return NextResponse.json({ success: true, id: row.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/peserta/waitinglist error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
