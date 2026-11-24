"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import AuthShell, { authButton, authInput } from "@/components/AuthShell";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"cek" | "valid" | "invalid" | "selesai">("cek");
  const [password, setPassword] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => !batal && setStatus(r.ok ? "valid" : "invalid"))
      .catch(() => !batal && setStatus("invalid"));
    return () => {
      batal = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== konfirmasi) return setError("Konfirmasi password tidak sama.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal mengatur password. Coba lagi.");
        return;
      }
      setStatus("selesai");
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "cek")
    return (
      <div className="grid h-24 place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );

  if (status === "invalid")
    return (
      <div className="mt-5 space-y-4">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Tautan tidak valid atau sudah kedaluwarsa.
        </div>
        <Link href="/lupa-password" className={authButton}>
          Minta tautan baru
        </Link>
      </div>
    );

  if (status === "selesai")
    return (
      <div className="mt-5 space-y-4">
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Password berhasil diubah. Silakan masuk dengan password baru.
        </div>
        <Link href="/login" className={authButton}>
          Masuk
        </Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-gray-800">
          Password baru
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInput}
        />
        <p className="mt-1 text-[11px] text-gray-500">Minimal 8 karakter.</p>
      </div>
      <div>
        <label htmlFor="konfirmasi" className="block text-xs font-medium text-gray-800">
          Ulangi password baru
        </label>
        <input
          id="konfirmasi"
          type="password"
          autoComplete="new-password"
          required
          value={konfirmasi}
          onChange={(e) => setKonfirmasi(e.target.value)}
          className={authInput}
        />
      </div>
      <button type="submit" disabled={loading} className={authButton}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan password baru
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Atur ulang password" description="Buat password baru untuk akun Anda.">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
