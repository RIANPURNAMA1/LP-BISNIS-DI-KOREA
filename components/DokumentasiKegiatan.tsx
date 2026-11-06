"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

type Kategori = "Startup" | "Seminar";

type Foto = {
  id: string;
  label: Kategori;
  src: string;
  srcSet: string;
  alt: string;
};

/*
  Versi gambar sudah dioptimasi di /kegiatan/optimized:
  - 640w untuk thumbnail grid
  - 1280w untuk lightbox
  Ukuran asli (2-3 MB/foto) tidak dipakai lagi agar section cepat tampil.
*/
const gambar = (nama: string): Pick<Foto, "src" | "srcSet"> => ({
  src: `/kegiatan/optimized/${nama}-1280.jpg`,
  srcSet: `/kegiatan/optimized/${nama}-640.jpg 640w, /kegiatan/optimized/${nama}-1280.jpg 1280w`,
});

/*
  URUTAN PENTING: foto pertama tampil paling besar (featured).
  Taruh foto terbaik / paling "hidup" di paling atas.
*/
const semuaFoto: Foto[] = [
  {
    id: "startup-1",
    label: "Startup",
    ...gambar("startup-1"),
    alt: "Peserta program startup berfoto bersama mentor",
  },
  {
    id: "seminar-1",
    label: "Seminar",
    ...gambar("seminar-1"),
    alt: "Foto grup peserta seminar di auditorium",
  },
  {
    id: "seminar-2",
    label: "Seminar",
    ...gambar("seminar-2"),
    alt: "Sesi seminar di aula modern",
  },
  {
    id: "startup-2",
    label: "Startup",
    ...gambar("startup-2"),
    alt: "Kegiatan program startup",
  },
  {
    id: "startup-3",
    label: "Startup",
    ...gambar("startup-3"),
    alt: "Sesi pendampingan program startup",
  },
  {
    id: "seminar-3",
    label: "Seminar",
    ...gambar("seminar-3"),
    alt: "Seminar di ruang kreatif",
  },
  {
    id: "startup-4",
    label: "Startup",
    ...gambar("startup-4"),
    alt: "Peserta program startup berdiskusi",
  },
  {
    id: "seminar-4",
    label: "Seminar",
    ...gambar("seminar-4"),
    alt: "Swafoto peserta di restoran Korea",
  },
];

const filters = ["Semua", "Startup", "Seminar"] as const;
type Filter = (typeof filters)[number];

export default function DokumentasiKegiatan() {
  const [aktif, setAktif] = useState<Filter>("Semua");
  const [terbuka, setTerbuka] = useState<number | null>(null);
  const pemicu = useRef<HTMLElement | null>(null);
  const tombolTutup = useRef<HTMLButtonElement>(null);

  const daftar = useMemo(
    () =>
      aktif === "Semua"
        ? semuaFoto
        : semuaFoto.filter((f) => f.label === aktif),
    [aktif],
  );

  const buka = (i: number) => {
    pemicu.current = document.activeElement as HTMLElement;
    setTerbuka(i);
  };

  const tutup = useCallback(() => {
    setTerbuka(null);
    pemicu.current?.focus();
  }, []);

  const geser = useCallback(
    (arah: 1 | -1) =>
      setTerbuka((i) =>
        i === null ? i : (i + arah + daftar.length) % daftar.length,
      ),
    [daftar.length],
  );

  // Keyboard + kunci scroll saat lightbox terbuka
  useEffect(() => {
    if (terbuka === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
      if (e.key === "ArrowRight") geser(1);
      if (e.key === "ArrowLeft") geser(-1);
    };
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    tombolTutup.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowLama;
    };
  }, [terbuka, tutup, geser]);

  const total = daftar.length;
  const fotoAktif = terbuka !== null ? daftar[terbuka] : null;

  return (
    <ScrollReveal delay={120} className="min-w-0">
      {/* Header: judul + filter */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <h3 className="text-xl font-bold tracking-tight text-deep sm:text-2xl">
            Dokumentasi kegiatan
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">
            Momen nyata dari program startup dan seminar yang sudah berjalan.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Filter dokumentasi"
          className="inline-flex w-full rounded-full bg-gray-100 p-1 sm:w-auto"
        >
          {filters.map((f) => {
            const dipilih = aktif === f;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={dipilih}
                onClick={() => setAktif(f)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean sm:flex-none ${
                  dipilih
                    ? "bg-white text-deep shadow-sm"
                    : "text-gray-500 hover:text-deep"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/*
        Bento grid: foto pertama = besar (2x2).
        Jika jumlah foto genap, foto terakhir dilebarkan agar tidak ada lubang.
        key={aktif} -> grid dirender ulang saat filter berubah.
      */}
      <div
        key={aktif}
        className="grid auto-rows-[9rem] grid-flow-dense grid-cols-2 gap-2 sm:auto-rows-[12rem] sm:gap-3 lg:auto-rows-[14rem] lg:grid-cols-4 lg:gap-4"
      >
        {daftar.map((f, i) => {
          const besar = i === 0;
          const lebar = total % 2 === 0 && i === total - 1 && total > 1;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => buka(i)}
              aria-label={`Perbesar foto: ${f.alt}`}
              className={`group relative overflow-hidden rounded-2xl bg-gray-100 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2 ${
                besar ? "col-span-2 row-span-2" : lebar ? "col-span-2" : ""
              }`}
            >
              <img
                src={f.src}
                srcSet={f.srcSet}
                sizes={
                  besar
                    ? "(max-width: 1023px) 100vw, 50vw"
                    : "(max-width: 1023px) 50vw, 25vw"
                }
                alt={f.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
              />

              {/* Gradient bawah supaya label selalu terbaca */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent"
              />

              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white sm:text-sm">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${
                    f.label === "Startup" ? "bg-ocean" : "bg-white"
                  }`}
                />
                {f.label}
              </span>

              <span
                aria-hidden
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-deep opacity-0 shadow-sm motion-safe:transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {fotoAktif && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fotoAktif.alt}
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 sm:p-6"
          onClick={tutup}
        >
          <div className="flex items-center justify-between text-white">
            <p className="text-sm font-medium">
              <span className="text-white/60">{fotoAktif.label}</span>
              <span className="ml-3 tabular-nums text-white/60">
                {(terbuka ?? 0) + 1} / {total}
              </span>
            </p>
            <button
              ref={tombolTutup}
              type="button"
              onClick={tutup}
              aria-label="Tutup"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center py-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fotoAktif.src}
              srcSet={fotoAktif.srcSet}
              sizes="(max-width: 1023px) 100vw, 90vw"
              alt={fotoAktif.alt}
              decoding="async"
              className="max-h-full max-w-full rounded-xl object-contain"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => geser(-1)}
                  aria-label="Foto sebelumnya"
                  className="absolute left-0 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => geser(1)}
                  aria-label="Foto berikutnya"
                  className="absolute right-0 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          <p
            className="text-center text-sm text-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            {fotoAktif.alt}
          </p>
        </div>
      )}
    </ScrollReveal>
  );
}