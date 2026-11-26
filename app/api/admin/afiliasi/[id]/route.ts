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

// ─── PATCH — aktifkan / nonaktifkan affiliate { aktif: boolean } ───
// Affiliate nonaktif tidak bisa login dan kodenya tidak diterima di formulir pendaftaran.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID affiliate tidak valid.");

    const body = await req.json().catch(() => null);
    if (typeof body?.aktif !== "boolean") return fail("Status aktif tidak valid.");

    const { count } = await prisma.affiliate.updateMany({
      where: { id },
      data: { aktif: body.aktif },
    });
    if (!count) return fail("Affiliate tidak ditemukan.", 404);
    return NextResponse.json({ success: true, aktif: body.aktif });
  } catch (e) {
    console.error("PATCH /api/admin/afiliasi/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// ─── DELETE — hapus affiliate beserta referral, komisi, dan riwayat pencairannya ───
// Ditolak bila masih ada saldo komisi yang belum selesai atau pencairan yang menunggu,
// supaya uang affiliate tidak hilang diam-diam. Untuk kasus itu, nonaktifkan saja.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID affiliate tidak valid.");

    const ada = await prisma.affiliate.findUnique({ where: { id }, select: { id: true } });
    if (!ada) return fail("Affiliate tidak ditemukan.", 404);

    const [komisiBelumSelesai, pencairanMenunggu] = await Promise.all([
      prisma.komisi.count({ where: { affiliateId: id, status: { in: ["tersedia", "diproses"] } } }),
      prisma.payout.count({ where: { affiliateId: id, status: "menunggu" } }),
    ]);
    if (komisiBelumSelesai > 0 || pencairanMenunggu > 0) {
      return fail(
        "Affiliate ini masih punya saldo komisi atau pencairan yang belum selesai. Selesaikan dulu pencairannya, atau nonaktifkan saja.",
        409,
      );
    }

    await prisma.affiliate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/afiliasi/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
