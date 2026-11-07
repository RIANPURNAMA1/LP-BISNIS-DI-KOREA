"use client";

import { useEffect, useState } from "react";

const LOGO = "/logo/3.webp";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = LOGO;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Navigasi utama"
      className={`fixed inset-x-0 top-0 z-50 animate-fade-down transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#0C2342] py-3 shadow-lg shadow-black/20"
          : "border-b border-transparent bg-transparent py-4 sm:py-6"
      }`}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 text-white sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#beranda"
          className="focus-ring z-10 flex shrink-0 items-center rounded-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
  src={LOGO}
  alt="Indonesia-Korea Business Project"
  className={`w-auto max-w-[240px] object-contain transition-all duration-300 sm:max-w-none ${
    scrolled ? "h-14 sm:h-16" : "h-16 sm:h-24"
  }`}
/>
        </a>

        {/* Tagline di tengah */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-sm font-semibold tracking-wide opacity-95 md:text-base">
            Buka Peluang Bisnismu di Korea Sekarang!
          </p>
        </div>

        {/* CTA */}
        <a
          href="/daftar"
          className={`focus-ring z-10 inline-block whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors sm:px-6 sm:py-2.5 sm:text-sm ${
            scrolled
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white text-[#0C2342] hover:bg-slate-100"
          }`}
        >
          Daftar Program
        </a>
      </div>
    </nav>
  );
}