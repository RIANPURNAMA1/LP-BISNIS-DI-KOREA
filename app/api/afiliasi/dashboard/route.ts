import { NextResponse } from "next/server";
import { requireAfiliasi } from "@/lib/guard";
import prisma from "@/lib/db";
import { getAfiliasiSettings, linkAfiliasi } from "@/lib/afiliasi";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Ringkasan affiliate yang sedang login: kode, saldo, referral, komisi, pencairan. */
export async function GET() {
  try {
    const afiliasi = await requireAfiliasi();
    if (!afiliasi) return fail("Tidak terautentikasi.", 401);

    const [affiliate, referrals, komisi, payouts, settings] = await Promise.all([
      prisma.affiliate.findUnique({
        where: { id: afiliasi.id },
        select: {
          id: true,
          nama: true,
          email: true,
          whatsapp: true,
          kode: true,
          bankNama: true,
          bankNo: true,
          bankAtasNama: true,
          createdAt: true,
        },
      }),
      prisma.referral.findMany({
        where: { affiliateId: afiliasi.id },
        orderBy: { id: "desc" },
        select: {
          id: true,
          kode: true,
          status: true,
          createdAt: true,
          pendaftaran: {
            select: { nama: true, email: true, aksesAktifAt: true },
          },
        },
      }),
      prisma.komisi.findMany({
        where: { affiliateId: afiliasi.id },
        orderBy: { id: "desc" },
        select: {
          id: true,
          jumlah: true,
          status: true,
          keterangan: true,
          createdAt: true,
          referral: { select: { pendaftaran: { select: { nama: true } } } },
        },
      }),
      prisma.payout.findMany({
        where: { affiliateId: afiliasi.id },
        orderBy: { id: "desc" },
      }),
      getAfiliasiSettings(),
    ]);
    if (!affiliate) return fail("Data affiliate tidak ditemukan.", 404);

    const saldo = komisi
      .filter((k) => k.status === "tersedia")
      .reduce((sum, k) => sum + k.jumlah, 0);
    const totalKomisi = komisi
      .filter((k) => k.status !== "dibatalkan")
      .reduce((sum, k) => sum + k.jumlah, 0);
    const adaPencairanAktif = payouts.some((p) => p.status === "menunggu");

    return NextResponse.json({
      success: true,
      data: {
        profil: affiliate,
        kode: affiliate.kode,
        link: linkAfiliasi(affiliate.kode),
        saldo,
        totalKomisi,
        minimalPencairan: settings.minimalPencairan,
        bisaCairkan:
          saldo >= settings.minimalPencairan &&
          saldo > 0 &&
          !adaPencairanAktif &&
          !!affiliate.bankNama &&
          !!affiliate.bankNo &&
          !!affiliate.bankAtasNama,
        adaPencairanAktif,
        statistik: {
          referral: referrals.length,
          terverifikasi: referrals.filter((r) => r.status === "terverifikasi").length,
          komisi: komisi.length,
          pencairan: payouts.length,
        },
        referrals,
        komisi,
        payouts,
      },
    });
  } catch (e) {
    console.error("GET /api/afiliasi/dashboard error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
