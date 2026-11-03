"use client";

import { useEffect, useState } from "react";

const menu = [
  { id: "beranda", label: "Beranda" },
  { id: "sesi", label: "Sesi Bisnis" },
  { id: "jadwal", label: "Jadwal" },
  { id: "kontak", label: "Kontak" },
];

const LOGO_LIGHT = "/logo2.png"; // di atas hero (navbar transparan)
const LOGO_DARK = "/logo.avif"; // saat navbar putih (scroll / menu terbuka)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("beranda");

  // Navbar "solid" (putih) saat di-scroll atau saat menu mobile terbuka
  const solid = scrolled || open;

  // Preload logo versi navbar putih agar pergantian tidak berkedip
  useEffect(() => {
    const img = new Image();
    img.src = LOGO_DARK;
  }, []);

  // Efek saat scroll: navbar jadi menyusut
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu aktif mengikuti section yang sedang terlihat
  useEffect(() => {
    const els = menu
      .map((m) => document.getElementById(m.id))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Kunci scroll body saat menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav
      aria-label="Navigasi utama"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-gray-200/70 bg-white/90 py-3 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-6"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 transition-colors duration-300 sm:px-6 lg:px-8 ${
          solid ? "text-deep" : "text-white"
        }`}
      >
        <a
          href="#beranda"
          className="flex items-center rounded-md focus-ring"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={solid ? LOGO_DARK : LOGO_LIGHT}
            alt="Indonesia-Korea Business Project"
            className={`transition-all duration-300 ${
              scrolled ? "h-8" : "h-10"
            }`}
          />
        </a>

        {/* Menu desktop */}
        <ul
          className={`hidden items-center gap-1 rounded-full p-1 text-sm font-medium transition-colors duration-300 md:flex ${
            solid
              ? "bg-gray-100"
              : "border border-white/15 bg-white/10 backdrop-blur"
          }`}
        >
          {menu.map((m) => {
            const isActive = active === m.id;
            return (
              <li key={m.id}>
                <a
                  href={`#${m.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-full px-5 py-2 transition-colors focus-ring ${
                    isActive
                      ? solid
                        ? "bg-deep font-semibold text-white"
                        : "bg-white font-semibold text-deep"
                      : solid
                        ? "text-gray-600 hover:bg-white hover:text-deep"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {m.label}
                </a>
              </li>
            );
          })}
        </ul>

        <a
          href="#kontak"
          className={`hidden rounded-full px-6 py-2.5 text-sm font-semibold transition-colors focus-ring md:inline-block ${
            solid
              ? "bg-deep text-white hover:bg-ocean"
              : "bg-white text-deep hover:bg-soft"
          }`}
        >
          Daftar Program
        </a>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`grid h-11 w-11 place-items-center rounded-full border transition-colors focus-ring md:hidden ${
            solid
              ? "border-gray-200 bg-gray-100 text-deep"
              : "border-white/20 bg-white/15 text-white"
          }`}
          aria-controls="menu-mobile"
          aria-expanded={open}
        >
          <span className="sr-only">{open ? "Tutup menu" : "Buka menu"}</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="menu-mobile"
        className={`grid transition-all duration-300 md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-4 sm:px-6">
            <ul className="flex flex-col gap-1 text-base font-medium">
              {menu.map((m) => (
                <li key={m.id}>
                  <a
                    href={`#${m.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === m.id ? "page" : undefined}
                    className={`block rounded-full px-5 py-3 transition-colors ${
                      active === m.id
                        ? "bg-deep font-semibold text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {m.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#kontak"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-deep px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-ocean"
            >
Daftar Program
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}