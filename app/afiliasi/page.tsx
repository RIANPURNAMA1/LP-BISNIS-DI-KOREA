"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Gift,
  Loader2,
  UserPlus,
} from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";

type Errors = Record<string, string>;
type Wilayah = { code: string; name: string };

/** Ambil daftar wilayah dari wilayah.id (lewat proxy /api/wilayah). */
function useWilayah(path: string | null) {
  const [list, setList] = useState<Wilayah[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!path) {
      setList([]);
      return;
    }
    let batal = false;
    setLoading(true);
    fetch(`/api/wilayah/${path}`)
      .then((r) => r.json())
      .then((json) => !batal && setList(json.data ?? []))
      .catch(() => !batal && setList([]))
      .finally(() => !batal && setLoading(false));
    return () => {
      batal = true;
    };
  }, [path]);
  return { list, loading };
}

const nama = (list: Wilayah[], code: string) => list.find((w) => w.code === code)?.name ?? "";

function WilayahSelect({
  id,
  label,
  value,
  onChange,
  list,
  loading,
  disabled,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  list: Wilayah[];
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        aria-invalid={!!error}
        className={`${inputCls} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
      >
        <option value="">{loading ? "Memuat…" : placeholder}</option>
        {list.map((w) => (
          <option key={w.code} value={w.code}>
            {w.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function DaftarAfiliasi() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "",
    email: "",
    whatsapp: "",
    password: "",
    konfirmasi: "",
    setuju: false,
    provinsiId: "",
    kabupatenId: "",
    kecamatanId: "",
    desaId: "",
  });
  const provinsi = useWilayah("provinces.json");
  const kabupaten = useWilayah(form.provinsiId ? `regencies/${form.provinsiId}.json` : null);
  const kecamatan = useWilayah(form.kabupatenId ? `districts/${form.kabupatenId}.json` : null);
  const desa = useWilayah(form.kecamatanId ? `villages/${form.kecamatanId}.json` : null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  /** Ganti pilihan wilayah; pilihan di bawahnya ikut direset. */
  function setWilayah(field: "provinsiId" | "kabupatenId" | "kecamatanId" | "desaId", value: string) {
    const urutan = ["provinsiId", "kabupatenId", "kecamatanId", "desaId"] as const;
    const idx = urutan.indexOf(field);
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      for (const f of urutan.slice(idx + 1)) next[f] = "";
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      for (const f of urutan.slice(idx)) next[f] = "";
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const err: Errors = {};
    if (!form.nama.trim()) err.nama = "Nama wajib diisi.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Email tidak valid.";
    if (!/^\+?[0-9][0-9\s-]{6,24}$/.test(form.whatsapp.trim()))
      err.whatsapp = "Nomor WhatsApp tidak valid.";
    if (!form.provinsiId) err.provinsiId = "Pilih provinsi.";
    if (!form.kabupatenId) err.kabupatenId = "Pilih kabupaten/kota.";
    if (!form.kecamatanId) err.kecamatanId = "Pilih kecamatan.";
    if (!form.desaId) err.desaId = "Pilih desa/kelurahan.";
    if (form.password.length < 8) err.password = "Password minimal 8 karakter.";
    if (form.password !== form.konfirmasi)
      err.konfirmasi = "Konfirmasi password tidak cocok.";
    if (!form.setuju) err.setuju = "Anda harus menyetujui ketentuan.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/afiliasi/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama.trim(),
          email: form.email.trim(),
          whatsapp: form.whatsapp.trim(),
          password: form.password,
          provinsi: nama(provinsi.list, form.provinsiId),
          kabupaten: nama(kabupaten.list, form.kabupatenId),
          kecamatan: nama(kecamatan.list, form.kecamatanId),
          desa: nama(desa.list, form.desaId),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.field && json.error) {
          setErrors({ [json.field]: json.error });
        } else if (json.errors) {
          setErrors(json.errors);
        } else {
          setSubmitError(json.error || "Pendaftaran affiliate gagal.");
        }
        return;
      }

      const login = await signIn("afiliasi", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login?callbackUrl=%2Fafiliasi%2Fdashboard");
        return;
      }
      router.replace("/afiliasi/dashboard");
      router.refresh();
    } catch {
      setSubmitError("Pendaftaran belum terkirim. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF1F8] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0052A4]"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="bg-[#0052A4] px-6 py-7 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
                <Gift className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                  Indonesia-Korea Business Project
                </p>
                <h1 className="mt-0.5 text-xl font-bold">Daftar sebagai Affiliate</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-blue-100">
              Bagikan link undangan dan pantau peserta yang Anda undang. Pendaftaran affiliate
              gratis dan langsung aktif.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-7 sm:px-8">
            <div>
              <label className={labelCls} htmlFor="af-nama">
                Nama lengkap
              </label>
              <input
                id="af-nama"
                className={inputCls}
                value={form.nama}
                onChange={(e) => set("nama", e.target.value)}
                placeholder="Nama Anda"
              />
              {errors.nama && <p className="mt-1 text-xs text-red-600">{errors.nama}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="af-email">
                  Email (untuk login)
                </label>
                <input
                  id="af-email"
                  type="email"
                  autoComplete="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="nama@email.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className={labelCls} htmlFor="af-wa">
                  Nomor WhatsApp
                </label>
                <input
                  id="af-wa"
                  className={inputCls}
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="0812 3456 7890"
                />
                {errors.whatsapp && (
                  <p className="mt-1 text-xs text-red-600">{errors.whatsapp}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <WilayahSelect
                id="af-provinsi"
                label="Provinsi"
                value={form.provinsiId}
                onChange={(v) => setWilayah("provinsiId", v)}
                list={provinsi.list}
                loading={provinsi.loading}
                disabled={false}
                placeholder="Pilih Provinsi"
                error={errors.provinsiId || errors.provinsi}
              />
              <WilayahSelect
                id="af-kabupaten"
                label="Kabupaten / Kota"
                value={form.kabupatenId}
                onChange={(v) => setWilayah("kabupatenId", v)}
                list={kabupaten.list}
                loading={kabupaten.loading}
                disabled={!form.provinsiId}
                placeholder="Pilih Kabupaten"
                error={errors.kabupatenId || errors.kabupaten}
              />
              <WilayahSelect
                id="af-kecamatan"
                label="Kecamatan"
                value={form.kecamatanId}
                onChange={(v) => setWilayah("kecamatanId", v)}
                list={kecamatan.list}
                loading={kecamatan.loading}
                disabled={!form.kabupatenId}
                placeholder="Pilih Kecamatan"
                error={errors.kecamatanId || errors.kecamatan}
              />
              <WilayahSelect
                id="af-desa"
                label="Desa / Kelurahan"
                value={form.desaId}
                onChange={(v) => setWilayah("desaId", v)}
                list={desa.list}
                loading={desa.loading}
                disabled={!form.kecamatanId}
                placeholder="Pilih Desa"
                error={errors.desaId || errors.desa}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="af-pass">
                  Password
                </label>
                <input
                  id="af-pass"
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Minimal 8 karakter"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label className={labelCls} htmlFor="af-pass2">
                  Ulangi password
                </label>
                <input
                  id="af-pass2"
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={form.konfirmasi}
                  onChange={(e) => set("konfirmasi", e.target.value)}
                  placeholder="Ulangi password"
                />
                {errors.konfirmasi && (
                  <p className="mt-1 text-xs text-red-600">{errors.konfirmasi}</p>
                )}
              </div>
            </div>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm leading-6 ${
                errors.setuju ? "border-red-400 bg-red-50/40" : "border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={form.setuju}
                onChange={(e) => set("setuju", e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#0052A4]"
              />
              <span className="text-slate-600">
                Saya menyetujui penggunaan data saya untuk program affiliate.
              </span>
            </label>
            {errors.setuju && <p className="-mt-2 text-xs text-red-600">{errors.setuju}</p>}

            {submitError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? "Mendaftarkan..." : "Daftar sebagai Affiliate"}
            </button>

            {errors.email?.includes("sudah terdaftar") && (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sudah punya akun?{" "}
                <Link href="/login?callbackUrl=%2Fafiliasi%2Fdashboard" className="font-semibold text-[#0052A4]">
                  Login di sini
                </Link>
              </p>
            )}
            {!errors.email && (
              <p className="text-center text-xs text-slate-500">
                Sudah terdaftar?{" "}
                <Link href="/login?callbackUrl=%2Fafiliasi%2Fdashboard" className="font-semibold text-[#0052A4]">
                  Login affiliate
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
