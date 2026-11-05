"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Data & tipe                                                         */
/* ------------------------------------------------------------------ */

// Lewat proxy server sendiri (lihat wilayah-route.ts).
// Alternatif tanpa proxy: "https://emsifa.github.io/api-wilayah-indonesia/api"
const WILAYAH_API = "/api/wilayah";

type Region = { id: string; name: string };

export type RegistrationPayload = {
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  status: string;
  ide: string;
  cerita: string;
  tujuan: string[];
  sumber: string;
};

type FormState = {
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string; // id wilayah
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  status: string;
  statusLain: string;
  ide: string;
  cerita: string;
  tujuan: string[];
  tujuanLainOn: boolean;
  tujuanLain: string;
  sumber: string;
  setuju: boolean;
};

const initialForm: FormState = {
  nama: "",
  whatsapp: "",
  email: "",
  provinsi: "",
  kabupaten: "",
  kecamatan: "",
  desa: "",
  alamat: "",
  status: "",
  statusLain: "",
  ide: "",
  cerita: "",
  tujuan: [],
  tujuanLainOn: false,
  tujuanLain: "",
  sumber: "",
  setuju: false,
};

const STATUS = ["Karyawan", "Pelajar atau mahasiswa", "Pengusaha"];
const STATUS_LAIN = "__lain__";

const IDE = [
  "Sudah memiliki ide bisnis",
  "Sudah menjalankan bisnis",
  "Belum memiliki bisnis",
];

const TUJUAN = [
  "Mencari peluang bisnis di Korea",
  "Mengembangkan ide startup",
  "Mempersiapkan pendirian perusahaan",
  "Memahami legalitas dan visa bisnis",
  "Mendapatkan mentor dan jaringan bisnis",
];

const SUMBER = [
  "Instagram",
  "TikTok",
  "Facebook",
  "WhatsApp",
  "Teman atau keluarga",
  "Website",
  "Lainnya",
];

const STEPS = [
  { title: "Tahap 1 — Data Diri", short: "Data Diri" },
  { title: "Tahap 2 — Profil dan Kesiapan Bisnis", short: "Profil Bisnis" },
  { title: "Tahap 3 — Tujuan dan Konfirmasi", short: "Tujuan" },
];

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

// Nama wilayah dari API berupa huruf kapital semua, ubah jadi Title Case.
const toTitle = (s: string) =>
  s
    .toLowerCase()
    .replace(
      /(^|[\s/(-])([a-z])/g,
      (_, p: string, c: string) => p + c.toUpperCase(),
    );

type RawRegion = { id?: string; code?: string; name: string };

// Terima dua bentuk respons: array langsung [{ id, name }] atau { data: [{ code, name }] }
function normalizeRegions(json: unknown): Region[] {
  const list = Array.isArray(json)
    ? json
    : Array.isArray((json as { data?: unknown } | null)?.data)
      ? (json as { data: unknown[] }).data
      : [];
  return (list as RawRegion[])
    .map((x) => ({ id: String(x.id ?? x.code ?? ""), name: x.name }))
    .filter((x) => x.id && x.name);
}

function useRegions(path: string | null) {
  const [items, setItems] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!path) {
      setItems([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`${WILAYAH_API}/${path}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("gagal");
        return r.json();
      })
      .then((json: unknown) => {
        if (!cancelled) setItems(normalizeRegions(json));
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { items, loading, failed };
}

const nameOf = (list: Region[], id: string) =>
  toTitle(list.find((r) => r.id === id)?.name ?? "");

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

const inputBase =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-deep placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
const inputOk =
  "border-gray-300 focus:border-[#0052A4] focus:ring-[#0052A4]/20";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

const cls = (error?: string) => `${inputBase} ${error ? inputErr : inputOk}`;

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-deep"
      >
        {label}
        {required && <span className="ml-0.5 text-[#E3081C]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({
  type,
  name,
  label,
  checked,
  onChange,
}: {
  type: "radio" | "checkbox";
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
        checked
          ? "border-[#0052A4] bg-[#0052A4]/[0.05] text-deep"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#0052A4]"
      />
      {label}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cls(error)}
      aria-invalid={!!error}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function OtherInput({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <input
        id={id}
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={!!error}
        className={cls(error)}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const simple = (list: string[]) => list.map((v) => ({ value: v, label: v }));

/* ------------------------------------------------------------------ */
/* Komponen utama                                                      */
/* ------------------------------------------------------------------ */

export default function DaftarPage({
  onSubmit,
  homeHref = "/",
}: {
  /** Kirim data ke backend. Jika tidak diisi, data hanya ditampilkan di console. */
  onSubmit?: (data: RegistrationPayload) => Promise<void> | void;
  /** Tujuan tautan "Kembali ke beranda". */
  homeHref?: string;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  const provinces = useRegions("provinces");
  const regencies = useRegions(
    form.provinsi ? `regencies/${form.provinsi}` : null,
  );
  const districts = useRegions(
    form.kabupaten ? `districts/${form.kabupaten}` : null,
  );
  const villages = useRegions(
    form.kecamatan ? `villages/${form.kecamatan}` : null,
  );

  useEffect(() => {
    document.title =
      "Daftar Bisnis di Korea — Indonesia-Korea Business Project";
  }, []);

  // Gulir ke atas setiap pindah tahap atau setelah berhasil mengirim
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, done]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key as string];
        return next;
      });
    }
  }

  function validate(s: number) {
    const e: Record<string, string> = {};
    const req = "Wajib diisi.";

    if (s === 0) {
      if (!form.nama.trim()) e.nama = req;
      if (!form.whatsapp.trim()) e.whatsapp = req;
      else if (!/^\+?[0-9][0-9\s-]{7,17}$/.test(form.whatsapp.trim()))
        e.whatsapp =
          "Masukkan nomor WhatsApp yang valid, contoh +62 812 3456 7890.";
      if (!form.email.trim()) e.email = req;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        e.email = "Masukkan alamat email yang valid.";
      if (!form.provinsi) e.provinsi = "Pilih provinsi.";
      if (!form.kabupaten) e.kabupaten = "Pilih kabupaten/kota.";
      if (!form.kecamatan) e.kecamatan = "Pilih kecamatan.";
      if (!form.desa) e.desa = "Pilih desa/kelurahan.";
    }

    if (s === 1) {
      if (!form.status) e.status = "Pilih status Anda saat ini.";
      else if (form.status === STATUS_LAIN && !form.statusLain.trim())
        e.statusLain = "Tuliskan status Anda.";
      if (!form.ide) e.ide = "Pilih salah satu.";
    }

    if (s === 2) {
      const lain = form.tujuanLainOn ? form.tujuanLain.trim() : "";
      if (form.tujuanLainOn && !lain) e.tujuanLain = "Tuliskan tujuan Anda.";
      else if (form.tujuan.length === 0 && !lain)
        e.tujuan = "Pilih minimal satu tujuan.";
      if (!form.setuju)
        e.setuju = "Anda perlu menyetujui penggunaan data untuk melanjutkan.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    if (!validate(step)) return;

    const tujuanLain = form.tujuanLainOn ? form.tujuanLain.trim() : "";

    const payload: RegistrationPayload = {
      nama: form.nama.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      provinsi: nameOf(provinces.items, form.provinsi),
      kabupaten: nameOf(regencies.items, form.kabupaten),
      kecamatan: nameOf(districts.items, form.kecamatan),
      desa: nameOf(villages.items, form.desa),
      alamat: form.alamat.trim(),
      status:
        form.status === STATUS_LAIN ? form.statusLain.trim() : form.status,
      ide: form.ide,
      cerita: form.cerita.trim(),
      tujuan: tujuanLain ? [...form.tujuan, tujuanLain] : form.tujuan,
      sumber: form.sumber,
    };

    setSending(true);
    setSubmitError("");
    try {
      if (onSubmit) await onSubmit(payload);
      else console.log("Pendaftaran:", payload);
      setDone(true);
    } catch {
      setSubmitError(
        "Pendaftaran belum terkirim. Periksa koneksi Anda lalu coba lagi.",
      );
    } finally {
      setSending(false);
    }
  }

  const regionOptions = (r: { items: Region[] }) =>
    r.items.map((x) => ({ value: x.id, label: toTitle(x.name) }));

  return (
    <main className="min-h-screen bg-white">
      <div className="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <a
          href={homeHref}
          className="inline-flex items-center gap-2 rounded text-sm font-medium text-gray-500 transition-colors hover:text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052A4]"
        >
          <span aria-hidden="true">←</span> Kembali ke beranda
        </a>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {done ? (
            /* ---------------- Konfirmasi ---------------- */
            <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#0052A4]/10 text-[#0052A4]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path
                    d="m6 12.5 4 4 8-9"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h1
                id="reg-title"
                className="mt-6 text-2xl font-bold tracking-tight text-deep sm:text-3xl"
              >
                Pendaftaran Anda berhasil dikirim!
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-600">
                Terima kasih atas ketertarikan Anda mengikuti Program Inkubasi
                Bisnis Startup Indonesia-Korea Business Project. Tim kami akan
                menghubungi Anda melalui WhatsApp atau email untuk informasi
                mengenai tahapan selanjutnya.
              </p>
              <a
                href={homeHref}
                className="mt-8 inline-block rounded-full bg-[#E3081C] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B30616] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E3081C] focus-visible:ring-offset-2"
              >
                Kembali ke beranda
              </a>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              {/* Header */}
              <div className="border-b border-gray-100 px-5 pb-5 pt-6 sm:px-8">
                <p className="text-xs font-semibold tracking-wide text-[#E3081C]">
                  Indonesia-Korea Business Project
                </p>
                <h1
                  id="reg-title"
                  className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-deep sm:text-xl"
                >
                  Formulir Pendaftaran Bisnis di Korea
                </h1>

                <ol
                  className="mt-5 grid grid-cols-3 gap-2"
                  aria-label="Progres pendaftaran"
                >
                  {STEPS.map((s, i) => (
                    <li
                      key={s.short}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-colors ${
                          i <= step ? "bg-[#0052A4]" : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`mt-1.5 block text-xs ${
                          i === step
                            ? "font-semibold text-deep"
                            : "text-gray-400"
                        }`}
                      >
                        {s.short}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Isi */}
              <div key={step} className="animate-fade-up px-5 py-6 sm:px-8">
                <h2 className="text-base font-bold text-deep">
                  {STEPS[step].title}
                </h2>

                {/* ---------- Tahap 1 ---------- */}
                {step === 0 && (
                  <div className="mt-5 space-y-5">
                    <Field
                      id="nama"
                      label="Nama lengkap"
                      required
                      error={errors.nama}
                    >
                      <input
                        id="nama"
                        type="text"
                        autoComplete="name"
                        value={form.nama}
                        onChange={(e) => set("nama", e.target.value)}
                        placeholder="Nama sesuai identitas"
                        className={cls(errors.nama)}
                        aria-invalid={!!errors.nama}
                      />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="whatsapp"
                        label="Nomor WhatsApp aktif"
                        required
                        error={errors.whatsapp}
                      >
                        <input
                          id="whatsapp"
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          value={form.whatsapp}
                          onChange={(e) => set("whatsapp", e.target.value)}
                          placeholder="+62 xxx xxxx xxxx"
                          className={cls(errors.whatsapp)}
                          aria-invalid={!!errors.whatsapp}
                        />
                      </Field>

                      <Field
                        id="email"
                        label="Email"
                        required
                        error={errors.email}
                      >
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="nama@email.com"
                          className={cls(errors.email)}
                          aria-invalid={!!errors.email}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="provinsi"
                        label="Provinsi"
                        required
                        error={errors.provinsi}
                        hint={
                          provinces.loading
                            ? "Memuat data provinsi…"
                            : provinces.failed
                              ? "Data provinsi gagal dimuat. Muat ulang halaman lalu coba lagi."
                              : undefined
                        }
                      >
                        <SelectField
                          id="provinsi"
                          value={form.provinsi}
                          onChange={(v) => {
                            setForm((f) => ({
                              ...f,
                              provinsi: v,
                              kabupaten: "",
                              kecamatan: "",
                              desa: "",
                            }));
                            setErrors((e) => ({ ...e, provinsi: "" }));
                          }}
                          options={regionOptions(provinces)}
                          placeholder="Pilih provinsi"
                          error={errors.provinsi}
                          disabled={provinces.loading}
                        />
                      </Field>

                      <Field
                        id="kabupaten"
                        label="Kabupaten/Kota"
                        required
                        error={errors.kabupaten}
                        hint={regencies.loading ? "Memuat data…" : undefined}
                      >
                        <SelectField
                          id="kabupaten"
                          value={form.kabupaten}
                          onChange={(v) => {
                            setForm((f) => ({
                              ...f,
                              kabupaten: v,
                              kecamatan: "",
                              desa: "",
                            }));
                            setErrors((e) => ({ ...e, kabupaten: "" }));
                          }}
                          options={regionOptions(regencies)}
                          placeholder="Pilih kabupaten/kota"
                          error={errors.kabupaten}
                          disabled={!form.provinsi || regencies.loading}
                        />
                      </Field>

                      <Field
                        id="kecamatan"
                        label="Kecamatan"
                        required
                        error={errors.kecamatan}
                        hint={districts.loading ? "Memuat data…" : undefined}
                      >
                        <SelectField
                          id="kecamatan"
                          value={form.kecamatan}
                          onChange={(v) => {
                            setForm((f) => ({ ...f, kecamatan: v, desa: "" }));
                            setErrors((e) => ({ ...e, kecamatan: "" }));
                          }}
                          options={regionOptions(districts)}
                          placeholder="Pilih kecamatan"
                          error={errors.kecamatan}
                          disabled={!form.kabupaten || districts.loading}
                        />
                      </Field>

                      <Field
                        id="desa"
                        label="Desa/Kelurahan"
                        required
                        error={errors.desa}
                        hint={villages.loading ? "Memuat data…" : undefined}
                      >
                        <SelectField
                          id="desa"
                          value={form.desa}
                          onChange={(v) => set("desa", v)}
                          options={regionOptions(villages)}
                          placeholder="Pilih desa/kelurahan"
                          error={errors.desa}
                          disabled={!form.kecamatan || villages.loading}
                        />
                      </Field>
                    </div>

                    <Field id="alamat" label="Alamat lengkap">
                      <textarea
                        id="alamat"
                        rows={3}
                        value={form.alamat}
                        onChange={(e) => set("alamat", e.target.value)}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kode pos"
                        className={cls()}
                      />
                    </Field>
                  </div>
                )}

                {/* ---------- Tahap 2 ---------- */}
                {step === 1 && (
                  <div className="mt-5 space-y-6">
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-deep">
                        Status Anda saat ini
                        <span className="ml-0.5 text-[#E3081C]">*</span>
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {STATUS.map((o) => (
                          <Choice
                            key={o}
                            type="radio"
                            name="status"
                            label={o}
                            checked={form.status === o}
                            onChange={() => set("status", o)}
                          />
                        ))}
                        <Choice
                          type="radio"
                          name="status"
                          label="Tuliskan sendiri"
                          checked={form.status === STATUS_LAIN}
                          onChange={() => set("status", STATUS_LAIN)}
                        />
                        {form.status === STATUS_LAIN && (
                          <div className="sm:col-span-2">
                            <OtherInput
                              id="status-lain"
                              value={form.statusLain}
                              onChange={(v) => set("statusLain", v)}
                              placeholder="Tuliskan status Anda"
                              error={errors.statusLain}
                            />
                          </div>
                        )}
                      </div>
                      {errors.status && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600"
                        >
                          {errors.status}
                        </p>
                      )}
                    </fieldset>

                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-deep">
                        Apakah Anda sudah memiliki bisnis atau ide bisnis?
                        <span className="ml-0.5 text-[#E3081C]">*</span>
                      </legend>
                      <div className="grid gap-2">
                        {IDE.map((o) => (
                          <Choice
                            key={o}
                            type="radio"
                            name="ide"
                            label={o}
                            checked={form.ide === o}
                            onChange={() => set("ide", o)}
                          />
                        ))}
                      </div>
                      {errors.ide && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600"
                        >
                          {errors.ide}
                        </p>
                      )}
                    </fieldset>

                    <Field
                      id="cerita"
                      label="Ceritakan singkat ide atau rencana bisnis Anda"
                    >
                      <textarea
                        id="cerita"
                        rows={4}
                        value={form.cerita}
                        onChange={(e) => set("cerita", e.target.value)}
                        placeholder="Jelaskan ide, produk, atau peluang bisnis yang ingin Anda kembangkan."
                        className={cls()}
                      />
                    </Field>
                  </div>
                )}

                {/* ---------- Tahap 3 ---------- */}
                {step === 2 && (
                  <div className="mt-5 space-y-6">
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold text-deep">
                        Apa tujuan utama Anda mengikuti program ini?
                        <span className="ml-0.5 text-[#E3081C]">*</span>
                      </legend>
                      <div className="grid gap-2">
                        {TUJUAN.map((o) => (
                          <Choice
                            key={o}
                            type="checkbox"
                            name="tujuan"
                            label={o}
                            checked={form.tujuan.includes(o)}
                            onChange={() =>
                              set(
                                "tujuan",
                                form.tujuan.includes(o)
                                  ? form.tujuan.filter((t) => t !== o)
                                  : [...form.tujuan, o],
                              )
                            }
                          />
                        ))}
                        <Choice
                          type="checkbox"
                          name="tujuan"
                          label="Tuliskan sendiri"
                          checked={form.tujuanLainOn}
                          onChange={() =>
                            set("tujuanLainOn", !form.tujuanLainOn)
                          }
                        />
                        {form.tujuanLainOn && (
                          <OtherInput
                            id="tujuan-lain"
                            value={form.tujuanLain}
                            onChange={(v) => set("tujuanLain", v)}
                            placeholder="Tuliskan tujuan Anda"
                            error={errors.tujuanLain}
                          />
                        )}
                      </div>
                      {errors.tujuan && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600"
                        >
                          {errors.tujuan}
                        </p>
                      )}
                    </fieldset>

                    <Field
                      id="sumber"
                      label="Dari mana Anda mengetahui program ini?"
                    >
                      <SelectField
                        id="sumber"
                        value={form.sumber}
                        onChange={(v) => set("sumber", v)}
                        options={simple(SUMBER)}
                        placeholder="Pilih salah satu"
                      />
                    </Field>

                    <div>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm leading-6 transition-colors ${
                          errors.setuju
                            ? "border-red-400 bg-red-50/40"
                            : form.setuju
                              ? "border-[#0052A4] bg-[#0052A4]/[0.05]"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.setuju}
                          onChange={(e) => set("setuju", e.target.checked)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#0052A4]"
                          aria-invalid={!!errors.setuju}
                        />
                        <span className="text-gray-700">
                          <span className="font-semibold text-deep">
                            Persetujuan penggunaan data
                            <span className="ml-0.5 text-[#E3081C]">*</span>
                          </span>
                          <br />
                          Saya menyetujui penggunaan data yang saya berikan
                          untuk keperluan pendaftaran, seleksi, dan komunikasi
                          terkait program.
                        </span>
                      </label>
                      {errors.setuju && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-medium text-red-600"
                        >
                          {errors.setuju}
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <p
                        role="alert"
                        className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                      >
                        {submitError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-8">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052A4]"
                  >
                    Kembali
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">
                    <span className="text-[#E3081C]">*</span> wajib diisi
                  </span>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-full bg-[#E3081C] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B30616] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E3081C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step < STEPS.length - 1
                    ? "Lanjut"
                    : sending
                      ? "Mengirim…"
                      : "Kirim Pendaftaran"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}