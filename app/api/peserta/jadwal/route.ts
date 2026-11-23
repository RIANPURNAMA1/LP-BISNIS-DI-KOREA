import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { jadwalSchema } from "@/lib/validations";
import { STATUS_AKTIF, cariSlot, getSlotTersedia } from "@/lib/jadwal";
import {
  ambilPesertaKonsultasi,
  daftarWaitinglist,
  kirimNotifikasiJadwal,
  pesanKursi,
} from "@/lib/jadwal-peserta";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── GET — jadwal milik peserta + slot fix dari admin ─────────────
export async function GET() {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { posisiKonsultasi: true },
    });
    const [slots, jadwal, waitinglist] = await Promise.all([
      getSlotTersedia(p?.posisiKonsultasi),
      prisma.jadwalSesi.findMany({
        where: { pendaftaranId: peserta.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, tanggal: true, jam: true, catatan: true, status: true },
      }),
      prisma.waitinglist.findUnique({
        where: { pendaftaranId: peserta.id },
        select: { status: true, catatan: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { slots, jadwal, waitinglist },
    });
  } catch (error) {
    console.error("GET /api/peserta/jadwal error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── POST — pilih jadwal konsultasi lanjutan ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const parsed = jadwalSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
    const { tanggal, jam, catatan } = parsed.data;

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
    if (waiting) return fail("Anda sudah terdaftar di waitinglist. Admin akan menghubungi Anda.", 409);
    if (aktif)
      return fail("Anda sudah memiliki jadwal aktif. Batalkan dulu untuk memilih ulang.", 409);

    const kategori = p.posisiKonsultasi;
    const slot = await cariSlot(tanggal, jam, kategori);
    if (!slot) return fail("Jadwal kategori Anda tidak tersedia.", 400);

    // Peserta langsung dikonfirmasi. Jika kursi habis (termasuk race condition),
    // otomatis masuk waitinglist tanpa perlu klik tombol lain.
    const jadwal = await pesanKursi({ peserta: p, tanggal, jam, kategori, catatan });
    if (!jadwal) {
      const row = await daftarWaitinglist(p, catatan);
      return NextResponse.json({ success: true, jenis: "waitinglist", id: row.id }, { status: 201 });
    }

    kirimNotifikasiJadwal(p, jadwal);
    return NextResponse.json({ success: true, jenis: "jadwal", id: jadwal.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/peserta/jadwal error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── DELETE — batalkan jadwal milik sendiri (?id=) ───────────────
export async function DELETE(req: NextRequest) {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const id = parseInt(new URL(req.url).searchParams.get("id") ?? "", 10);
    if (!Number.isFinite(id)) return fail("ID tidak valid.", 400);

    const { count } = await prisma.jadwalSesi.updateMany({
      where: { id, pendaftaranId: peserta.id, status: { in: [...STATUS_AKTIF] } },
      data: { status: "batal", slotKey: null },
    });
    if (!count) return fail("Jadwal tidak ditemukan.", 404);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/peserta/jadwal error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
