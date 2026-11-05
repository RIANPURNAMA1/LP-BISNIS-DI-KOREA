"use client";

import { useEffect, useState } from "react";

export default function WebsiteIntro() {
  const [show, setShow] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cek jika pengguna memilih prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }

    // Lock scroll saat animasi intro berlangsung
    document.body.style.overflow = "hidden";

    const startTime = performance.now();
    const duration = 1200; // 1.2 detik durasi intro yang pas dan elegan

    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Mulai transisi curtain exit
        setTimeout(() => {
          setIsExiting(true);
        }, 150);

        // Hapus elemen setelah curtain selesai membuka
        setTimeout(() => {
          setShow(false);
          document.body.style.overflow = "";
        }, 850);
      }
    };

    rafId = requestAnimationFrame(tick);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipIntro();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  const skipIntro = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, 400);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Animasi Pembuka Website"
      onClick={skipIntro}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] ${
        isExiting
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse 90% 80% at 50% 35%, #0e2b52 0%, #0c2342 50%, #061324 100%)",
      }}
    >
      {/* Decorative ambient glowing orbs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#0052A4]/25 blur-3xl animate-pulse"
        style={{ animationDuration: "3s" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#E3081C]/20 blur-3xl animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Konten Utama Intro */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-lg w-full">
        {/* Bilateral Flag Pill */}
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-md shadow-inner text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-white/90 animate-fade-down">
          <span className="flex items-center gap-1.5">
            <span className="text-sm">🇮🇩</span>
            <span className="text-white/70">IDN</span>
          </span>
          <span className="h-3 w-px bg-white/25" />
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E3081C] animate-ping" />
          <span className="text-[10px] tracking-wider text-sky-200">
            FORUM BILATERAL 2025
          </span>
          <span className="h-3 w-px bg-white/25" />
          <span className="flex items-center gap-1.5">
            <span className="text-white/70">KOR</span>
            <span className="text-sm">🇰🇷</span>
          </span>
        </div>

        {/* Logo Brand dengan Efek Cahaya */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-[#0052A4]/30 via-sky-400/20 to-[#E3081C]/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="Indonesia-Korea Business Project"
            className="relative h-12 sm:h-16 w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] transform transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Subtitle / Program Info */}
        <h2 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/85 mb-8 max-w-xs sm:max-w-md">
          Inkubasi Startup & Kemitraan Bisnis Korea Selatan
        </h2>

        {/* Progress Bar Mewah */}
        <div className="w-full max-w-xs sm:max-w-sm mb-4">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 p-[1px] backdrop-blur">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0052A4] via-[#3f7fb3] via-50% to-[#E3081C] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(227,8,28,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/60 font-medium">
            <span className="tracking-wide">
              {progress < 40
                ? "Menghubungkan Peluang..."
                : progress < 85
                ? "Mempersiapkan Forum..."
                : "Selamat Datang"}
            </span>
            <span className="tabular-nums font-semibold text-white/90">
              {progress}%
            </span>
          </div>
        </div>

        {/* Petunjuk Lewati */}
        <p className="text-[10px] sm:text-xs text-white/40 tracking-wider transition-opacity hover:text-white/70 mt-2">
          Klik di mana saja atau tekan <kbd className="rounded border border-white/20 bg-white/10 px-1 py-0.5 text-[10px] text-white/70">Esc</kbd> untuk lewati
        </p>
      </div>

      {/* Decorative Bottom Accents */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#0052A4] via-sky-400 to-[#E3081C] opacity-70" />
    </aside>
  );
}
