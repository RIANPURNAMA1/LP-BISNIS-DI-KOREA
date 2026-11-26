import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { akhirHariWib } from "@/lib/kupon";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

const MAX_KUOTA = 100000;

function parseId(raw: string) {
  const id = parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

// ─── GET — riwayat pemakaian satu kupon ───
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const id = parseId(params.id);
    if (id === null) return fail("ID tidak valid.");

    const rows = await prisma.pemakaianKupon.findMany({
      where: { kuponId: id },
      orderBy: { id: "desc" },
      select: {
        id: true,
        createdAt: true,
        pendaftaran: { select: { id: true, nama: true, email: true, whatsapp: true } },
      },
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error("GET /api/admin/kupon/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── PUT — ubah { aktif?, kuota?, berlakuSampai?: "YYYY-MM-DD" | "", catatan? } ───
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const id = parseId(params.id);
    if (id === null) return fail("ID tidak valid.");
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Data tidak valid.");

    const kupon = await prisma.kupon.findUnique({ where: { id } });
    if (!kupon) return fail("Kupon tidak ditemukan.", 404);

    const data: {
      aktif?: boolean;
      kuota?: number;
      berlakuSampai?: Date | null;
      catatan?: string | null;
    } = {};

    if ("aktif" in body) data.aktif = !!body.aktif;
    if ("kuota" in body) {
      const kuota = Number(body.kuota);
      if (!Number.isInteger(kuota) || kuota < 1 || kuota > MAX_KUOTA)
        return fail(`Kuota harus bilangan bulat 1–${MAX_KUOTA}.`);
      if (kuota < kupon.terpakai)
        return fail(`Kuota tidak boleh di bawah jumlah yang sudah terpakai (${kupon.terpakai}).`);
      data.kuota = kuota;
    }
    if ("berlakuSampai" in body) {
      if (!body.berlakuSampai) data.berlakuSampai = null;
      else {
        const d = akhirHariWib(String(body.berlakuSampai));
        if (!d) return fail("Tanggal berlaku tidak valid.");
        data.berlakuSampai = d;
      }
    }
    if ("catatan" in body) data.catatan = String(body.catatan ?? "").trim().slice(0, 255) || null;

    // Kuota dibandingkan lagi di WHERE agar tidak turun di bawah pemakaian yang
    // baru masuk di sela-sela request ini.
    const { count } = await prisma.kupon.updateMany({
      where: { id, ...(data.kuota !== undefined ? { terpakai: { lte: data.kuota } } : {}) },
      data,
    });
    if (!count) return fail("Kuota tidak boleh di bawah jumlah yang sudah terpakai.", 409);

    return NextResponse.json({ success: true, data: await prisma.kupon.findUnique({ where: { id } }) });
  } catch (e) {
    console.error("PUT /api/admin/kupon/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── DELETE — hanya kupon yang belum pernah dipakai ───
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const id = parseId(params.id);
    if (id === null) return fail("ID tidak valid.");

    const { count } = await prisma.kupon.deleteMany({ where: { id, terpakai: 0 } });
    if (!count)
      return fail("Kupon sudah pernah dipakai atau tidak ditemukan. Nonaktifkan saja kupon ini.", 409);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/kupon/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
