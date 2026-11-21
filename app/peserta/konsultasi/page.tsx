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
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-[#0052A4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/3.webp" alt="" className="h-8 w-8 object-contain" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-slate-900">
                Indonesia-Korea Business Project
              </p>
              <p className="truncate text-sm text-slate-500">Ruang member</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href="/peserta"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#0052A4]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
        </Link>

        <div className="mb-8 mt-6 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#0052A4]/10 text-[#0052A4]">
            <Headphones className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Konsultasi Online
            </h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Sesi konsultasi bersama mentor setelah program. Biaya layanan Rp49.000.
            </p>
          </div>
        </div>

        <div className="max-w-3xl">
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
        </div>
      </main>
    </div>
  );
}
