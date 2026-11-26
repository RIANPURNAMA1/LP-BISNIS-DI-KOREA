"use client";

import { Moon, Sun } from "lucide-react";

/** Ganti tema terang/gelap. Ikon mengikuti kelas `dark` pada #peserta-root lewat CSS. */
export default function ThemeToggle() {
  function ganti() {
    const root = document.getElementById("peserta-root");
    if (!root) return;
    const gelap = root.classList.toggle("dark");
    try {
      document.cookie = `peserta-tema=${gelap ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* cookie tidak tersedia: tema tetap berubah untuk sesi ini */
    }
  }

  return (
    <button
      type="button"
      onClick={ganti}
      aria-label="Ganti tema terang/gelap"
      title="Ganti tema"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
