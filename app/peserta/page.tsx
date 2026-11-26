import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGrupKonsultasi, getGrupUmum } from "@/lib/grup";
import { DEFAULT_ARAHAN, getKontenPeserta } from "@/lib/jadwal";
import { getRekening, ringkasPembayaran } from "@/lib/pembayaran";
import PesertaFlow from "./PesertaFlow";
import StatusVerifikasi from "./StatusVerifikasi";
import KartuAktivasi from "./KartuAktivasi";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
export const dynamic = "force-dynamic";

export default async function PesertaPage() {
  // Gerbang akses dijaga layout /peserta. Sesi dipakai untuk menyapa peserta.
  const session = await auth();
  const id = parseInt((session?.user as { id?: string } | undefined)?.id ?? "", 10);
  const [konten, p, jadwalAktif, waitinglist, grupKonsultasi, pembayaranTerakhir, rekening] =
    await Promise.all([
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
          posisiKonsultasi: true,
        },
      }),
      prisma.jadwalSesi.findFirst({
        where: { pendaftaranId: id, status: { in: ["menunggu", "dikonfirmasi"] } },
        select: { id: true },
      }),
      prisma.waitinglist.findUnique({
        where: { pendaftaranId: id },
        select: { id: true },
      }),
      getGrupKonsultasi(),
      prisma.pembayaranKonsultasi.findFirst({
        where: { pendaftaranId: id },
        orderBy: { id: "desc" },
      }),
      getRekening(),
    ]);
  const nama = p?.nama || session?.user?.name || "Peserta";
  // Data lama mungkin punya konsultasiAt dari checkout Rp29.900: tanpa posisi,
  // peserta tetap harus mengisi konfirmasi posisi terlebih dahulu.
  const konsultasiSelesai = !!p?.konsultasiAt && !!p?.posisiKonsultasi;
  const jadwalSelesai = !!jadwalAktif || !!waitinglist;
  const grupUmum = await getGrupUmum();
  // Akses member sudah diverifikasi admin lewat aksesAktifAt (satu-satunya pembayaran).
  const aksesAktif = !!p?.aksesAktifAt;
  const statusBayar = pembayaranTerakhir?.status ?? "";
  // Bukti sudah dikirim tetapi belum disetujui: tampil card status, semua tetap terkunci.
  const menungguVerifikasi = !aksesAktif && statusBayar === "menunggu";
  // Belum bayar / bukti ditolak: tampil card aktivasi dengan popup pembayaran.
  const perluBayar = !aksesAktif && !menungguVerifikasi;
  const bolehGrupKonsultasi = aksesAktif;
  const pembayaranRingkas = ringkasPembayaran(pembayaranTerakhir);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/4-header.png"
              alt=""
              className="h-12 w-auto shrink-0 object-contain dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/3-header.png"
              alt=""
              className="hidden h-12 w-auto shrink-0 object-contain dark:block"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                Indonesia-Korea Business Project
              </p>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                Ruang member
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden lg:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-12 lg:pb-12">
        <PesertaFlow
          atas={
            <>
        {menungguVerifikasi && pembayaranTerakhir && (
          <StatusVerifikasi createdAt={pembayaranTerakhir.createdAt.toISOString()} />
        )}

        {perluBayar && p && (
          <KartuAktivasi
            nama={nama}
            whatsapp={p.whatsapp}
            email={p.email}
            rekening={rekening}
            grupUmum={grupUmum}
            pembayaran={pembayaranRingkas}
          />
        )}

        {/* Sapaan */}
        <section className="glow-border relative mb-6 overflow-hidden rounded-md bg-gradient-to-br from-[#0C2242] via-[#0A3D7A] to-[#0052A4] p-5 text-white shadow-xl shadow-[#0052A4]/20 ring-1 ring-white/10 sm:p-8 lg:mb-10">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white/15 text-lg sm:h-14 sm:w-14 sm:text-xl font-bold uppercase ring-1 ring-white/25 backdrop-blur">
              {nama.trim().charAt(0) || "P"}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/70">Selamat datang kembali</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{nama}</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/75">
                Ruang Member Bisnis di Korea. Selesaikan tiap langkah untuk memulai perjalanan
                bisnismu.
              </p>
            </div>
          </div>
          {konten.arahan && konten.arahan !== DEFAULT_ARAHAN && (
            <div className="relative mt-5 rounded-md bg-white/10 px-4 py-3 text-sm leading-6 ring-1 ring-white/15 backdrop-blur">
              <p className="font-semibold">Catatan dari admin</p>
              <p className="mt-0.5 text-white/85">{konten.arahan}</p>
            </div>
          )}
        </section>
            </>
          }
          videoUrl={konten.videoUrl}
          thumbnailUrl={konten.thumbnailUrl}
          videoSelesai={!!p?.videoSelesaiAt}
          konsultasiSelesai={konsultasiSelesai}
          posisi={p?.posisiKonsultasi ?? null}
          jadwalSelesai={jadwalSelesai}
          grupUmum={grupUmum}
          grupKonsultasi={grupKonsultasi}
          bolehGrupKonsultasi={bolehGrupKonsultasi}
          terkunci={!aksesAktif}
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