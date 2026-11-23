import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { STATUS_BAYAR, type StatusBayar } from "@/lib/pembayaran";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Daftar pembayaran aktivasi akun yang perlu diverifikasi admin. */
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "all";
    const search = (searchParams.get("search") ?? "").trim().slice(0, 100);

    const validStatus = status === "all" || Object.prototype.hasOwnProperty.call(STATUS_BAYAR, status);
    if (!validStatus) return fail("Filter status tidak valid.");

    const where = {
      ...(status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { nama: { contains: search } },
              { email: { contains: search } },
              { whatsapp: { contains: search } },
              { namaPengirim: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, groups] = await Promise.all([
      prisma.pembayaranKonsultasi.findMany({
        where,
        orderBy: { id: "desc" },
        include: {
          pendaftaran: {
            select: { id: true, wilayah: true, konsultasiAt: true, aksesAktifAt: true },
          },
        },
      }),
      prisma.pembayaranKonsultasi.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts: Record<StatusBayar | "all", number> = {
      all: 0,
      menunggu: 0,
      dikonfirmasi: 0,
      ditolak: 0,
    };
    for (const g of groups) {
      if (Object.prototype.hasOwnProperty.call(counts, g.status)) {
        counts[g.status as StatusBayar] = g._count._all;
        counts.all += g._count._all;
      }
    }

    return NextResponse.json({ success: true, data, counts });
  } catch (e) {
    console.error("GET /api/admin/pembayaran error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
