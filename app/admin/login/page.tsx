"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah.");
      } else {
        const callbackUrl = new URLSearchParams(window.location.search).get(
          "callbackUrl"
        );
        const destination =
          callbackUrl && callbackUrl.startsWith("/admin")
            ? callbackUrl
            : "/admin";
        router.push(destination);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Image
              src="/logo.avif"
              alt="Logo Indonesia-Korea Business Project"
              width={160}
              height={64}
              priority
              className="mx-auto h-14 w-auto object-contain"
            />
            <h1 className="mt-5 text-lg font-bold text-gray-900">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-500">
              Indonesia-Korea Business Project
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bisniskorea.com"
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0052A4] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}