import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { jadwalSlotSchema } from "@/lib/validations";
import { STATUS_AKTIF, slotPrefix, wibToday } from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

async function terisi(slotId: number) {
  const slot = await prisma.jadwalSlot.findUnique({ where: { id: slotId } });
  if (!slot) return null;
  const prefix = slotPrefix(slot.tanggal, slot.jam);
  const rows = await prisma.jadwalSesi.findMany({
    where: {
      status: { in: [...STATUS_AKTIF] },
      tanggal: slot.tanggal,
      jam: slot.jam,
      slotKey: { startsWith: prefix },
    },
    select: { id: true },
  });
  return { slot, count: rows.length };
}

/** Ubah kuota / aktif-nonaktif / tanggal & jam slot. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID tidak valid.", 400);

    const body = await req.json().catch(() => null);
    const parsed = jadwalSlotSchema.partial().safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
    const data = parsed.data;
    if (data.tanggal && data.tanggal < wibToday())
      return fail("Tanggal tidak boleh sebelum hari ini.", 400);

    const info = await terisi(id);
    if (!info) return fail("Slot tidak ditemukan.", 404);
    const kuotaBaru = data.kuota ?? info.slot.kuota;
    if (kuotaBaru < info.count)
      return fail(`Kuota tidak boleh lebih kecil dari jumlah peserta yang sudah terdaftar (${info.count}).`, 409);

    const row = await prisma.jadwalSlot.update({
      where: { id },
      data: {
        ...(data.tanggal !== undefined ? { tanggal: data.tanggal } : {}),
        ...(data.jam !== undefined ? { jam: data.jam } : {}),
        ...(data.kuota !== undefined ? { kuota: data.kuota } : {}),
        ...(typeof body?.aktif === "boolean" ? { aktif: body.aktif } : {}),
      },
    });
    return NextResponse.json({ success: true, data: row });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002")
      return fail("Slot dengan tanggal dan jam tersebut sudah ada.", 409);
    console.error("PATCH /api/admin/jadwal/slot/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/** Hapus slot, hanya jika belum dipakai jadwal aktif. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID tidak valid.", 400);

    const info = await terisi(id);
    if (!info) return fail("Slot tidak ditemukan.", 404);
    if (info.count > 0)
      return fail("Slot masih dipakai peserta. Nonaktifkan saja agar tidak bisa dipilih.", 409);

    await prisma.jadwalSlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/jadwal/slot/[id] error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
