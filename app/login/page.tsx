"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
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
      // Satu form untuk semua peran: admin, affiliate, dan peserta.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result?.ok || result.error) {
        setError("Email atau password salah.");
        return;
      }

      const rawCallback = new URLSearchParams(window.location.search).get("callbackUrl");
      // URL lama /afiliasi/login kini memakai /login, arahkan ke dashboard-nya.
      const callbackUrl =
        rawCallback && rawCallback.startsWith("/afiliasi/login")
          ? "/afiliasi/dashboard"
          : rawCallback;
      const session = await getSession();
      const user = session?.user as
        | { role?: string; aksesAktif?: boolean }
        | undefined;
      const role = user?.role;
      // Diambil dari JWT saat login; bukan satu-satunya otoritas akses.
      const aksesAktif = !!user?.aksesAktif;

      const prefix =
        role === "admin" ? "/admin" : role === "afiliasi" ? "/afiliasi" : "/peserta";
      // Peserta belum lunas => langsung ke gerbang pembayaran, bukan dashboard.
      const home =
        role === "admin"
          ? "/admin"
          : role === "afiliasi"
            ? "/afiliasi/dashboard"
            : aksesAktif
              ? "/peserta"
              : "/pembayaran";
      const callbackAllowed =
        callbackUrl &&
        callbackUrl.startsWith(prefix) &&
        (role === "admin" || role === "afiliasi" || aksesAktif);
      const destination = callbackAllowed ? callbackUrl : home;

      router.push(destination);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-1.5 h-10 w-full rounded-md border border-[#D9DFF3] bg-white px-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

  return (
    <main className="min-h-screen bg-[#EEF3FD] p-3 sm:p-8">
      <div className="relative flex min-h-[calc(100vh-1.5rem)] flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-b from-white via-[#F6F9FE] to-[#D9E4FA] shadow-sm ring-1 ring-[#DCE4F7] sm:min-h-[calc(100vh-4rem)]">
        {/* Latar pegunungan lembut */}
        <svg
          aria-hidden
          viewBox="0 0 1200 420"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 left-0 h-[45%] w-full"
        >
          <path
            d="M0 420V300L120 250L230 150L330 230L430 120L560 260L690 90L820 230L930 170L1060 260L1200 200V420Z"
            fill="#0052A4"
            fillOpacity="0.05"
          />
          <path
            d="M0 420V340L150 290L300 230L420 300L560 200L700 290L860 220L1000 300L1200 250V420Z"
            fill="#0052A4"
            fillOpacity="0.07"
          />
          <path
            d="M0 420V380L200 340L380 370L560 320L760 365L960 330L1200 370V420Z"
            fill="#0052A4"
            fillOpacity="0.08"
          />
        </svg>

        {/* Logo */}
        <header className="relative pt-10">
          <Link href="/" aria-label="Kembali ke beranda">
            <Image
              src="/logo/4.png"
              alt="Logo Indonesia-Korea Business Project"
              width={1079}
              height={1349}
              priority
              className="h-auto w-16"
            />
          </Link>
        </header>

        {/* Form */}
        <div className="relative flex w-full flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-[312px] rounded-md border border-[#D9DFF3] bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <h1 className="text-sm font-semibold text-gray-900">Masuk</h1>
            <p className="mt-0.5 text-xs leading-5 text-gray-500">
              Peserta, admin, dan affiliate masuk dengan email dan password terdaftar.
            </p>

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
                  className={input}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-800">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#1F6FC4] to-[#0052A4] text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052A4] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Masuk
              </button>
            </form>

            <div className="mt-5 space-y-2 text-xs text-gray-800">
              <p>
                <Link href="/daftar" className="font-medium hover:underline">
                  Buat akun peserta baru
                </Link>
              </p>
              <p>
                <Link href="/lupa-password" className="font-medium hover:underline">
                  Lupa password?
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative pb-8 text-xs text-gray-800">
          <span>© {new Date().getFullYear()} Indonesia-Korea Business Project</span>
          <span className="mx-3 text-gray-400">·</span>
          <Link href="/" className="hover:underline">
            Beranda
          </Link>
        </footer>
      </div>
    </main>
  );
}