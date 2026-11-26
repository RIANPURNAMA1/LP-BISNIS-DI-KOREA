import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { KUPON_RE, akhirHariWib, generateKode, normalisasiKode } from "@/lib/kupon";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

const MAX_KUOTA = 100000;

// ─── GET — daftar kupon ───
export async function GET() {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const data = await prisma.kupon.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/admin/kupon error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── POST — buat kupon { kode?, kuota, berlakuSampai?: "YYYY-MM-DD", catatan? } ───
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const body = await req.json().catch(() => null);

    const kuota = Number(body?.kuota);
    if (!Number.isInteger(kuota) || kuota < 1 || kuota > MAX_KUOTA)
      return fail(`Kuota harus bilangan bulat 1–${MAX_KUOTA}.`);

    let kode = normalisasiKode(body?.kode);
    if (kode && !KUPON_RE.test(kode))
      return fail("Kode hanya boleh huruf, angka, dan strip (3–40 karakter).");

    let berlakuSampai: Date | null = null;
    if (body?.berlakuSampai) {
      berlakuSampai = akhirHariWib(String(body.berlakuSampai));
      if (!berlakuSampai) return fail("Tanggal berlaku tidak valid.");
    }
    const catatan = String(body?.catatan ?? "").trim().slice(0, 255) || null;

    // Kode kosong → dibuat otomatis; coba ulang bila bentrok.
    for (let i = 0; i < 5; i++) {
      const pakai = kode || generateKode();
      try {
        const data = await prisma.kupon.create({
          data: { kode: pakai, kuota, berlakuSampai, catatan },
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          if (kode) return fail("Kode kupon sudah ada.", 409);
          continue;
        }
        throw e;
      }
    }
    return fail("Gagal membuat kode unik. Coba lagi.", 500);
  } catch (e) {
    console.error("POST /api/admin/kupon error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
