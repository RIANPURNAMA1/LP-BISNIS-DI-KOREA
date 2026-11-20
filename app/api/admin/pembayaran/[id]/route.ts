import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { notifyPembayaranDikonfirmasi } from "@/lib/email";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Verifikasi / tolak pembayaran. PUT { status: "dikonfirmasi" | "ditolak", catatan?: string } */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);

    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID pembayaran tidak valid.");

    const body = await req.json().catch(() => null);
    const status = String(body?.status ?? "");
    if (status !== "dikonfirmasi" && status !== "ditolak")
      return fail("Status harus dikonfirmasi atau ditolak.");
    const catatan = String(body?.catatan ?? "").trim().slice(0, 500);

    const pembayaran = await prisma.pembayaranKonsultasi.findUnique({
      where: { id },
      include: { pendaftaran: { select: { nama: true, email: true, konsultasiAt: true } } },
    });
    if (!pembayaran) return fail("Data pembayaran tidak ditemukan.", 404);

    const sudahDikonfirmasi = pembayaran.status === "dikonfirmasi";
    const verifiedAt = status === "dikonfirmasi" ? new Date() : null;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.pembayaranKonsultasi.update({
        where: { id },
        data: {
          status,
          verifiedAt: status === "dikonfirmasi" ? verifiedAt : null,
          catatanAdmin: status === "ditolak" ? catatan || "Pembayaran ditolak admin." : "",
        },
      });
      if (status === "dikonfirmasi" && !pembayaran.pendaftaran.konsultasiAt) {
        await tx.pendaftaran.update({
          where: { id: pembayaran.pendaftaranId },
          data: { konsultasiAt: verifiedAt! },
        });
      }
      return row;
    });

    // Email konfirmasi hanya dikirim sekali, saat status berubah menjadi dikonfirmasi.
    if (status === "dikonfirmasi" && !sudahDikonfirmasi) {
      await notifyPembayaranDikonfirmasi({
        nama: pembayaran.nama,
        email: pembayaran.email,
        metode: pembayaran.metode,
        namaChannel: pembayaran.namaChannel,
        namaPengirim: pembayaran.namaPengirim,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PUT /api/admin/pembayaran/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
