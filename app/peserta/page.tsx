import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGrupKonsultasi, getGrupUmum } from "@/lib/grup";
import { DEFAULT_ARAHAN, getKontenPeserta } from "@/lib/jadwal";
import PesertaFlow from "./PesertaFlow";
import StatusVerifikasi from "./StatusVerifikasi";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function PesertaPage() {
  // Gerbang akses dijaga layout /peserta. Sesi dipakai untuk menyapa peserta.
  const session = await auth();
  const id = parseInt((session?.user as { id?: string } | undefined)?.id ?? "", 10);
  const [konten, p, jadwalAktif, waitinglist, grupKonsultasi, pembayaranTerakhir] =
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
        select: { status: true, createdAt: true },
      }),
    ]);
  const nama = p?.nama || session?.user?.name || "Peserta";
  // Data lama mungkin punya konsultasiAt dari checkout Rp49.000: tanpa posisi,
  // peserta tetap harus mengisi konfirmasi posisi terlebih dahulu.
  const konsultasiSelesai = !!p?.konsultasiAt && !!p?.posisiKonsultasi;
  const jadwalSelesai = !!jadwalAktif || !!waitinglist;
  const grupUmum = await getGrupUmum();
  // Akses member sudah diverifikasi admin lewat aksesAktifAt (satu-satunya pembayaran).
  const bolehGrupKonsultasi = !!p?.aksesAktifAt;
  // Bukti sudah dikirim tetapi belum disetujui: video & grup tetap tampil,
  // terkunci, dengan card status di paling atas.
  const menungguVerifikasi =
    !p?.aksesAktifAt && pembayaranTerakhir?.status === "menunggu";

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
        {menungguVerifikasi && pembayaranTerakhir && (
          <StatusVerifikasi createdAt={pembayaranTerakhir.createdAt.toISOString()} />
        )}

        {/* Sapaan */}
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Halo, {nama}
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Selamat datang di Ruang Member Bisnis di Korea.
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
          posisi={p?.posisiKonsultasi ?? null}
          jadwalSelesai={jadwalSelesai}
          grupUmum={grupUmum}
          grupKonsultasi={grupKonsultasi}
          bolehGrupKonsultasi={bolehGrupKonsultasi}
          terkunci={menungguVerifikasi}
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