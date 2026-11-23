import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { jadwalSlotSchema } from "@/lib/validations";
import { STATUS_AKTIF, slotPrefix, wibToday } from "@/lib/jadwal";

export const dynamic = "force-dynamic";

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

/** Daftar semua slot jadwal (termasuk yang nonaktif) beserta jumlah pesertanya. */
export async function GET() {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const [slots, dipakai] = await Promise.all([
      prisma.jadwalSlot.findMany({ orderBy: [{ tanggal: "asc" }, { jam: "asc" }] }),
      prisma.jadwalSesi.findMany({
        where: { status: { in: [...STATUS_AKTIF] }, slotKey: { not: null } },
        select: { slotKey: true },
      }),
    ]);
    const hitung = new Map<string, number>();
    for (const d of dipakai) {
      const prefix = (d.slotKey ?? "").replace(/_[0-9]+$/, "") + "_";
      hitung.set(prefix, (hitung.get(prefix) ?? 0) + 1);
    }
    return NextResponse.json({
      success: true,
      data: slots.map((s) => {
        const terisi = hitung.get(slotPrefix(s.tanggal, s.jam)) ?? 0;
        return { ...s, terisi, sisa: Math.max(0, s.kuota - terisi) };
      }),
    });
  } catch (error) {
    console.error("GET /api/admin/jadwal/slot error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/** Tambah slot jadwal fix. Kuota default 5 peserta. */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const parsed = jadwalSlotSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
    const { tanggal, jam, kuota } = parsed.data;
    if (tanggal < wibToday()) return fail("Tanggal tidak boleh sebelum hari ini.", 400);

    try {
      const row = await prisma.jadwalSlot.create({ data: { tanggal, jam, kuota } });
      return NextResponse.json({ success: true, data: row }, { status: 201 });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002")
        return fail("Slot dengan tanggal dan jam tersebut sudah ada.", 409);
      throw e;
    }
  } catch (error) {
    console.error("POST /api/admin/jadwal/slot error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
