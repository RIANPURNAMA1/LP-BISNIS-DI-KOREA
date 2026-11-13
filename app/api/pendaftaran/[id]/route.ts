import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { parseTujuan } from "@/lib/validations";

async function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Tidak terautentikasi." },
    { status: 401 }
  );
}

// ─── GET — Detail pendaftar ──────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid." },
        { status: 400 }
      );
    }

    const data = await prisma.pendaftaran.findUnique({ where: { id } });

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Data tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...data, tujuan: parseTujuan(data.tujuan) },
    });
  } catch (error) {
    console.error("GET /api/pendaftaran/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

// ─── DELETE — Hapus pendaftar ────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid." },
        { status: 400 }
      );
    }

    await prisma.pendaftaran.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pendaftaran/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
