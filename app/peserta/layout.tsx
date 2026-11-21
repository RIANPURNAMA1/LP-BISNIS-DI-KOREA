import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePesertaAktif } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Halaman Peserta",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PesertaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware hanya mengecek role. Gerbang pembayaran ada di sini,
  // dengan pengecekan DB setiap request supaya status admin langsung berlaku.
  const peserta = await requirePesertaAktif();
  if (!peserta) redirect("/pembayaran");

  return <>{children}</>;
}
