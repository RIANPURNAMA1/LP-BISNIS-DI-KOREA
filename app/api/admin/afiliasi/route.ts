import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Daftar affiliate untuk admin, lengkap dengan ringkasan performa. */
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);

    const search = new URL(req.url).searchParams.get("search")?.trim() ?? "";
    const rows = await prisma.affiliate.findMany({
      where: search
        ? {
            OR: [
              { nama: { contains: search } },
              { email: { contains: search } },
              { kode: { contains: search } },
            ],
          }
        : {},
      orderBy: { id: "desc" },
      include: {
        referrals: { select: { status: true } },
        komisi: { select: { jumlah: true, status: true } },
        payouts: { select: { status: true } },
      },
    });

    const data = rows.map((r) => ({
      id: r.id,
      nama: r.nama,
      email: r.email,
      whatsapp: r.whatsapp,
      kode: r.kode,
      aktif: r.aktif,
      createdAt: r.createdAt,
      bankNama: r.bankNama,
      bankNo: r.bankNo,
      bankAtasNama: r.bankAtasNama,
      totalReferral: r.referrals.length,
      terverifikasi: r.referrals.filter((x) => x.status === "terverifikasi").length,
      totalKomisi: r.komisi
        .filter((x) => x.status !== "dibatalkan")
        .reduce((sum, x) => sum + x.jumlah, 0),
      saldo: r.komisi
        .filter((x) => x.status === "tersedia")
        .reduce((sum, x) => sum + x.jumlah, 0),
      pencairanAktif: r.payouts.filter((x) => x.status === "menunggu").length,
    }));

    return NextResponse.json({
      success: true,
      data,
      ringkasan: {
        affiliate: data.length,
        referral: data.reduce((s, x) => s + x.totalReferral, 0),
        terverifikasi: data.reduce((s, x) => s + x.terverifikasi, 0),
        saldo: data.reduce((s, x) => s + x.saldo, 0),
      },
    });
  } catch (e) {
    console.error("GET /api/admin/afiliasi error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
