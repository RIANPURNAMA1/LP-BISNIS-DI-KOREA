"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Data & tipe                                                         */
/* ------------------------------------------------------------------ */

/** Error dari server yang terkait kolom tertentu, misalnya email sudah terdaftar. */
export class RegistrationFieldError extends Error {
  constructor(
    public field: "email",
    message: string,
  ) {
    super(message);
    this.name = "RegistrationFieldError";
  }
}

export type RegistrationPayload = {
  password: string;
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
  pendapatan: string;
  tujuan: string[];
  sumber: string;
  /** Kode affiliate dari tautan undangan (/daftar?ref=...), boleh kosong. */
  kodeAfiliasi: string;
  /** jabodetabek | luar_jabodetabek | luar_negeri — menentukan grup WhatsApp. */
  wilayah: "jabodetabek" | "luar_jabodetabek" | "luar_negeri";
};

/** Hasil dari server setelah pendaftaran tersimpan. */
export type RegistrationResult = {
  /** true jika peserta sudah otomatis masuk (login) setelah mendaftar. */
  loggedIn?: boolean;
} | void;

type Domisili = "indonesia" | "luar";

type FormState = {
  domisili: Domisili;
  nama: string;
  whatsapp: string;
  kodeWhatsapp: string; // kode negara, tanpa "+"
  email: string;
  password: string;
  passwordKonfirmasi: string;
  provinsiId: string;
  provinsiNama: string;
  kabupatenId: string;
  kabupatenNama: string;
  negara: string; // manual, luar negeri
  provinsiLuar: string;
  kotaLuar: string;
  status: string;
  statusLain: string;
  sumberLain: string; // diisi jika sumber = "Tuliskan sendiri"
  ide: string;
  cerita: string;
  pendapatan: string;
  tujuan: string[];
  tujuanLainOn: boolean;
  tujuanLain: string;
  sumber: string;
  setuju: boolean;
};

const initialForm: FormState = {
  domisili: "indonesia",
  nama: "",
  whatsapp: "",
  kodeWhatsapp: "",
  email: "",
  password: "",
  passwordKonfirmasi: "",
  provinsiId: "",
  provinsiNama: "",
  kabupatenId: "",
  kabupatenNama: "",
  negara: "",
  provinsiLuar: "",
  kotaLuar: "",
  status: "",
  statusLain: "",
  sumberLain: "",
  ide: "",
  cerita: "",
  pendapatan: "",
  tujuan: [],
  tujuanLainOn: false,
  tujuanLain: "",
  sumber: "",
  setuju: false,
};

// Kode kabupaten/kota Jabodetabek dari wilayah.id — menentukan grup WhatsApp.
const JABODETABEK_KABUPATEN_IDS = new Set([
  // DKI Jakarta (semua kota/kabupaten administrasi)
  "31.01", "31.71", "31.72", "31.73", "31.74", "31.75",
  // Jawa Barat: Bogor, Depok, Bekasi
  "32.01", "32.71", "32.76", "32.16", "32.75",
  // Banten: Tangerang, Tangerang Selatan
  "36.03", "36.71", "36.74",
]);

const STATUS = ["Karyawan", "Pelajar atau mahasiswa", "Pengusaha"];
const STATUS_LAIN = "__lain__";

const IDE = [
  "Sudah memiliki ide bisnis",
  "Sudah menjalankan bisnis",
  "Belum memiliki bisnis",
];

const PENDAPATAN = ["Under 5jt", "5 – 10jt", "10 – 20jt", "Di atas 20jt"];

const TUJUAN = [
  "Mencari peluang bisnis di Korea",
  "Mengembangkan ide startup",
  "Mempersiapkan pendirian perusahaan",
  "Memahami legalitas dan visa bisnis di Korea",
  "Mendapatkan mentor dan jaringan bisnis",
];

const SUMBER = [
  "Instagram",
  "TikTok",
  "Facebook",
  "WhatsApp",
  "Teman atau keluarga",
];

// Daftar kode negara (dial code) untuk WhatsApp.
// Beberapa negara berbagi kode yang sama, jadi digabung dalam satu opsi.
const KODE_NEGARA_SEMUA: { kode: string; negara: string }[] = [
  { kode: "93", negara: "Afghanistan" },
  { kode: "27", negara: "Afrika Selatan" },
  { kode: "355", negara: "Albania" },
  { kode: "213", negara: "Aljazair" },
  { kode: "1", negara: "Amerika Serikat / Kanada" },
  { kode: "376", negara: "Andorra" },
  { kode: "244", negara: "Angola" },
  { kode: "1268", negara: "Antigua dan Barbuda" },
  { kode: "966", negara: "Arab Saudi" },
  { kode: "54", negara: "Argentina" },
  { kode: "374", negara: "Armenia" },
  { kode: "61", negara: "Australia" },
  { kode: "43", negara: "Austria" },
  { kode: "994", negara: "Azerbaijan" },
  { kode: "1242", negara: "Bahama" },
  { kode: "973", negara: "Bahrain" },
  { kode: "880", negara: "Bangladesh" },
  { kode: "1246", negara: "Barbados" },
  { kode: "31", negara: "Belanda" },
  { kode: "375", negara: "Belarus" },
  { kode: "32", negara: "Belgia" },
  { kode: "501", negara: "Belize" },
  { kode: "229", negara: "Benin" },
  { kode: "975", negara: "Bhutan" },
  { kode: "591", negara: "Bolivia" },
  { kode: "387", negara: "Bosnia dan Herzegovina" },
  { kode: "267", negara: "Botswana" },
  { kode: "55", negara: "Brasil" },
  { kode: "673", negara: "Brunei Darussalam" },
  { kode: "359", negara: "Bulgaria" },
  { kode: "226", negara: "Burkina Faso" },
  { kode: "257", negara: "Burundi" },
  { kode: "235", negara: "Chad" },
  { kode: "56", negara: "Chili" },
  { kode: "420", negara: "Ceko" },
  { kode: "45", negara: "Denmark" },
  { kode: "253", negara: "Djibouti" },
  { kode: "1767", negara: "Dominika" },
  { kode: "593", negara: "Ekuador" },
  { kode: "503", negara: "El Salvador" },
  { kode: "291", negara: "Eritrea" },
  { kode: "372", negara: "Estonia" },
  { kode: "268", negara: "Eswatini" },
  { kode: "251", negara: "Etiopia" },
  { kode: "679", negara: "Fiji" },
  { kode: "63", negara: "Filipina" },
  { kode: "358", negara: "Finlandia" },
  { kode: "241", negara: "Gabon" },
  { kode: "220", negara: "Gambia" },
  { kode: "995", negara: "Georgia" },
  { kode: "233", negara: "Ghana" },
  { kode: "1473", negara: "Grenada" },
  { kode: "502", negara: "Guatemala" },
  { kode: "224", negara: "Guinea" },
  { kode: "245", negara: "Guinea Bissau" },
  { kode: "240", negara: "Guinea Khatulistiwa" },
  { kode: "592", negara: "Guyana" },
  { kode: "509", negara: "Haiti" },
  { kode: "504", negara: "Honduras" },
  { kode: "852", negara: "Hong Kong" },
  { kode: "36", negara: "Hungaria" },
  { kode: "91", negara: "India" },
  { kode: "62", negara: "Indonesia" },
  { kode: "44", negara: "Inggris (Britania Raya)" },
  { kode: "964", negara: "Irak" },
  { kode: "98", negara: "Iran" },
  { kode: "353", negara: "Irlandia" },
  { kode: "354", negara: "Islandia" },
  { kode: "972", negara: "Israel" },
  { kode: "39", negara: "Italia" },
  { kode: "1876", negara: "Jamaika" },
  { kode: "81", negara: "Jepang" },
  { kode: "49", negara: "Jerman" },
  { kode: "855", negara: "Kamboja" },
  { kode: "237", negara: "Kamerun" },
  { kode: "254", negara: "Kenya" },
  { kode: "996", negara: "Kirgizstan" },
  { kode: "686", negara: "Kiribati" },
  { kode: "57", negara: "Kolombia" },
  { kode: "269", negara: "Komoro" },
  { kode: "242", negara: "Kongo" },
  { kode: "243", negara: "Kongo (RDK)" },
  { kode: "82", negara: "Korea Selatan" },
  { kode: "850", negara: "Korea Utara" },
  { kode: "383", negara: "Kosovo" },
  { kode: "506", negara: "Kosta Rika" },
  { kode: "385", negara: "Kroasia" },
  { kode: "53", negara: "Kuba" },
  { kode: "965", negara: "Kuwait" },
  { kode: "856", negara: "Laos" },
  { kode: "371", negara: "Latvia" },
  { kode: "961", negara: "Lebanon" },
  { kode: "266", negara: "Lesotho" },
  { kode: "231", negara: "Liberia" },
  { kode: "218", negara: "Libya" },
  { kode: "423", negara: "Liechtenstein" },
  { kode: "370", negara: "Lituania" },
  { kode: "352", negara: "Luksemburg" },
  { kode: "261", negara: "Madagaskar" },
  { kode: "853", negara: "Makau" },
  { kode: "389", negara: "Makedonia Utara" },
  { kode: "960", negara: "Maladewa" },
  { kode: "265", negara: "Malawi" },
  { kode: "60", negara: "Malaysia" },
  { kode: "223", negara: "Mali" },
  { kode: "356", negara: "Malta" },
  { kode: "212", negara: "Maroko" },
  { kode: "692", negara: "Marshall" },
  { kode: "222", negara: "Mauritania" },
  { kode: "230", negara: "Mauritius" },
  { kode: "52", negara: "Meksiko" },
  { kode: "20", negara: "Mesir" },
  { kode: "691", negara: "Mikronesia" },
  { kode: "373", negara: "Moldova" },
  { kode: "377", negara: "Monako" },
  { kode: "976", negara: "Mongolia" },
  { kode: "382", negara: "Montenegro" },
  { kode: "258", negara: "Mozambik" },
  { kode: "95", negara: "Myanmar" },
  { kode: "264", negara: "Namibia" },
  { kode: "674", negara: "Nauru" },
  { kode: "977", negara: "Nepal" },
  { kode: "227", negara: "Niger" },
  { kode: "234", negara: "Nigeria" },
  { kode: "505", negara: "Nikaragua" },
  { kode: "47", negara: "Norwegia" },
  { kode: "968", negara: "Oman" },
  { kode: "92", negara: "Pakistan" },
  { kode: "680", negara: "Palau" },
  { kode: "970", negara: "Palestina" },
  { kode: "507", negara: "Panama" },
  { kode: "225", negara: "Pantai Gading" },
  { kode: "675", negara: "Papua Nugini" },
  { kode: "595", negara: "Paraguay" },
  { kode: "51", negara: "Peru" },
  { kode: "48", negara: "Polandia" },
  { kode: "351", negara: "Portugal" },
  { kode: "33", negara: "Prancis" },
  { kode: "974", negara: "Qatar" },
  { kode: "1809", negara: "Republik Dominika" },
  { kode: "40", negara: "Rumania" },
  { kode: "7", negara: "Rusia / Kazakhstan" },
  { kode: "250", negara: "Rwanda" },
  { kode: "1869", negara: "Saint Kitts dan Nevis" },
  { kode: "1758", negara: "Saint Lucia" },
  { kode: "1784", negara: "Saint Vincent dan Grenadine" },
  { kode: "685", negara: "Samoa" },
  { kode: "378", negara: "San Marino" },
  { kode: "239", negara: "Sao Tome dan Principe" },
  { kode: "64", negara: "Selandia Baru" },
  { kode: "221", negara: "Senegal" },
  { kode: "381", negara: "Serbia" },
  { kode: "248", negara: "Seychelles" },
  { kode: "232", negara: "Sierra Leone" },
  { kode: "65", negara: "Singapura" },
  { kode: "357", negara: "Siprus" },
  { kode: "386", negara: "Slovenia" },
  { kode: "421", negara: "Slowakia" },
  { kode: "677", negara: "Solomon" },
  { kode: "252", negara: "Somalia" },
  { kode: "34", negara: "Spanyol" },
  { kode: "94", negara: "Sri Lanka" },
  { kode: "249", negara: "Sudan" },
  { kode: "211", negara: "Sudan Selatan" },
  { kode: "597", negara: "Suriname" },
  { kode: "963", negara: "Suriah" },
  { kode: "46", negara: "Swedia" },
  { kode: "41", negara: "Swiss" },
  { kode: "992", negara: "Tajikistan" },
  { kode: "255", negara: "Tanzania" },
  { kode: "66", negara: "Thailand" },
  { kode: "670", negara: "Timor Leste" },
  { kode: "86", negara: "Tiongkok" },
  { kode: "228", negara: "Togo" },
  { kode: "676", negara: "Tonga" },
  { kode: "1868", negara: "Trinidad dan Tobago" },
  { kode: "216", negara: "Tunisia" },
  { kode: "90", negara: "Turki" },
  { kode: "993", negara: "Turkmenistan" },
  { kode: "688", negara: "Tuvalu" },
  { kode: "256", negara: "Uganda" },
  { kode: "380", negara: "Ukraina" },
  { kode: "971", negara: "Uni Emirat Arab" },
  { kode: "598", negara: "Uruguay" },
  { kode: "998", negara: "Uzbekistan" },
  { kode: "678", negara: "Vanuatu" },
  { kode: "58", negara: "Venezuela" },
  { kode: "84", negara: "Vietnam" },
  { kode: "967", negara: "Yaman" },
  { kode: "962", negara: "Yordania" },
  { kode: "30", negara: "Yunani" },
  { kode: "260", negara: "Zambia" },
  { kode: "263", negara: "Zimbabwe" },
];

// Negara yang sering dipakai ditampilkan lebih dulu, sisanya urut abjad.
const KODE_NEGARA_PRIORITAS = [
  "82", // Korea Selatan
  "62", // Indonesia
  "60", // Malaysia
  "65", // Singapura
  "81", // Jepang
  "86", // Tiongkok
  "886", // Taiwan
  "852", // Hong Kong
  "61", // Australia
  "1", // Amerika Serikat / Kanada
  "44", // Inggris
  "971", // Uni Emirat Arab
];

const KODE_NEGARA = [...KODE_NEGARA_SEMUA].sort((a, b) => {
  const ia = KODE_NEGARA_PRIORITAS.indexOf(a.kode);
  const ib = KODE_NEGARA_PRIORITAS.indexOf(b.kode);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.negara.localeCompare(b.negara, "id");
});

const STEPS = [
  {
    short: "Data Diri",
    heading: "Data diri",
    desc: "Informasi dasar untuk menghubungi Anda.",
  },
  {
    short: "Profil Bisnis",
    heading: "Profil dan kesiapan bisnis",
    desc: "Bantu kami memahami kondisi dan rencana bisnis Anda.",
  },
  {
    short: "Tujuan",
    heading: "Tujuan dan konfirmasi",
    desc: "Langkah terakhir sebelum pendaftaran dikirim.",
  },
];

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

const inputBase =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
const inputOk =
  "border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-gray-900/10";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-red-500/10";

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
        className="mb-1.5 block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
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
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
        checked
          ? "border-gray-900 bg-gray-50 text-gray-900"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
      }`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-gray-900"
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

function GroupTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="border-b border-gray-200 pb-2.5 pt-2">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-gray-500">{desc}</p>}
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
  kodeAfiliasi = "",
}: {
  /** Kirim data ke backend. Jika tidak diisi, data hanya ditampilkan di console. */
  onSubmit?: (
    data: RegistrationPayload,
  ) => Promise<RegistrationResult> | RegistrationResult;
  /** Tujuan tautan "Kembali ke beranda". */
  homeHref?: string;
  /** Kode affiliate yang terbawa dari query string ?ref=. */
  kodeAfiliasi?: string;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);

  // Setelah berhasil daftar, arahkan ke gerbang pembayaran/aktivasi akun.
  // Akses /peserta baru terbuka setelah admin memverifikasi pembayaran.
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => {
      window.location.assign(loggedIn ? "/pembayaran" : "/login");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [done, loggedIn]);
  const [provinsiList, setProvinsiList] = useState<{ code: string; name: string }[]>([]);
  const [kabupatenList, setKabupatenList] = useState<{ code: string; name: string }[]>([]);
  const [loadingProvinsi, setLoadingProvinsi] = useState(false);
  const [loadingKabupaten, setLoadingKabupaten] = useState(false);

  useEffect(() => {
    document.title =
      "Daftar Bisnis di Korea — Indonesia-Korea Business Project";
  }, []);

  // Gulir ke atas setiap pindah tahap atau setelah berhasil mengirim
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, done]);

  useEffect(() => {
    setLoadingProvinsi(true);
    fetch("/api/wilayah/provinces.json")
      .then((r) => r.json())
      .then((json) => setProvinsiList(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingProvinsi(false));
  }, []);

  useEffect(() => {
    if (!form.provinsiId) {
      setKabupatenList([]);
      return;
    }
    setLoadingKabupaten(true);
    fetch(`/api/wilayah/regencies/${form.provinsiId}.json`)
      .then((r) => r.json())
      .then((json) => setKabupatenList(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingKabupaten(false));
  }, [form.provinsiId]);

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

  function setDomisili(value: Domisili) {
    if (value === form.domisili) return;
    setForm((f) => ({
      ...f,
      domisili: value,
      whatsapp: "",
      kodeWhatsapp: "",
      provinsiId: "",
      provinsiNama: "",
      kabupatenId: "",
      kabupatenNama: "",
      negara: "",
      provinsiLuar: "",
      kotaLuar: "",
    }));
    setErrors({});
  }

  function setKodeNegara(kode: string) {
    const negara = KODE_NEGARA.find((k) => k.kode === kode)?.negara;
    setForm((f) => ({
      ...f,
      kodeWhatsapp: kode,
      // Isi otomatis negara jika belum diisi, tapi tetap bisa diedit manual.
      negara: f.negara.trim() ? f.negara : (negara ?? ""),
    }));
    if (errors.kodeWhatsapp) {
      setErrors((e) => {
        const next = { ...e };
        delete next.kodeWhatsapp;
        return next;
      });
    }
  }

  function validate(s: number) {
    const e: Record<string, string> = {};
    const req = "Wajib diisi.";

    if (s === 0) {
      const isLuar = form.domisili === "luar";

      if (!form.nama.trim()) e.nama = req;

      if (!form.whatsapp.trim()) e.whatsapp = req;
      else if (isLuar) {
        const kode = form.kodeWhatsapp.replace(/\D/g, "");
        const nomor = form.whatsapp.replace(/\D/g, "");
        if (!kode) e.kodeWhatsapp = req;
        else if (kode.length > 4)
          e.kodeWhatsapp = "Kode negara maksimal 4 digit, contoh 82.";
        if (nomor.length < 6)
          e.whatsapp =
            "Masukkan nomor WhatsApp yang valid, contoh 10 1234 5678.";
        else if (kode && kode.length + nomor.length > 15)
          e.whatsapp = "Total digit kode negara dan nomor maksimal 15 digit.";
      } else if (!/^\+?[0-9][0-9\s-]{7,17}$/.test(form.whatsapp.trim()))
        e.whatsapp =
          "Masukkan nomor WhatsApp yang valid, contoh +62 812 3456 7890.";

      if (!form.email.trim()) e.email = req;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        e.email = "Masukkan alamat email yang valid.";

      if (form.password.length < 8) e.password = "Password minimal 8 karakter.";
      else if (form.password.length > 72) e.password = "Password maksimal 72 karakter.";
      if (form.passwordKonfirmasi !== form.password)
        e.passwordKonfirmasi = "Konfirmasi password tidak sama.";

      if (isLuar) {
        if (!form.negara.trim()) e.negara = "Tuliskan negara Anda.";
        if (!form.provinsiLuar.trim())
          e.provinsiLuar = "Tuliskan provinsi/state Anda.";
        if (!form.kotaLuar.trim()) e.kotaLuar = "Tuliskan kota Anda.";
      } else {
        if (!form.provinsiId) e.provinsiId = "Pilih provinsi domisili Anda.";
        if (!form.kabupatenId) e.kabupatenId = "Pilih kabupaten/kota domisili Anda.";
      }
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
    const isLuar = form.domisili === "luar";
    const kode = form.kodeWhatsapp.replace(/\D/g, "");

    const payload: RegistrationPayload = {
      password: form.password,
      nama: form.nama.trim(),
      whatsapp: isLuar
        ? `+${kode} ${form.whatsapp.trim()}`
        : form.whatsapp.trim(),
      email: form.email.trim(),
      provinsi: isLuar ? "Luar Negeri" : form.provinsiNama.trim(),
      kabupaten: isLuar ? form.negara.trim() : form.kabupatenNama.trim(),
      kecamatan: isLuar ? form.provinsiLuar.trim() : "",
      desa: isLuar ? form.kotaLuar.trim() : "",
      alamat: "",
      status:
        form.status === STATUS_LAIN ? form.statusLain.trim() : form.status,
      ide: form.ide,
      cerita: form.cerita.trim(),
      pendapatan: form.pendapatan,
      tujuan: tujuanLain ? [...form.tujuan, tujuanLain] : form.tujuan,
      sumber:
        form.sumber === STATUS_LAIN ? form.sumberLain.trim() : form.sumber,
      kodeAfiliasi,
      wilayah: isLuar
        ? "luar_negeri"
        : JABODETABEK_KABUPATEN_IDS.has(form.kabupatenId)
          ? "jabodetabek"
          : "luar_jabodetabek",
    };

    setSending(true);
    setSubmitError("");
    try {
      let result: RegistrationResult = undefined;
      if (onSubmit) result = await onSubmit(payload);
      else console.log("Pendaftaran:", payload);
      setLoggedIn(result?.loggedIn !== false);
      setDone(true);
    } catch (err) {
      if (err instanceof RegistrationFieldError) {
        // Kolom email ada di Tahap 1: kembali ke sana dan tampilkan pesannya.
        setErrors({ [err.field]: err.message });
        setStep(0);
      } else {
        setSubmitError(
          err instanceof Error && err.message
            ? err.message
            : "Pendaftaran belum terkirim. Periksa koneksi Anda lalu coba lagi.",
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <a
          href={homeHref}
          className="inline-flex items-center gap-2 rounded text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          <span aria-hidden="true">←</span> Kembali ke beranda
        </a>

        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {done ? (
            /* ---------------- Popup berhasil daftar ---------------- */
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reg-title"
              className="px-6 py-12 text-center sm:px-12 sm:py-16"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gray-900 text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
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
                className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
              >
                Pendaftaran berhasil!
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-gray-600">
                {loggedIn
                  ? "Akun Anda sudah dibuat dan Anda otomatis masuk. Anda akan diarahkan ke halaman pembayaran untuk mengaktifkan akun."
                  : "Akun Anda sudah dibuat. Silakan masuk dengan email dan password Anda, lalu selesaikan pembayaran untuk mengaktifkan akun."}
              </p>
              <p
                className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-gray-500"
                role="status"
              >
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
                  aria-hidden="true"
                />
                Mengalihkan...
              </p>
              <a
                href={loggedIn ? "/pembayaran" : "/login"}
                className="mx-auto mt-6 flex w-full max-w-md items-center justify-center rounded-full bg-[#0052A4] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00438a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052A4] focus-visible:ring-offset-2"
              >
                {loggedIn ? "Lanjut ke Pembayaran" : "Masuk"}
              </a>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              {/* Header */}
              <div className="border-b border-gray-200 px-5 pb-6 pt-7 sm:px-8">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Indonesia-Korea Business Project
                </p>
                <h1
                  id="reg-title"
                  className="mt-2 text-xl font-semibold leading-snug tracking-tight text-gray-900 sm:text-2xl"
                >
                  Formulir Pendaftaran Bisnis di Korea
                </h1>
                <p className="mt-1.5 text-sm text-gray-500">
                  Isi data berikut dengan benar. Hanya membutuhkan beberapa
                  menit.
                </p>
                {kodeAfiliasi && (
                  <p className="mt-3 inline-flex rounded-full bg-[#0052A4]/10 px-3 py-1 text-xs font-semibold text-[#0052A4]">
                    Anda mendaftar melalui undangan affiliate · {kodeAfiliasi}
                  </p>
                )}

                <ol
                  className="mt-6 flex items-center"
                  aria-label="Progres pendaftaran"
                >
                  {STEPS.map((st, i) => (
                    <li
                      key={st.short}
                      aria-current={i === step ? "step" : undefined}
                      className={`flex items-center ${
                        i < STEPS.length - 1 ? "flex-1" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                            i < step
                              ? "bg-gray-900 text-white"
                              : i === step
                                ? "bg-gray-900 text-white ring-4 ring-gray-900/10"
                                : "border border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {i < step ? (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            >
                              <path
                                d="m6 12.5 4 4 8-9"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span
                          className={`hidden text-sm sm:inline ${
                            i === step
                              ? "font-semibold text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {st.short}
                        </span>
                      </span>
                      {i < STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`mx-3 h-px flex-1 transition-colors ${
                            i < step ? "bg-gray-900" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Isi */}
              <div key={step} className="animate-fade-up px-5 py-6 sm:px-8">
                <p className="text-xs font-medium text-gray-500">
                  Langkah {step + 1} dari {STEPS.length}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                  {STEPS[step].heading}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{STEPS[step].desc}</p>

                {/* ---------- Tahap 1 ---------- */}
                {step === 0 && (
                  <div className="mt-6 space-y-5">
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

                    <GroupTitle
                      title="Domisili"
                      desc="Menentukan grup WhatsApp yang akan Anda terima."
                    />

                    <div>
                      <Choice
                        type="checkbox"
                        name="domisiliLuar"
                        label="Saya berdomisili di luar negeri"
                        checked={form.domisili === "luar"}
                        onChange={() =>
                          setDomisili(
                            form.domisili === "luar" ? "indonesia" : "luar",
                          )
                        }
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        {form.domisili === "luar"
                          ? "Isi nomor WhatsApp dengan kode negara tempat Anda tinggal sekarang."
                          : "Jika Anda tinggal di Indonesia, biarkan kotak ini tidak dicentang."}
                      </p>
                    </div>

                    {form.domisili === "luar" ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          id="negara"
                          label="Negara"
                          required
                          error={errors.negara}
                        >
                          <input
                            id="negara"
                            type="text"
                            autoComplete="country-name"
                            value={form.negara}
                            onChange={(e) => set("negara", e.target.value)}
                            placeholder="Contoh: Korea Selatan"
                            className={cls(errors.negara)}
                            aria-invalid={!!errors.negara}
                          />
                        </Field>

                        <Field
                          id="provinsiLuar"
                          label="Provinsi/State"
                          required
                          error={errors.provinsiLuar}
                        >
                          <input
                            id="provinsiLuar"
                            type="text"
                            autoComplete="address-level1"
                            value={form.provinsiLuar}
                            onChange={(e) =>
                              set("provinsiLuar", e.target.value)
                            }
                            placeholder="Contoh: Seoul"
                            className={cls(errors.provinsiLuar)}
                            aria-invalid={!!errors.provinsiLuar}
                          />
                        </Field>

                        <Field
                          id="kotaLuar"
                          label="Kota"
                          required
                          error={errors.kotaLuar}
                        >
                          <input
                            id="kotaLuar"
                            type="text"
                            autoComplete="address-level2"
                            value={form.kotaLuar}
                            onChange={(e) => set("kotaLuar", e.target.value)}
                            placeholder="Contoh: Seoul"
                            className={cls(errors.kotaLuar)}
                            aria-invalid={!!errors.kotaLuar}
                          />
                        </Field>
                      </div>
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          id="provinsiId"
                          label="Provinsi"
                          required
                          error={errors.provinsiId}
                        >
                          <SelectField
                            id="provinsiId"
                            value={form.provinsiId}
                            onChange={(v) => {
                              const nama =
                                provinsiList.find((p) => p.code === v)?.name ??
                                "";
                              setForm((f) => ({
                                ...f,
                                provinsiId: v,
                                provinsiNama: nama,
                                kabupatenId: "",
                                kabupatenNama: "",
                              }));
                              setErrors((er) => {
                                const next = { ...er };
                                delete next.provinsiId;
                                delete next.kabupatenId;
                                return next;
                              });
                            }}
                            options={provinsiList.map((p) => ({
                              value: p.code,
                              label: p.name,
                            }))}
                            placeholder={
                              loadingProvinsi ? "Memuat…" : "Pilih provinsi"
                            }
                            error={errors.provinsiId}
                            disabled={loadingProvinsi}
                          />
                        </Field>

                        <Field
                          id="kabupatenId"
                          label="Kabupaten/Kota"
                          required
                          error={errors.kabupatenId}
                        >
                          <SelectField
                            id="kabupatenId"
                            value={form.kabupatenId}
                            onChange={(v) => {
                              const nama =
                                kabupatenList.find((k) => k.code === v)?.name ??
                                "";
                              setForm((f) => ({
                                ...f,
                                kabupatenId: v,
                                kabupatenNama: nama,
                              }));
                              setErrors((er) => {
                                const next = { ...er };
                                delete next.kabupatenId;
                                return next;
                              });
                            }}
                            options={kabupatenList.map((k) => ({
                              value: k.code,
                              label: k.name,
                            }))}
                            placeholder={
                              loadingKabupaten
                                ? "Memuat…"
                                : form.provinsiId
                                  ? "Pilih kabupaten/kota"
                                  : "Pilih provinsi dulu"
                            }
                            error={errors.kabupatenId}
                            disabled={!form.provinsiId || loadingKabupaten}
                          />
                        </Field>
                      </div>
                    )}
                    <GroupTitle
                      title="Kontak"
                      desc="Kami menghubungi Anda melalui WhatsApp dan email."
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      {form.domisili === "luar" ? (
                        <>
                          <Field
                            id="kodeWhatsapp"
                            label="Kode negara WhatsApp"
                            required
                            error={errors.kodeWhatsapp}
                            hint="Pilih kode negara. Contoh: +82 Korea Selatan, +60 Malaysia."
                          >
                            <SelectField
                              id="kodeWhatsapp"
                              value={form.kodeWhatsapp}
                              onChange={setKodeNegara}
                              options={KODE_NEGARA.map((k) => ({
                                value: k.kode,
                                label: `${k.negara} (+${k.kode})`,
                              }))}
                              placeholder="Pilih kode negara"
                              error={errors.kodeWhatsapp}
                            />
                          </Field>

                          <Field
                            id="whatsapp"
                            label="Nomor WhatsApp aktif"
                            required
                            error={errors.whatsapp}
                            hint="Tulis tanpa kode negara, contoh 10 1234 5678."
                          >
                            <input
                              id="whatsapp"
                              type="tel"
                              autoComplete="tel-national"
                              inputMode="tel"
                              value={form.whatsapp}
                              onChange={(e) => set("whatsapp", e.target.value)}
                              placeholder="10 1234 5678"
                              className={cls(errors.whatsapp)}
                              aria-invalid={!!errors.whatsapp}
                            />
                          </Field>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}

                      {form.domisili === "luar" && (
                        <div className="sm:col-span-2">
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
                      )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="password"
                        label="Password"
                        required
                        error={errors.password}
                        hint="Minimal 8 karakter. Dipakai untuk masuk ke halaman peserta."
                      >
                        <input
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                          className={cls(errors.password)}
                          aria-invalid={!!errors.password}
                        />
                      </Field>
                      <Field
                        id="passwordKonfirmasi"
                        label="Ulangi password"
                        required
                        error={errors.passwordKonfirmasi}
                      >
                        <input
                          id="passwordKonfirmasi"
                          type="password"
                          autoComplete="new-password"
                          value={form.passwordKonfirmasi}
                          onChange={(e) => set("passwordKonfirmasi", e.target.value)}
                          className={cls(errors.passwordKonfirmasi)}
                          aria-invalid={!!errors.passwordKonfirmasi}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ---------- Tahap 2 ---------- */}
                {step === 1 && (
                  <div className="mt-6 space-y-6">
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium text-gray-900">
                        Status Anda saat ini
                        <span className="ml-0.5 text-red-600">*</span>
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
                      <legend className="mb-2 text-sm font-medium text-gray-900">
                        Apakah Anda sudah memiliki bisnis atau ide bisnis?
                        <span className="ml-0.5 text-red-600">*</span>
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

                    <fieldset>
                      <legend className="mb-2 text-sm font-medium text-gray-900">
                        Berapa kisaran personal income (pendapatan pribadi) Anda
                        per bulan?
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {PENDAPATAN.map((o) => (
                          <Choice
                            key={o}
                            type="radio"
                            name="pendapatan"
                            label={o}
                            checked={form.pendapatan === o}
                            onChange={() => set("pendapatan", o)}
                          />
                        ))}
                      </div>
                    </fieldset>

                    <Field
                      id="cerita"
                      label="Ceritakan Bisnis yang Sedang Anda Jalankan, Ide Bisnis yang Anda Miliki, atau Rencana Bisnis yang Ingin Anda Wujudkan."
                    >
                      <textarea
                        id="cerita"
                        rows={4}
                        value={form.cerita}
                        onChange={(e) => set("cerita", e.target.value)}
                        placeholder="Contoh: jenis usaha yang sedang dijalankan atau ide bisnis Anda, produk/jasa yang ditawarkan, target pasar, dan rencana Anda untuk bisnis di Korea."
                        className={cls()}
                      />
                    </Field>
                  </div>
                )}

                {/* ---------- Tahap 3 ---------- */}
                {step === 2 && (
                  <div className="mt-6 space-y-6">
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-900">
                        Apa tujuan utama Anda mengikuti program ini?
                        <span className="ml-0.5 text-red-600">*</span>
                      </legend>
                      <p className="mb-2 mt-1 text-xs text-gray-500">
                        Boleh pilih lebih dari satu sesuai tujuan Anda.
                      </p>
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
                        options={[
                          ...simple(SUMBER),
                          { value: STATUS_LAIN, label: "Tuliskan sendiri" },
                        ]}
                        placeholder="Pilih salah satu"
                      />
                      {form.sumber === STATUS_LAIN && (
                        <div className="mt-2">
                          <OtherInput
                            id="sumber-lain"
                            value={form.sumberLain}
                            onChange={(v) => set("sumberLain", v)}
                            placeholder="Contoh: YouTube, seminar, komunitas"
                          />
                        </div>
                      )}
                    </Field>

                    <div>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm leading-6 transition-colors ${
                          errors.setuju
                            ? "border-red-400 bg-red-50/40"
                            : form.setuju
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.setuju}
                          onChange={(e) => set("setuju", e.target.checked)}
                          className="mt-1 h-4 w-4 shrink-0 accent-gray-900"
                          aria-invalid={!!errors.setuju}
                        />
                        <span className="text-gray-700">
                          <span className="font-medium text-gray-900">
                            Persetujuan penggunaan data
                            <span className="ml-0.5 text-red-600">*</span>
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
              <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-8">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  >
                    Kembali
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">
                    <span className="text-red-600">*</span> wajib diisi
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
