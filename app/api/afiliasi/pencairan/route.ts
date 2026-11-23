import { NextRequest, NextResponse } from "next/server";
import { requireAfiliasi } from "@/lib/guard";
import prisma from "@/lib/db";
import { getAfiliasiSettings } from "@/lib/afiliasi";
import { affiliatePencairanSchema } from "@/lib/validations";
import {
  notifyPencairanDiajukan,
} from "@/lib/email";
import { notifyPencairanAfiliasi } from "@/lib/wa-notif";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Ajukan pencairan seluruh saldo komisi yang tersedia. */
export async function POST(req: NextRequest) {
  try {
    const afiliasi = await requireAfiliasi();
    if (!afiliasi) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const result = affiliatePencairanSchema.safeParse(body ?? {});
    if (!result.success) return fail("Konfirmasi pencairan wajib dicentang.");

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: afiliasi.id },
      select: {
        nama: true,
        email: true,
        whatsapp: true,
        bankNama: true,
        bankNo: true,
        bankAtasNama: true,
      },
    });
    if (!affiliate) return fail("Data affiliate tidak ditemukan.", 404);
    if (!affiliate.bankNama || !affiliate.bankNo || !affiliate.bankAtasNama) {
      return fail("Lengkapi rekening bank terlebih dahulu.");
    }

    const menunggu = await prisma.payout.findFirst({
      where: { affiliateId: afiliasi.id, status: "menunggu" },
      select: { id: true },
    });
    if (menunggu) {
      return fail("Masih ada pengajuan pencairan yang diproses admin.", 409);
    }

    const [agg, settings] = await Promise.all([
      prisma.komisi.aggregate({
        where: { affiliateId: afiliasi.id, status: "tersedia" },
        _sum: { jumlah: true },
      }),
      getAfiliasiSettings(),
    ]);
    const saldo = agg._sum.jumlah ?? 0;
    if (saldo <= 0) return fail("Tidak ada saldo yang bisa dicairkan.");
    if (saldo < settings.minimalPencairan) {
      return fail(
        `Saldo minimal pencairan ${new Intl.NumberFormat("id-ID").format(settings.minimalPencairan)} rupiah.`
      );
    }

    const payout = await prisma.$transaction(async (tx) => {
      const row = await tx.payout.create({
        data: {
          affiliateId: afiliasi.id,
          jumlah: saldo,
          bankNama: affiliate.bankNama,
          bankNo: affiliate.bankNo,
          bankAtasNama: affiliate.bankAtasNama,
          status: "menunggu",
        },
      });
      await tx.komisi.updateMany({
        where: { affiliateId: afiliasi.id, status: "tersedia" },
        data: { status: "diproses", payoutId: row.id },
      });
      return row;
    });

    void notifyPencairanDiajukan({
      nama: affiliate.nama,
      email: affiliate.email,
      jumlah: saldo,
      bankNama: affiliate.bankNama,
      bankNo: affiliate.bankNo,
    });
    void notifyPencairanAfiliasi({
      nama: affiliate.nama,
      whatsapp: affiliate.whatsapp,
      jumlah: saldo,
    });

    return NextResponse.json(
      { success: true, data: { id: payout.id, jumlah: payout.jumlah } },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/afiliasi/pencairan error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
