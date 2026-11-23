import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Halaman Peserta",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PesertaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware hanya mengecek role. Akses dicek ulang ke DB setiap request
  // supaya status admin langsung berlaku.
  const peserta = await requirePeserta();
  if (!peserta) redirect("/pembayaran");

  const [p, pembayaranTerakhir] = await Promise.all([
    prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { aksesAktifAt: true },
    }),
    prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: peserta.id },
      orderBy: { id: "desc" },
      select: { status: true },
    }),
  ]);

  // Dua kondisi yang boleh masuk:
  // 1. admin sudah verifikasi (akses penuh), atau
  // 2. bukti baru saja dikirim dan statusnya menunggu (akses terkunci).
  const bolehMasuk =
    !!p?.aksesAktifAt || pembayaranTerakhir?.status === "menunggu";
  if (!bolehMasuk) redirect("/pembayaran");

  return <>{children}</>;
}
