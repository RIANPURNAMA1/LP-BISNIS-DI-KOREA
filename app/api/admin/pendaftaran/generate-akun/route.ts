import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

// Password default yang sama untuk semua akun hasil generate.
const PASSWORD_DEFAULT = "bisniskorea2026";

// ─── GET — jumlah peserta (total dan yang belum punya akun) ───
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const [total, belumPunyaAkun] = await Promise.all([
      prisma.pendaftaran.count(),
      prisma.pendaftaran.count({ where: { password: null } }),
    ]);
    return NextResponse.json({ success: true, total, belumPunyaAkun });
  } catch (error) {
    console.error("GET /api/admin/pendaftaran/generate-akun error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// ─── POST — set password default HANYA untuk peserta yang belum punya akun ───
// Peserta yang sudah punya password tidak disentuh sama sekali.
export async function POST() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }

    const hash = await bcrypt.hash(PASSWORD_DEFAULT, 10);
    const targets = await prisma.pendaftaran.findMany({
      where: { password: null },
      select: { id: true, nama: true, email: true, whatsapp: true },
      orderBy: { id: "asc" },
    });

    if (targets.length > 0) {
      await prisma.pendaftaran.updateMany({
        where: { id: { in: targets.map((t) => t.id) }, password: null },
        data: { password: hash },
      });
    }

    const akun = targets.map((t) => ({ ...t, password: PASSWORD_DEFAULT }));
    return NextResponse.json({ success: true, total: akun.length, data: akun });
  } catch (error) {
    console.error("POST /api/admin/pendaftaran/generate-akun error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
