"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { EVENT_OPTIONS } from "@/lib/event";

const TONE: Record<string, { pill: string; dot: string }> = {
  "": { pill: "bg-slate-100 text-slate-500 hover:bg-slate-200/70", dot: "bg-slate-400" },
  join: { pill: "bg-amber-50 text-amber-700 hover:bg-amber-100", dot: "bg-amber-500" },
  webinar: { pill: "bg-sky-50 text-sky-700 hover:bg-sky-100", dot: "bg-sky-500" },
  seminar: { pill: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100", dot: "bg-emerald-500" },
  keduanya: { pill: "bg-[#0052A4]/10 text-[#0052A4] hover:bg-[#0052A4]/15", dot: "bg-[#0052A4]" },
};

const MENU_W = 184;

/**
 * Dropdown status event bergaya tema (tanpa border bawaan browser).
 * Menu memakai posisi fixed supaya tidak terpotong area scroll tabel.
 */
export default function EventSelect({
  value,
  onChange,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  busy?: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const open = pos !== null;

  const tone = TONE[value] ?? TONE[""];
  const current = EVENT_OPTIONS.find((o) => o.value === value) ?? EVENT_OPTIONS[0];

  function toggle() {
    if (open) return setPos(null);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = EVENT_OPTIONS.length * 36 + 8;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - MENU_W - 8);
    if (window.innerHeight - r.bottom < menuH + 16) {
      setPos({ bottom: window.innerHeight - r.top + 6, left });
    } else {
      setPos({ top: r.bottom + 6, left });
    }
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2.5 pr-2 text-[11px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#0052A4]/30 disabled:opacity-60 ${tone.pill}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
        {current.label}
        <ChevronDown
          className={`h-3 w-3 shrink-0 opacity-60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          role="listbox"
          className="reveal fixed z-[70] rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200/70"
          style={{ ...pos, width: MENU_W, animationDuration: "0.18s" }}
        >
          {EVENT_OPTIONS.map((o) => {
            const selected = o.value === value;
            const t = TONE[o.value] ?? TONE[""];
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setPos(null);
                  if (!selected) onChange(o.value);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                  selected
                    ? "bg-slate-50 font-semibold text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
                <span className="flex-1 truncate">{o.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#0052A4]" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
