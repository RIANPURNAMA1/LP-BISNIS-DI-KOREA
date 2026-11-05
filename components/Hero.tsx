"use client";

import { ArrowRight } from "lucide-react";
import { useHeroVideo } from "@/hooks/useHeroVideo";

export default function Hero() {


  const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";
  const { heroRef } = useHeroVideo();

  return (
    <header
      id="hero"
      ref={heroRef}
      className="hero-screen relative flex flex-col overflow-hidden pb-12 text-white sm:pb-24"
    >
      {/* Layer gambar latar (parallax) */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/hero.png"
          alt=""
          className="hero-video absolute left-0 w-full object-cover animate-hero-zoom"
        />
      </div>
      <div className="hero-bg absolute inset-0 z-0" aria-hidden="true" />

      <div
        id="beranda"
        className="relative z-10 mx-auto my-auto w-full max-w-[1280px] px-4 pb-6 pt-28 sm:px-6 sm:pt-32 lg:px-8"
      >
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60 sm:text-sm">
          <span aria-hidden className="h-px w-8 bg-white/60" />
          Forum Bilateral 2026
        </p>
        <h1 className="fade-up max-w-3xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-5xl sm:leading-[1.1] lg:text-6xl">
          Ingin Punya Bisnis di{" "}
          <span className="bg-gradient-to-r from-white via-white to-[#E3081C] bg-clip-text text-transparent">
            Korea Selatan?
          </span>
        </h1>

        <p className="fade-up d1 mt-4 max-w-3xl text-lg font-semibold leading-7 text-white/85 sm:mt-5 sm:text-xl sm:leading-8">
          Ternyata Korea tak hanya bagus buat kuliah dan kerja. Banyak peluang
          bisnis di Korea!
        </p>

        <p className="fade-up d2 mt-5 max-w-xl text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-8">
          Ikuti Indonesia-Korea Business Project untuk mengenali peluang,
          mengembangkan ide bisnis, persiapkan pendirian perusahaan sampai
          pendampingan bisnis di Korea.
        </p>

        <div className="fade-up d3 mt-8 sm:mt-9">
          <a
            href="/daftar"
            className="group focus-ring inline-flex items-center gap-3 rounded-full bg-[#E3081C] py-2 pl-5 pr-2 text-xs font-semibold text-white transition-colors hover:bg-[#B30616] sm:py-2.5 sm:pl-7 sm:pr-2.5 sm:text-sm"
          >
            DAFTAR SEKARANG
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0052A4] transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
