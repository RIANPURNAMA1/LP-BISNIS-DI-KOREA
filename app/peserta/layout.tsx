import type { Metadata } from "next";
import { cookies } from "next/headers";
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

  // Tema default terang; pilihan peserta disimpan di cookie agar server
  // langsung merender kelas yang benar (tanpa kedip saat dimuat).
  const gelap = cookies().get("peserta-tema")?.value === "dark";

  return (
    // Varian `dark:` Tailwind hanya berlaku untuk turunan dari `.dark`, bukan elemen
    // itu sendiri; karena itu latar dipasang di div dalam, bukan di #peserta-root.
    <div id="peserta-root" className={gelap ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]">
        {children}
      </div>
    </div>
  );
}
