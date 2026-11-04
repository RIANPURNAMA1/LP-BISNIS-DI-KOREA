"use client";

import { useEffect, useState } from "react";

const LOGO_LIGHT = "/logo2.png";
const LOGO_DARK = "/logo.avif";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const solid = scrolled;

  useEffect(() => {
    const img = new Image();
    img.src = LOGO_DARK;
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 animate-fade-down ${
        solid
          ? "border-b border-gray-200/70 bg-white/95 py-3 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-4 sm:py-6"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 transition-colors duration-300 sm:px-6 lg:px-8 ${
          solid ? "text-deep" : "text-white"
        }`}
      >
        {/* Logo */}
        <a
          href="#beranda"
          className="flex shrink-0 items-center rounded-md focus-ring z-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={solid ? LOGO_DARK : LOGO_LIGHT}
            alt="Indonesia-Korea Business Project"
            className={`w-auto max-w-[140px] object-contain transition-all duration-300 sm:max-w-none ${
              scrolled ? "h-7 sm:h-8" : "h-8 sm:h-10"
            }`}
          />
        </a>

        {/* Tagline di Tengah */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-sm font-semibold tracking-wide md:text-base opacity-95">
           Buka Peluang Bisnismu di Korea Sekarang!
          </p>
        </div>

        {/* CTA */}
        <a
          href="/daftar"
          className={`z-10 inline-block whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors focus-ring sm:px-6 sm:py-2.5 sm:text-sm ${
            solid
              ? "bg-deep text-white hover:bg-ocean"
              : "bg-white text-deep hover:bg-soft"
          }`}
        >
          Daftar Program
        </a>
      </div>
    </nav>
  );
}