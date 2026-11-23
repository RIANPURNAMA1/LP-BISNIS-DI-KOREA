import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { jadwalSchema } from "@/lib/validations";
import { notifyJadwalKonsultasi } from "@/lib/email";
import { notifyJadwalBaru } from "@/lib/wa-notif";
import {
  STATUS_AKTIF,
  cariSlot,
  getSlotTersedia,
  kursiTersedia,
  slotSeatKey,
} from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── GET — jadwal milik peserta + slot fix dari admin ─────────────
export async function GET() {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const [slots, jadwal, waitinglist] = await Promise.all([
      getSlotTersedia(),
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
    if (waiting) return fail("Anda sudah terdaftar di waitinglist. Admin akan menghubungi Anda.", 409);
    if (aktif)
      return fail("Anda sudah memiliki jadwal aktif. Batalkan dulu untuk memilih ulang.", 409);

    const slot = await cariSlot(tanggal, jam);
    if (!slot) return fail("Jadwal tidak tersedia.", 400);

    // Coba setiap kursi yang masih kosong; jika ada race condition, lanjut ke kursi berikutnya.
    const kursi = await kursiTersedia(tanggal, jam);
    if (!kursi.length) return fail("Jadwal sudah full. Silakan klik tombol waitinglist.", 409);

    let created = null;
    let terpakai = false;
    for (const nomor of kursi) {
      try {
        created = await prisma.jadwalSesi.create({
          data: {
            pendaftaranId: peserta.id,
            tanggal,
            jam,
            catatan: catatan.trim() || null,
            // Peserta langsung masuk jadwal; tidak perlu verifikasi admin.
            status: "dikonfirmasi",
            slotKey: slotSeatKey(tanggal, jam, nomor),
          },
          include: { pendaftaran: { select: { nama: true, whatsapp: true } } },
        });
        break;
      } catch (e) {
        if ((e as { code?: string }).code === "P2002") {
          terpakai = true;
          continue;
        }
        throw e;
      }
    }
    if (!created) {
      return fail(
        terpakai
          ? "Jadwal baru saja penuh. Silakan pilih jadwal lain atau klik waitinglist."
          : "Jadwal belum tersimpan. Coba lagi.",
        409,
      );
    }

    void notifyJadwalBaru({
      nama: created.pendaftaran.nama,
      whatsapp: created.pendaftaran.whatsapp,
      tanggal,
      jam,
      catatan: created.catatan,
    });
    void notifyJadwalKonsultasi({ nama: p.nama, email: p.email, tanggal, jam });

    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
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
