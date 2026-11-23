import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/** Jumlah pembayaran yang masih perlu diverifikasi (untuk badge sidebar). */
export async function GET() {
  try {
    if (!(await requireAdmin())?.user) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const count = await prisma.pembayaranKonsultasi.count({
      where: { status: "menunggu" },
    });
    return NextResponse.json({ success: true, count });
  } catch (e) {
    console.error("GET /api/admin/pembayaran/count error:", e);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
