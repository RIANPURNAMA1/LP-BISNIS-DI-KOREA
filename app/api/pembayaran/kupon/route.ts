import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import {
  KUPON_RE,
  catatGagalKupon,
  kuponTerkunci,
  normalisasiKode,
  resetGagalKupon,
} from "@/lib/kupon";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

class KuponError extends Error {}

const PESAN_TIDAK_VALID = "Kode kupon tidak valid, sudah habis, atau tidak berlaku.";

/**
 * Aktivasi akun dengan kupon (menggantikan transfer Rp29.900).
 * Kuota dikurangi secara atomik dalam satu transaksi dengan pembukaan akses.
 */
export async function POST(req: NextRequest) {
  const peserta = await requirePeserta();
  if (!peserta) return fail("Tidak terautentikasi.", 401);

  try {
    const body = await req.json().catch(() => null);
    const kode = normalisasiKode(body?.kode);
    if (!kode) return fail("Masukkan kode kupon.");

    if (kuponTerkunci(peserta.id))
      return fail("Terlalu banyak percobaan. Coba lagi dalam 15 menit.", 429);

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { aksesAktifAt: true },
    });
    if (!p) return fail("Data peserta tidak ditemukan.", 404);
    if (p.aksesAktifAt) return fail("Akun Anda sudah aktif.", 409);

    if (!KUPON_RE.test(kode)) {
      catatGagalKupon(peserta.id);
      return fail(PESAN_TIDAK_VALID);
    }

    try {
      await prisma.$transaction(async (tx) => {
        const kupon = await tx.kupon.findUnique({ where: { kode }, select: { id: true } });
        if (!kupon) throw new KuponError(PESAN_TIDAK_VALID);

        // Atomik: hanya naik jika masih aktif, belum kedaluwarsa, dan kuota tersisa.
        const naik = await tx.$executeRaw`
          UPDATE kupon SET terpakai = terpakai + 1
          WHERE id = ${kupon.id} AND aktif = 1 AND terpakai < kuota
            AND (berlaku_sampai IS NULL OR berlaku_sampai > NOW(3))`;
        if (naik === 0) throw new KuponError(PESAN_TIDAK_VALID);

        // pendaftaranId unik: gagal (dan seluruh transaksi di-rollback) bila sudah pernah memakai kupon.
        await tx.pemakaianKupon.create({
          data: { kuponId: kupon.id, pendaftaranId: peserta.id },
        });

        const sekarang = new Date();
        await tx.pendaftaran.update({
          where: { id: peserta.id },
          data: { aksesAktifAt: sekarang, konsultasiAt: sekarang, aksesVia: "kupon", aksesCatatan: kode },
        });

        // Bukti transfer yang masih menunggu tidak perlu diverifikasi lagi.
        await tx.pembayaranKonsultasi.updateMany({
          where: { pendaftaranId: peserta.id, status: "menunggu" },
          data: {
            status: "ditolak",
            catatanAdmin: `Dibatalkan otomatis: akun diaktifkan dengan kupon ${kode}.`,
          },
        });
      });
    } catch (e) {
      if (e instanceof KuponError) {
        catatGagalKupon(peserta.id);
        return fail(e.message);
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        return fail("Akun Anda sudah pernah memakai kupon.", 409);
      throw e;
    }

    resetGagalKupon(peserta.id);
    return NextResponse.json({ success: true, message: "Kupon berhasil dipakai. Akun Anda aktif." });
  } catch (e) {
    console.error("POST /api/pembayaran/kupon error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
