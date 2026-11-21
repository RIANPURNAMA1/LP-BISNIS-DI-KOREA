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
  const nama = session?.user?.name || "Peserta";
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
  const konsultasiSelesai = !!p?.konsultasiAt;
  const grupUmum = await getGrupUmum();
  const statusPembayaran = pembayaran?.status ?? "";
  // Grup berbayar hanya boleh muncul setelah pembayaran benar-benar dikonfirmasi
  // DAN akses member aktif. Status "menunggu" tidak lagi membuka fitur ini.
  const bolehGrupKonsultasi =
    !!p?.aksesAktifAt && statusPembayaran === "dikonfirmasi";

  return (
    <div className="min-h-screen bg-[#EEF1F8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-slate-900">Indonesia-Korea Business Project</p>
            <p className="truncate text-xs text-slate-500">{nama}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
        <section className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0052A4] text-sm font-bold text-white">
            4
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
              Selamat datang di Ruang Member Bisnis di Korea
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-[15px]">
              Wajib tonton dan bereskan video ini dulu, sebelum melanjutkan.
            </p>
            {konten.arahan && konten.arahan !== DEFAULT_ARAHAN && (
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{konten.arahan}</p>
            )}
          </div>
        </section>

        <PesertaFlow
          videoUrl={konten.videoUrl}
          videoSelesai={!!p?.videoSelesaiAt}
          konsultasiSelesai={konsultasiSelesai}
          grupUmum={grupUmum}
          grupKonsultasi={grupKonsultasi}
          bolehGrupKonsultasi={bolehGrupKonsultasi}
          statusPembayaran={statusPembayaran}
        />
      </main>
    </div>
  );
}
