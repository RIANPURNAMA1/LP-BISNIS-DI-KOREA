import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import {
  notifyKomisiDiperoleh,
  notifyPembayaranDikonfirmasi,
  notifyPembayaranDitolak,
} from "@/lib/email";
import { getAfiliasiSettings } from "@/lib/afiliasi";
import { notifyKomisiAfiliasi } from "@/lib/wa-notif";

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
    if (status === "ditolak" && !catatan)
      return fail("Catatan penolakan wajib diisi agar peserta bisa memperbaiki bukti.");

    const pembayaran = await prisma.pembayaranKonsultasi.findUnique({
      where: { id },
      include: { pendaftaran: { select: { nama: true, email: true } } },
    });
    if (!pembayaran) return fail("Data pembayaran tidak ditemukan.", 404);

    const statusSebelumnya = pembayaran.status;
    const verifiedAt = status === "dikonfirmasi" ? new Date() : null;

    // Atribusi affiliate (jika ada) dan nominal komisi diambil sebelum transaksi.
    const [referral, pengaturanAfiliasi] = await Promise.all([
      prisma.referral.findUnique({
        where: { pendaftaranId: pembayaran.pendaftaranId },
        include: {
          affiliate: {
            select: { id: true, nama: true, email: true, whatsapp: true, aktif: true },
          },
        },
      }),
      getAfiliasiSettings(),
    ]);
    const nominalKomisi = pengaturanAfiliasi.komisi;

    // Satu transaksi: pembayaran, akses member, atribusi, dan komisi konsisten.
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.pembayaranKonsultasi.update({
        where: { id },
        data: {
          status,
          verifiedAt,
          catatanAdmin: status === "ditolak" ? catatan : null,
        },
      });

      await tx.pendaftaran.update({
        where: { id: pembayaran.pendaftaranId },
        data:
          status === "dikonfirmasi"
            ? { aksesAktifAt: verifiedAt, konsultasiAt: verifiedAt }
            : { aksesAktifAt: null, konsultasiAt: null },
      });

      if (
        status === "dikonfirmasi" &&
        statusSebelumnya !== "dikonfirmasi" &&
        referral?.affiliate.aktif
      ) {
        await tx.referral.update({
          where: { id: referral.id },
          data: { status: "terverifikasi", pembayaranId: id },
        });
        // 1 pembayaran = 1 komisi (idempoten walau admin menekan verifikasi ulang).
        await tx.komisi.upsert({
          where: { pembayaranId: id },
          create: {
            affiliateId: referral.affiliateId,
            referralId: referral.id,
            pembayaranId: id,
            jumlah: nominalKomisi,
            status: "tersedia",
          },
          update: {
            jumlah: nominalKomisi,
            status: "tersedia",
            keterangan: null,
            payoutId: null,
          },
        });
      }

      if (status === "ditolak") {
        if (referral) {
          await tx.referral.updateMany({
            where: { id: referral.id, pembayaranId: id },
            data: { status: "terdaftar", pembayaranId: null },
          });
        }
        await tx.komisi.updateMany({
          where: { pembayaranId: id, status: "tersedia" },
          data: {
            status: "dibatalkan",
            keterangan: "Pembayaran ditolak admin",
          },
        });
      }

      return row;
    });

    const berubah = statusSebelumnya !== status;
    if (berubah && status === "dikonfirmasi") {
      await notifyPembayaranDikonfirmasi({
        nama: pembayaran.nama,
        email: pembayaran.email,
        metode: pembayaran.metode,
        namaChannel: pembayaran.namaChannel,
        namaPengirim: pembayaran.namaPengirim,
      });
      if (referral?.affiliate.aktif) {
        void notifyKomisiDiperoleh({
          nama: referral.affiliate.nama,
          email: referral.affiliate.email,
          whatsapp: referral.affiliate.whatsapp,
          jumlah: nominalKomisi,
          referralNama: pembayaran.nama,
        });
        void notifyKomisiAfiliasi({
          nama: referral.affiliate.nama,
          whatsapp: referral.affiliate.whatsapp,
          jumlah: nominalKomisi,
          referralNama: pembayaran.nama,
        });
      }
    }
    if (berubah && status === "ditolak") {
      await notifyPembayaranDitolak({
        nama: pembayaran.nama,
        email: pembayaran.email,
        catatan,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PUT /api/admin/pembayaran/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
