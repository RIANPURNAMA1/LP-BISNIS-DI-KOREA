import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import { getRekening } from "@/lib/pembayaran";
import { getGrupUmum } from "@/lib/grup";
import PembayaranPeserta from "./PembayaranPeserta";

export const metadata: Metadata = {
  title: "Aktivasi Akun — Pembayaran",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function PembayaranPage() {
  const peserta = await requirePeserta();
  if (!peserta) redirect("/login");

  const [p, terakhir, rekening, grupUmum] = await Promise.all([
    prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { nama: true, whatsapp: true, email: true, aksesAktifAt: true },
    }),
    prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: peserta.id },
      orderBy: { id: "desc" },
    }),
    getRekening(),
    getGrupUmum(),
  ]);

  if (!p) redirect("/login");
  // Sudah lunas: tidak perlu melihat halaman gerbang lagi.
  if (p.aksesAktifAt) redirect("/peserta");

  return (
    <PembayaranPeserta
      nama={p.nama}
      whatsapp={p.whatsapp}
      email={p.email}
      rekening={rekening}
      grupUmum={grupUmum}
      pembayaran={
        terakhir
          ? {
              id: terakhir.id,
              status: terakhir.status,
              catatanAdmin: terakhir.catatanAdmin,
              namaChannel: terakhir.namaChannel,
              namaPengirim: terakhir.namaPengirim,
              buktiBayar: terakhir.buktiBayar,
              jumlah: terakhir.jumlah,
              createdAt: terakhir.createdAt.toISOString(),
              verifiedAt: terakhir.verifiedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
