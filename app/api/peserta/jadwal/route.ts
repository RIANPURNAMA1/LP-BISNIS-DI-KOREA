import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import { jadwalSchema } from "@/lib/validations";
import { notifyJadwalBaru } from "@/lib/wa-notif";
import { STATUS_AKTIF, getKontenPeserta, slotKey, tanggalTersedia } from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── GET — jadwal milik peserta + slot yang masih bisa dipilih ───
export async function GET() {
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

    const tanggal = tanggalTersedia();
    const [konten, jadwal, terisi] = await Promise.all([
      getKontenPeserta(),
      prisma.jadwalSesi.findMany({
        where: { pendaftaranId: peserta.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, tanggal: true, jam: true, catatan: true, status: true },
      }),
      prisma.jadwalSesi.findMany({
        where: { tanggal: { in: tanggal }, slotKey: { not: null } },
        select: { slotKey: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { jadwal, tanggal, jam: konten.jam, terisi: terisi.map((t) => t.slotKey) },
    });
  } catch (error) {
    console.error("GET /api/peserta/jadwal error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── POST — buat jadwal sesi ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

    const parsed = jadwalSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
    const { tanggal, jam, catatan } = parsed.data;

    const konten = await getKontenPeserta();
    if (!tanggalTersedia().includes(tanggal) || !konten.jam.includes(jam)) {
      return fail("Waktu yang dipilih tidak tersedia.", 400);
    }

    const aktif = await prisma.jadwalSesi.findFirst({
      where: { pendaftaranId: peserta.id, status: { in: [...STATUS_AKTIF] } },
      select: { id: true },
    });
    if (aktif) {
      return fail("Anda sudah memiliki jadwal aktif. Batalkan dulu untuk memilih ulang.", 409);
    }

    let created;
    try {
      created = await prisma.jadwalSesi.create({
        data: {
          pendaftaranId: peserta.id,
          tanggal,
          jam,
          catatan: catatan.trim() || null,
          slotKey: slotKey(tanggal, jam),
        },
        include: { pendaftaran: { select: { nama: true, whatsapp: true } } },
      });
    } catch (e) {
      // Unique slotKey: slot baru saja diambil peserta lain.
      if ((e as { code?: string }).code === "P2002") {
        return fail("Slot tersebut baru saja diambil. Silakan pilih waktu lain.", 409);
      }
      throw e;
    }

    void notifyJadwalBaru({
      nama: created.pendaftaran.nama,
      whatsapp: created.pendaftaran.whatsapp,
      tanggal,
      jam,
      catatan: created.catatan,
    });

    return NextResponse.json({ success: true, id: created.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/peserta/jadwal error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── DELETE — batalkan jadwal milik sendiri (?id=) ───────────────
export async function DELETE(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

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
