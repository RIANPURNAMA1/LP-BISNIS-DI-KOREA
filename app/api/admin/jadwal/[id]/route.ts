import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { STATUS_JADWAL, cariSlot, slotPrefix, slotSeatKey, type StatusJadwal } from "@/lib/jadwal";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

// ─── PATCH — ubah status jadwal ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const id = parseInt(params.id, 10);
    const body = await req.json().catch(() => null);
    const status = body?.status as StatusJadwal;
    if (!Number.isFinite(id) || !STATUS_JADWAL.includes(status)) return fail("Data tidak valid.");

    const jadwal = await prisma.jadwalSesi.findUnique({ where: { id } });
    if (!jadwal) return fail("Jadwal tidak ditemukan.", 404);

    // Slot hanya terkunci selama jadwal tidak batal/ditolak.
    let slotKey: string | null = null;
    if (status !== "batal" && status !== "ditolak") {
      const slot = await cariSlot(jadwal.tanggal, jadwal.jam);
      const kuota = slot?.kuota ?? 5;
      const dipakai = await prisma.jadwalSesi.findMany({
        where: {
          tanggal: jadwal.tanggal,
          jam: jadwal.jam,
          status: { in: [...STATUS_JADWAL.filter((s) => s !== "batal" && s !== "ditolak")] },
          id: { not: id },
          slotKey: { startsWith: slotPrefix(jadwal.tanggal, jadwal.jam) },
        },
        select: { slotKey: true },
      });
      const used = new Set(dipakai.map((d) => d.slotKey));
      const kursi = Array.from({ length: kuota }, (_, i) => i + 1).find(
        (n) => !used.has(slotSeatKey(jadwal.tanggal, jadwal.jam, n)),
      );
      if (!kursi) return fail("Semua kursi pada slot ini sudah terisi.", 409);
      slotKey = slotSeatKey(jadwal.tanggal, jadwal.jam, kursi);
    }

    await prisma.jadwalSesi.update({ where: { id }, data: { status, slotKey } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/jadwal/[id] error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
