import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

/** Daftar peserta yang masuk waitinglist karena semua jadwal penuh. */
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const data = await prisma.waitinglist.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        pendaftaran: {
          select: {
            id: true,
            nama: true,
            whatsapp: true,
            email: true,
            eventStatus: true,
            referral: {
              select: {
                status: true,
                affiliate: { select: { id: true, nama: true, kode: true } },
              },
            },
          },
        },
      },
    });
    const rows = data.map(({ pendaftaran, ...w }) => ({
      ...w,
      afiliasi: pendaftaran.referral
        ? {
            id: pendaftaran.referral.affiliate.id,
            nama: pendaftaran.referral.affiliate.nama,
            kode: pendaftaran.referral.affiliate.kode,
            status: pendaftaran.referral.status,
          }
        : null,
      pendaftaran: {
        id: pendaftaran.id,
        nama: pendaftaran.nama,
        whatsapp: pendaftaran.whatsapp,
        email: pendaftaran.email,
        eventStatus: pendaftaran.eventStatus,
      },
    }));
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET /api/admin/waitinglist error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
