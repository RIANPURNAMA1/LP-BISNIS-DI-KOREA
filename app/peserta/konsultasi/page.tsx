import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Headphones } from "lucide-react";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import { getGrupKonsultasi } from "@/lib/grup";
import { getRekening } from "@/lib/pembayaran";
import LogoutButton from "../LogoutButton";
import CheckoutKonsultasi from "./CheckoutKonsultasi";

export const dynamic = "force-dynamic";

export default async function KonsultasiOnlinePage() {
  const peserta = await requirePesertaAktif();
  if (!peserta) redirect("/pembayaran");

  const [p, terakhir, rekening, grupKonsultasi] = await Promise.all([
    prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { nama: true, whatsapp: true, email: true, videoSelesaiAt: true, konsultasiAt: true },
    }),
    prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: peserta.id },
      orderBy: { id: "desc" },
    }),
    getRekening(),
    getGrupKonsultasi(),
  ]);
  if (!p) redirect("/login");

  return (
    <div className="min-h-screen bg-[#EEF1F8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-slate-900">Indonesia-Korea Business Project</p>
            <p className="truncate text-xs text-slate-500">{p.nama}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
        <Link
          href="/peserta"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#0052A4]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
        </Link>

        <section className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
              Konsultasi Online
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Sesi konsultasi bersama mentor setelah program. Biaya layanan Rp49.000.
            </p>
          </div>
        </section>

        <CheckoutKonsultasi
          grupKonsultasi={grupKonsultasi}
          profil={{ nama: p.nama, whatsapp: p.whatsapp, email: p.email }}
          videoSelesai={!!p.videoSelesaiAt}
          konsultasiSelesai={!!p.konsultasiAt}
          rekening={rekening}
          pembayaran={
            terakhir
              ? {
                  id: terakhir.id,
                  metode: terakhir.metode,
                  namaChannel: terakhir.namaChannel,
                  namaPengirim: terakhir.namaPengirim,
                  buktiBayar: terakhir.buktiBayar,
                  jumlah: terakhir.jumlah,
                  status: terakhir.status,
                  catatanAdmin: terakhir.catatanAdmin,
                  createdAt: terakhir.createdAt.toISOString(),
                  verifiedAt: terakhir.verifiedAt?.toISOString() ?? null,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
