"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, ArrowLeft, Gift, Loader2, LogIn } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("afiliasi", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Email atau password salah. Periksa kembali akun affiliate Anda.");
        return;
      }
      const callback = params.get("callbackUrl");
      router.replace(callback && callback.startsWith("/afiliasi") ? callback : "/afiliasi/dashboard");
      router.refresh();
    } catch {
      setError("Login gagal. Periksa koneksi Anda lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF1F8] px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0052A4]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="flex items-center gap-3 bg-[#0052A4] px-6 py-6 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                Program Affiliate
              </p>
              <h1 className="text-lg font-bold">Login Affiliate</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-7">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="af-login-email">
                Email
              </label>
              <input
                id="af-login-email"
                type="email"
                autoComplete="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="af-login-pass">
                Password
              </label>
              <input
                id="af-login-pass"
                type="password"
                autoComplete="current-password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password affiliate"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Masuk..." : "Masuk ke Dashboard"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Belum menjadi affiliate?{" "}
              <Link href="/afiliasi" className="font-semibold text-[#0052A4]">
                Daftar gratis
              </Link>
            </p>
            <p className="text-center text-xs text-slate-400">
              Akun peserta dan affiliate terpisah. Gunakan email affiliate Anda di sini.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AfiliasiLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Memuat...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
