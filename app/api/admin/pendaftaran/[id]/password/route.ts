import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";

// Tanpa karakter yang mudah tertukar (0/O, 1/l/I).
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const generate = (len = 10) =>
  Array.from({ length: len }, () => CHARS[randomInt(CHARS.length)]).join("");

// ─── POST — reset password peserta; password baru dikembalikan sekali ───
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "ID tidak valid." }, { status: 400 });
    }

    const password = generate();
    const { count } = await prisma.pendaftaran.updateMany({
      where: { id },
      data: { password: await bcrypt.hash(password, 10) },
    });
    if (!count) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true, password });
  } catch (error) {
    console.error("POST /api/admin/pendaftaran/[id]/password error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
