import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { notifyAksesDiaktifkan } from "@/lib/email";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

const MAX_IDS = 1000;

/**
 * Aktifkan / cabut akses member secara manual oleh admin.
 * POST { ids: number[], aksi: "aktifkan" | "cabut", catatan?: string }
 * Progres peserta (video, posisi, jadwal) tidak dihapus saat akses dicabut.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const aksi = body?.aksi;
    if (aksi !== "aktifkan" && aksi !== "cabut") return fail("Aksi tidak valid.");

    const ids: number[] = Array.isArray(body?.ids)
      ? Array.from(new Set<number>((body.ids as unknown[]).map((v) => Number(v)))).filter(
          (n) => Number.isInteger(n) && n > 0,
        )
      : [];
    if (ids.length === 0) return fail("Pilih minimal satu peserta.");
    if (ids.length > MAX_IDS) return fail(`Maksimal ${MAX_IDS} peserta sekali proses.`);

    if (aksi === "cabut") {
      const { count } = await prisma.pendaftaran.updateMany({
        where: { id: { in: ids }, aksesAktifAt: { not: null } },
        data: { aksesAktifAt: null, aksesVia: null, aksesCatatan: null },
      });
      return NextResponse.json({ success: true, diubah: count, dilewati: ids.length - count });
    }

    const catatan = String(body?.catatan ?? "").trim().slice(0, 255) || null;
    const targets = await prisma.pendaftaran.findMany({
      where: { id: { in: ids }, aksesAktifAt: null },
      select: { id: true, nama: true, email: true },
    });
    const targetIds = targets.map((t) => t.id);

    if (targetIds.length > 0) {
      const sekarang = new Date();
      await prisma.$transaction([
        // Syarat aksesAktifAt null di WHERE mencegah menimpa akses yang baru aktif di sela proses.
        prisma.pendaftaran.updateMany({
          where: { id: { in: targetIds }, aksesAktifAt: null },
          data: {
            aksesAktifAt: sekarang,
            konsultasiAt: sekarang,
            aksesVia: "manual",
            aksesCatatan: catatan,
          },
        }),
        // Bukti transfer yang masih menunggu tidak perlu diverifikasi lagi.
        prisma.pembayaranKonsultasi.updateMany({
          where: { pendaftaranId: { in: targetIds }, status: "menunggu" },
          data: {
            status: "ditolak",
            catatanAdmin: "Dibatalkan otomatis: akses diaktifkan manual oleh admin.",
          },
        }),
      ]);

      // Email satu per satu di latar belakang; gagal kirim tidak memengaruhi aktivasi.
      void (async () => {
        for (const t of targets) await notifyAksesDiaktifkan({ nama: t.nama, email: t.email });
      })();
    }

    return NextResponse.json({
      success: true,
      diubah: targetIds.length,
      dilewati: ids.length - targetIds.length,
    });
  } catch (e) {
    console.error("POST /api/admin/pendaftaran/akses error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
