"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";

/** Reset password peserta oleh admin. Password baru hanya tampil sekali. */
export default function ResetPassword({ id }: { id: number }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function reset() {
    if (!confirm("Buat password baru untuk peserta ini? Password lama tidak berlaku lagi.")) return;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/pendaftaran/${id}/password`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error);
      setPassword(json.password);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Gagal membuat password.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      /* clipboard tidak tersedia; password tetap terlihat untuk disalin manual */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <button
        onClick={reset}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Reset password peserta
      </button>
      {password && (
        <span className="inline-flex items-center gap-2">
          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-slate-900">{password}</code>
          <button onClick={copy} aria-label="Salin password" className="text-slate-500 hover:text-slate-900">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <span className="text-xs text-slate-500">Catat sekarang, tidak ditampilkan lagi.</span>
        </span>
      )}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
