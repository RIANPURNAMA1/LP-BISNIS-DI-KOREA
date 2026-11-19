import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const data = await prisma.jadwalSesi.findMany({
      orderBy: [{ tanggal: "desc" }, { jam: "asc" }],
      take: 500,
      include: {
        pendaftaran: { select: { id: true, nama: true, whatsapp: true, email: true } },
      },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/jadwal error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
