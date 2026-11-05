"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { BadgeCheck, Quote } from "lucide-react";

/*
  GANTI kutipan, nama, dan keterangan dengan ucapan asli peserta.
  Semua testimoni bergiliran tampil di kartu besar.
*/
const photos = [
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Peserta yang lolos seleksi program startup",
    quote:
      "Dulu saya hanya berpikir untuk bekerja. Setelah ikut pendampingan, saya punya rencana bisnis yang jelas.",
    name: "Nama Peserta 1",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Mentornya benar-benar praktisi. Saya dibantu menyusun Business Model Canvas sampai siap dipresentasikan.",
    name: "Nama Peserta 2",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Saya tidak lagi bingung soal legalitas dan visa bisnis. Semua diarahkan tahap demi tahap.",
    name: "Nama Peserta 3",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Bukan sekadar teori. Saya langsung diarahkan menyiapkan rencana bisnis yang bisa dijalankan.",
    name: "Nama Peserta 4",
    note: "Lolos seleksi program startup",
  },
];

type Testimoni = (typeof photos)[number];

/* Durasi tiap testimoni tampil di kartu besar (detik) */
const DURASI = 7;

/* Kartu besar untuk testimoni yang sedang aktif */
function KartuUnggulan({ p }: { p: Testimoni }) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={p.src}
          alt={p.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <Quote aria-hidden className="h-8 w-8 text-ocean/30" strokeWidth={1.5} />
        <blockquote className="mt-3 text-balance text-lg font-semibold leading-snug tracking-tight text-deep sm:text-xl lg:text-2xl">
          “{p.quote}”
        </blockquote>

        <figcaption className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean/10 text-ocean">
            <BadgeCheck className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-deep sm:text-base">
              {p.name}
            </p>
            <p className="text-xs text-gray-600 sm:text-sm">{p.note}</p>
          </div>
        </figcaption>
      </div>
    </figure>
  );
}

/* Kartu ringkas: bisa diklik untuk dijadikan kartu besar */
function KartuRingkas({
  p,
  onPilih,
}: {
  p: Testimoni;
  onPilih: () => void;
}) {
  return (
    <div className="group relative">
      <figure className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 group-hover:border-ocean/40 sm:p-5">
        <img
          className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
          src={p.src}
          alt=""
          loading="lazy"
        />
        <div className="min-w-0">
          <blockquote className="text-sm leading-6 text-gray-600">
            “{p.quote}”
          </blockquote>
          <figcaption className="mt-3">
            <p className="text-sm font-bold text-deep">{p.name}</p>
            <p className="text-xs text-gray-500">{p.note}</p>
          </figcaption>
        </div>
      </figure>

      {/* Tombol transparan menutupi seluruh kartu */}
      <button
        type="button"
        onClick={onPilih}
        aria-label={`Tampilkan testimoni ${p.name}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2"
      />
    </div>
  );
}

export default function Testimoni() {
  const [aktif, setAktif] = useState(0);
  const n = photos.length;

  const berikutnya = () => setAktif((a) => (a + 1) % n);

  // Kartu kecil = sisanya, urut mulai dari setelah yang aktif (efek "berputar")
  const urutanKecil = Array.from({ length: n - 1 }, (_, k) => (aktif + 1 + k) % n);

  return (
    <section className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2">
      {/*
        Timer digerakkan oleh animasi progress itu sendiri (onAnimationEnd),
        jadi saat di-hover atau fokus keyboard, animasi dan rotasi berhenti bersama.
      */}
      <style>{`
        @keyframes testi-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes testi-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .testi-progress { animation: testi-progress ${DURASI}s linear forwards; }
        .testi-in { animation: testi-in 500ms ease-out both; }
        @media (hover: hover) {
          .testi-wrap:hover .testi-progress { animation-play-state: paused; }
        }
        .testi-wrap:has(:focus-visible) .testi-progress { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .testi-progress { animation: none; transform: none; }
          .testi-in { animation: none; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <ScrollReveal className="max-w-2xl">
          <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Mereka Sudah Memulai Langkahnya.{" "}
            <span className="text-ocean">Sekarang Giliran Anda!</span>
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Lihat pengalaman peserta yang telah mengikuti pendampingan dan
            berhasil melangkah menuju impian membangun bisnis di Korea.
          </p>
        </ScrollReveal>

        <div className="testi-wrap mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-12">
          {/* ============ KARTU BESAR (berganti otomatis) ============ */}
          <ScrollReveal delay={100} className="min-w-0 lg:col-span-7">
            {/*
              Semua kartu ditumpuk di satu sel grid supaya tinggi area selalu
              mengikuti kartu tertinggi → layout tidak melompat saat berganti.
            */}
            <div className="grid">
              {photos.map((p, i) => (
                <div
                  key={p.name}
                  aria-hidden={i !== aktif}
                  className={`col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500 ${
                    i === aktif ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <KartuUnggulan p={p} />
                </div>
              ))}
            </div>

            {/* Indikator: tiap segmen = 1 testimoni, segmen aktif terisi sebagai timer */}
            <div
              role="group"
              aria-label="Pilih testimoni"
              className="mt-3 flex gap-2"
            >
              {photos.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setAktif(i)}
                  aria-label={`Tampilkan testimoni ${i + 1} dari ${n}: ${p.name}`}
                  aria-current={i === aktif}
                  className="group flex-1 py-2 focus-visible:outline-none"
                >
                  <span className="relative block h-1.5 overflow-hidden rounded-full bg-gray-200 group-focus-visible:ring-2 group-focus-visible:ring-ocean group-focus-visible:ring-offset-2">
                    {i === aktif && (
                      <span
                        key={aktif}
                        className="testi-progress absolute inset-0 origin-left rounded-full bg-ocean"
                        onAnimationEnd={(e) => {
                          if (e.animationName === "testi-progress") berikutnya();
                        }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* ============ KARTU KECIL (berputar bersama) ============ */}
          <div className="grid min-w-0 content-start gap-4 sm:gap-5 lg:col-span-5">
            {urutanKecil.map((idx, pos) => (
              <div
                key={`${aktif}-${photos[idx].name}`}
                className="testi-in"
                style={{ animationDelay: `${pos * 70}ms` }}
              >
                <KartuRingkas p={photos[idx]} onPilih={() => setAktif(idx)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}