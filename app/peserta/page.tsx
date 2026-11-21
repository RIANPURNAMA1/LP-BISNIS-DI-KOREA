import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGrupKonsultasi, getGrupUmum } from "@/lib/grup";
import { DEFAULT_ARAHAN, getKontenPeserta } from "@/lib/jadwal";
import PesertaFlow from "./PesertaFlow";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function PesertaPage() {
  // Akses penuh sudah dijaga layout /peserta (aksesAktifAt dari DB).
  // Sesi dipakai untuk menyapa peserta.
  const session = await auth();
  const id = parseInt((session?.user as { id?: string } | undefined)?.id ?? "", 10);
  const [konten, p, pembayaran, grupKonsultasi] = await Promise.all([
    getKontenPeserta(),
    prisma.pendaftaran.findUnique({
      where: { id },
      select: {
        nama: true,
        whatsapp: true,
        email: true,
        kabupaten: true,
        provinsi: true,
        status: true,
        ide: true,
        wilayah: true,
        aksesAktifAt: true,
        videoSelesaiAt: true,
        konsultasiAt: true,
      },
    }),
    prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: id },
      orderBy: { id: "desc" },
      select: { status: true },
    }),
    getGrupKonsultasi(),
  ]);
  const nama = p?.nama || session?.user?.name || "Peserta";
  const konsultasiSelesai = !!p?.konsultasiAt;
  const grupUmum = await getGrupUmum();
  const statusPembayaran = pembayaran?.status ?? "";
  // Grup berbayar hanya boleh muncul setelah pembayaran benar-benar dikonfirmasi
  // DAN akses member aktif. Status "menunggu" tidak lagi membuka fitur ini.
  const bolehGrupKonsultasi = !!p?.aksesAktifAt && statusPembayaran === "dikonfirmasi";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
        {/* Sapaan */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Halo, {nama}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Selamat datang di ruang member Bisnis di Korea.
          </p>
          {konten.arahan && konten.arahan !== DEFAULT_ARAHAN && (
            <div className="mt-5 border-l-2 border-[#0052A4] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-slate-900">Catatan dari admin</p>
              <p className="mt-0.5">{konten.arahan}</p>
            </div>
          )}
        </div>

        <PesertaFlow
          videoUrl={konten.videoUrl}
          videoSelesai={!!p?.videoSelesaiAt}
          konsultasiSelesai={konsultasiSelesai}
          grupUmum={grupUmum}
          grupKonsultasi={grupKonsultasi}
          bolehGrupKonsultasi={bolehGrupKonsultasi}
          statusPembayaran={statusPembayaran}
          nama={nama}
          kontak={{
            whatsapp: p?.whatsapp ?? "",
            email: p?.email ?? "",
            wilayah: p?.wilayah ?? "",
          }}
        />
      </main>
    </div>
  );
}