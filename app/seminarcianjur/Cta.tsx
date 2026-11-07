"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Cta({ id }: { id?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-6 transition-all duration-500 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto w-full max-w-3xl">
        <Link
          id={id}
          href="/daftar"
          prefetch
          className="group relative block overflow-hidden rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 px-6 py-4 text-center text-base font-extrabold text-slate-900 shadow-lg shadow-amber-500/50 ring-1 ring-white/60 transition-transform duration-200 hover:scale-[1.02] active:scale-[.98]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
          <span className="relative">Daftar Sekarang : Isi Form »</span>
        </Link>
      </div>
    </div>
  );
}
