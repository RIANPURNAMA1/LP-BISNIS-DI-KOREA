"use client";

import { useHeroVideo } from "@/hooks/useHeroVideo";

const facts = [
  { value: "120+", label: "Pemimpin korporasi" },
  { value: "3", label: "Ruang seminar paralel" },
  { value: "40 mnt", label: "Janji temu B2B per meja" },
];

export default function Hero() {
  const { heroRef, videoRef } = useHeroVideo();

  return (
    <header
      id="hero"
      ref={heroRef}
      className="hero-screen relative flex flex-col overflow-hidden text-white pb-12 sm:pb-32"
    >
      {/* Layer video parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero-video absolute left-0 w-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero.png"
        >
          <source src="/hero_vid.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 z-0 hero-bg" aria-hidden="true" />

      <div
        id="beranda"
        className="relative z-10 my-auto w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36 pb-6"
      >
        <p className="fade-up flex items-center gap-3 text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-white/80 mb-5 sm:mb-6">
          <span className="block w-8 h-px bg-white/60" />
          Forum Bilateral 2025
        </p>

        <h1 className="fade-up d1 text-3xl leading-[1.15] sm:text-5xl lg:text-6xl font-bold sm:leading-[1.1] max-w-3xl tracking-tight text-white">
          Ingin Punya Bisnis Sendiri di{" "}
          <span className="bg-gradient-to-r from-white via-white to-[#FB3F11] bg-clip-text text-transparent">
            Korea Selatan?
          </span>
        </h1>

        <p className="fade-up d2 mt-5 sm:mt-6 text-sm sm:text-base leading-6 sm:leading-8 text-white/80 max-w-xl">
          Jangan hanya bekerja dan mencari penghasilan di Korea. Saatnya mulai
          membangun bisnis dan masa depan Anda sebagai entrepreneur! Ikuti
          Program Inkubasi Bisnis Startup untuk mengenali peluang, mengembangkan
          ide bisnis, hingga mempersiapkan pendirian perusahaan di Korea
          Selatan.
        </p>

        <div className="fade-up d3 mt-8 sm:mt-9">
          <a
            href="/daftar"
            className="group flex w-full items-center justify-between gap-3 rounded-full bg-[#FB3F11] pl-5 pr-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d6350f] focus-ring sm:inline-flex sm:w-auto sm:justify-start sm:pl-7 sm:pr-2.5 sm:py-2.5 sm:text-sm"
          >
            DAFTAR PROGRAM SEKARANG
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0052A4] text-white transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        {/* Fakta singkat: teks biasa dengan garis tipis, tanpa card */}
        <dl className="fade-up d4 mt-10 sm:mt-14 pt-6 border-t border-white/25 grid grid-cols-3 gap-3 sm:gap-6 max-w-xl">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col">
              <dt className="text-[11px] leading-4 text-white/65 order-2 sm:text-xs">
                {f.label}
              </dt>
              <dd className="text-lg sm:text-2xl font-semibold tracking-tight mb-1">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
