"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import AuthShell, { authButton, authInput } from "@/components/AuthShell";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/lupa-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal memproses permintaan. Coba lagi.");
        return;
      }
      setTerkirim(true);
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Lupa password"
      description="Masukkan email akun Anda. Kami kirim tautan untuk membuat password baru."
    >
      {terkirim ? (
        <div className="mt-5 space-y-4">
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Jika <b className="break-all">{email}</b> terdaftar, tautan atur ulang password sudah
              kami kirim. Cek kotak masuk dan folder spam. Tautan berlaku 60 menit.
            </span>
          </div>
          <p className="text-xs text-gray-800">
            <Link href="/login" className="font-medium hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </div>
      ) : (
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
            <label htmlFor="email" className="block text-xs font-medium text-gray-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className={authInput}
            />
          </div>
          <button type="submit" disabled={loading || !email.trim()} className={authButton}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Kirim tautan reset
          </button>
          <p className="text-xs text-gray-800">
            <Link href="/login" className="font-medium hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
