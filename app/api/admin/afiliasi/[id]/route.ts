import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { linkAfiliasi } from "@/lib/afiliasi";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Detail affiliate: referral, komisi, dan riwayat pencairan. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID affiliate tidak valid.");

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        email: true,
        whatsapp: true,
        kode: true,
        aktif: true,
        bankNama: true,
        bankNo: true,
        bankAtasNama: true,
        createdAt: true,
        referrals: {
          orderBy: { id: "desc" },
          select: {
            id: true,
            status: true,
            kode: true,
            createdAt: true,
            pendaftaran: { select: { nama: true, email: true } },
          },
        },
        komisi: {
          orderBy: { id: "desc" },
          select: {
            id: true,
            jumlah: true,
            status: true,
            keterangan: true,
            createdAt: true,
            referral: { select: { pendaftaran: { select: { nama: true } } } },
          },
        },
        payouts: { orderBy: { id: "desc" } },
      },
    });
    if (!affiliate) return fail("Affiliate tidak ditemukan.", 404);

    return NextResponse.json({
      success: true,
      data: { ...affiliate, link: linkAfiliasi(affiliate.kode) },
    });
  } catch (e) {
    console.error("GET /api/admin/afiliasi/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
