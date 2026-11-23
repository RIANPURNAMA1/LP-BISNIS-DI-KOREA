import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Semua pengajuan pencairan affiliate untuk admin. */
export async function GET() {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const data = await prisma.payout.findMany({
      orderBy: { id: "desc" },
      include: {
        affiliate: {
          select: { id: true, nama: true, email: true, whatsapp: true, kode: true },
        },
      },
    });
    return NextResponse.json({
      success: true,
      data,
      ringkasan: {
        menunggu: data.filter((p) => p.status === "menunggu").length,
        dibayar: data.filter((p) => p.status === "dibayar").length,
        ditolak: data.filter((p) => p.status === "ditolak").length,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/afiliasi/pencairan error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
