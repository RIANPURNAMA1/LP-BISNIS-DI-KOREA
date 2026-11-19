import { auth } from "@/lib/auth";
import { getKontenPeserta, toEmbedUrl } from "@/lib/jadwal";
import JadwalSesi from "./JadwalSesi";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function PesertaPage() {
  // Akses sudah dijaga middleware; sesi dipakai untuk menyapa peserta.
  const session = await auth();
  const nama = session?.user?.name || "Peserta";
  const konten = await getKontenPeserta();
  const embed = konten.videoUrl ? toEmbedUrl(konten.videoUrl) : "";

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
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Selamat datang, {nama}!
          </h1>
          <p className="mt-2 text-[15px] leading-7 text-slate-600">{konten.arahan}</p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          {embed ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={embed}
                title="Video pengarahan"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="grid aspect-video place-items-center bg-slate-100 px-6 text-center text-sm text-slate-500">
              Video belum tersedia. Silakan cek kembali nanti.
            </div>
          )}
        </section>

        <JadwalSesi />
      </main>
    </div>
  );
}
