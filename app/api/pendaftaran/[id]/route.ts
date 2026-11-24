import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { parseTujuan } from "@/lib/validations";
import { EVENT_VALUES } from "@/lib/event";
import { pilihJadwal } from "@/lib/jadwal-format";

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

    const jadwalSesi = await prisma.jadwalSesi.findMany({
      where: { pendaftaranId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, tanggal: true, jam: true, status: true, catatan: true },
    });

    const referral = await prisma.referral.findUnique({
      where: { pendaftaranId: id },
      select: {
        status: true,
        affiliate: { select: { id: true, nama: true, kode: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        tujuan: parseTujuan(data.tujuan),
        jadwal: pilihJadwal(jadwalSesi),
        afiliasi: referral
          ? {
              id: referral.affiliate.id,
              nama: referral.affiliate.nama,
              kode: referral.affiliate.kode,
              status: referral.status,
            }
          : null,
      },
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

    const sebelum = await prisma.pendaftaran.findUnique({
      where: { id },
      select: { eventStatus: true, joinAt: true },
    });
    if (!sebelum) {
      return NextResponse.json(
        { success: false, error: "Data tidak ditemukan." },
        { status: 404 }
      );
    }
    // Tanggal join dicatat sekali saat status jadi "join"; dihapus bila status diubah lagi.
    const joinAt =
      eventStatus === "join" ? (sebelum.joinAt ?? new Date()) : null;
    await prisma.pendaftaran.update({ where: { id }, data: { eventStatus, joinAt } });
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
