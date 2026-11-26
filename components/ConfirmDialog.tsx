"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, Loader2, ShieldCheck, ShieldOff, Trash2, type LucideIcon } from "lucide-react";

type Tone = "danger" | "success" | "warn";

const TONE: Record<
  Tone,
  { ring: string; icon: string; btn: string; head: LucideIcon; action: LucideIcon }
> = {
  danger: {
    ring: "bg-rose-50 ring-rose-50/60",
    icon: "text-rose-600",
    btn: "bg-rose-600 hover:bg-rose-700",
    head: AlertTriangle,
    action: Trash2,
  },
  success: {
    ring: "bg-emerald-50 ring-emerald-50/60",
    icon: "text-emerald-600",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    head: ShieldCheck,
    action: ShieldCheck,
  },
  warn: {
    ring: "bg-amber-50 ring-amber-50/60",
    icon: "text-amber-600",
    btn: "bg-amber-500 hover:bg-amber-600",
    head: ShieldOff,
    action: ShieldOff,
  },
};

/** Dialog konfirmasi bergaya admin, pengganti window.confirm untuk aksi berbahaya. */
export default function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel = "Hapus",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Kotak sorotan (mis. nama data yang akan dihapus). */
  detail?: ReactNode;
  confirmLabel?: string;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const t = TONE[tone];
  const Head = t.head;
  const Action = t.action;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
        <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ring-8 ${t.ring}`}>
          <Head className={`h-7 w-7 ${t.icon}`} />
        </span>
        <h3 id="confirm-title" className="mt-4 text-lg font-bold text-slate-900">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
        )}
        {detail && (
          <div className="mt-3 truncate rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
            {detail}
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${t.btn}`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Action className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
