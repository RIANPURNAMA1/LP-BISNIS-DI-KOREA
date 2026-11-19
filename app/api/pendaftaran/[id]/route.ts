import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { parseTujuan } from "@/lib/validations";
import { EVENT_VALUES } from "@/lib/event";

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
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid." },
        { status: 400 }
      );
    }

    const data = await prisma.pendaftaran.findUnique({
      where: { id },
      omit: { password: true },
    });

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

// ─── PATCH — Ubah status event pendaftar ─────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const eventStatus = typeof body?.eventStatus === "string" ? body.eventStatus : null;
    if (eventStatus === null || !EVENT_VALUES.includes(eventStatus)) {
      return NextResponse.json(
        { success: false, error: "Status event tidak valid." },
        { status: 400 }
      );
    }

    await prisma.pendaftaran.update({ where: { id }, data: { eventStatus } });
    return NextResponse.json({ success: true, eventStatus });
  } catch (error) {
    console.error("PATCH /api/pendaftaran/[id] error:", error);
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
    const session = await requireAdmin();
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
