import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  // Middleware hanya mengecek role. Peserta yang belum membayar boleh masuk ke
  // ruang member untuk melihat kartu aktivasi; kontennya tetap dikunci di page.
  const peserta = await requirePeserta();
  if (!peserta) redirect("/login");

  return <>{children}</>;
}
