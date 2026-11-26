"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { UserCog, X } from "lucide-react";

const input =
  "mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function ProfilButton({
  nama: namaAwal,
  whatsapp: waAwal,
  email,
}: {
  nama: string;
  whatsapp: string;
  email: string;
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState(namaAwal);
  const [whatsapp, setWhatsapp] = useState(waAwal);
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [lihat, setLihat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");

  function tutup() {
    setBuka(false);
    setError("");
    setSukses("");
    setPasswordLama("");
    setPasswordBaru("");
    setKonfirmasi("");
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");
    if (passwordBaru && passwordBaru !== konfirmasi) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/peserta/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, whatsapp, passwordLama, passwordBaru }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Gagal menyimpan. Coba lagi.");
        return;
      }
      setSukses(json.passwordDiganti ? "Profil dan password berhasil diubah." : "Profil berhasil disimpan.");
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setBuka(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[#0052A4]/30 hover:bg-slate-50 hover:text-[#0052A4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <UserCog className="h-4 w-4" /> Ubah profil &amp; password
      </button>

      {buka && createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
          onClick={tutup}
        >
          <form
            onSubmit={simpan}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md bg-white p-5 shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Ubah Profil</h2>
              <button type="button" onClick={tutup} aria-label="Tutup" className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Nama
                <input className={input} value={nama} onChange={(e) => setNama(e.target.value)} required />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Nomor WhatsApp
                <input className={input} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </label>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Email (untuk login, tidak bisa diubah)
                <input className={`${input} opacity-60`} value={email} disabled />
              </label>

              <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Ganti password (opsional)</p>
                <label className="mt-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Password lama <span className="font-normal text-slate-400">(wajib jika ganti password)</span>
                  <input
                    className={input}
                    type={lihat ? "text" : "password"}
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    required={!!passwordBaru}
                    autoComplete="current-password"
                  />
                </label>
                <a
                  href="/lupa-password"
                  className="mt-1 inline-block text-xs font-medium text-[#0052A4] hover:underline"
                >
                  Lupa password lama? Reset lewat email
                </a>
                <label className="mt-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Password baru
                  <input
                    className={input}
                    type={lihat ? "text" : "password"}
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                  />
                </label>
                <label className="mt-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Ulangi password baru
                  <input
                    className={input}
                    type={lihat ? "text" : "password"}
                    value={konfirmasi}
                    onChange={(e) => setKonfirmasi(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={lihat} onChange={(e) => setLihat(e.target.checked)} />
                  Tampilkan password
                </label>
              </div>
            </div>

            {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            {sukses && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{sukses}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={tutup}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#0052A4] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
