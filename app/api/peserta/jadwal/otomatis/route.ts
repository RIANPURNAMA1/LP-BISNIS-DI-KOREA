import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { waitinglistSchema } from "@/lib/validations";
import { STATUS_AKTIF } from "@/lib/jadwal";
import { ambilPesertaKonsultasi, pilihJadwalOtomatis } from "@/lib/jadwal-peserta";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/**
 * Dipanggil saat peserta mengonfirmasi posisi A–D.
 * Peserta langsung mendapat slot kategori tersebut; bila penuh, otomatis waitinglist.
 */
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const parsed = waitinglistSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);

    const [p, aktif, waiting] = await Promise.all([
      ambilPesertaKonsultasi(peserta.id),
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

    // Idempoten: bila jaringan gagal dan tombol ditekan lagi, kembalikan hasil yang sudah ada.
    if (aktif)
      return NextResponse.json({ success: true, jenis: "jadwal", id: aktif.id }, { status: 200 });
    if (waiting)
      return NextResponse.json({ success: true, jenis: "waitinglist", id: waiting.id }, { status: 200 });

    const hasil = await pilihJadwalOtomatis(p, parsed.data.catatan);
    if (!hasil) return fail("Posisi konsultasi belum tersimpan.", 409);

    return NextResponse.json({ success: true, ...hasil }, { status: 201 });
  } catch (error) {
    console.error("POST /api/peserta/jadwal/otomatis error:", error);
    return fail("Jadwal belum tersimpan. Coba lagi.", 500);
  }
}
