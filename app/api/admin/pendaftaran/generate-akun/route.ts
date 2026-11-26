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

// ─── POST — set password default untuk SEMUA peserta ───
// Setiap kali dipanggil, password semua peserta di-reset ke password default
// (termasuk yang sudah punya akun), lalu daftar akunnya dikembalikan untuk PDF.
export async function POST() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }

    const hash = await bcrypt.hash(PASSWORD_DEFAULT, 10);
    const [, targets] = await prisma.$transaction([
      prisma.pendaftaran.updateMany({ data: { password: hash } }),
      prisma.pendaftaran.findMany({
        select: { id: true, nama: true, email: true, whatsapp: true },
        orderBy: { id: "asc" },
      }),
    ]);

    const akun = targets.map((t) => ({ ...t, password: PASSWORD_DEFAULT }));
    return NextResponse.json({ success: true, total: akun.length, data: akun });
  } catch (error) {
    console.error("POST /api/admin/pendaftaran/generate-akun error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
