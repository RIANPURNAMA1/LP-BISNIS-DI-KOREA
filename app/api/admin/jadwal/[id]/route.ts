import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { STATUS_JADWAL, slotKey, type StatusJadwal } from "@/lib/jadwal";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

// ─── PATCH — ubah status jadwal ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const id = parseInt(params.id, 10);
    const body = await req.json().catch(() => null);
    const status = body?.status as StatusJadwal;
    if (!Number.isFinite(id) || !STATUS_JADWAL.includes(status)) return fail("Data tidak valid.", 400);

    const jadwal = await prisma.jadwalSesi.findUnique({ where: { id } });
    if (!jadwal) return fail("Jadwal tidak ditemukan.", 404);

    // Slot hanya terkunci selama jadwal tidak batal/ditolak.
    const melepas = status === "batal" || status === "ditolak";
    try {
      await prisma.jadwalSesi.update({
        where: { id },
        data: { status, slotKey: melepas ? null : slotKey(jadwal.tanggal, jadwal.jam) },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") {
        return fail("Slot ini sudah dipakai jadwal aktif lain.", 409);
      }
      throw e;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/jadwal/[id] error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
