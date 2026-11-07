import Cta from "./Cta";

const MENTORS = [
  {
    label: "Dibimbing penuh oleh:",
    name: "Kang Gilar",
    img: "/seminarcianjur/7.webp",
    items: [
      "+15 Tahun berkarier & bisnis di Korea",
      "Mentor Bisnis Indonesia-Korea",
      "Founder 4 Bisnis Indonesia-Korea",
    ],
  },
  {
    label: "Dipandu oleh:",
    name: "Kang Bara",
    img: "/seminarcianjur/6.webp",
    items: [
      "CEO Indonesia Sukses Mendunia",
      "Mentor Karir di Korea",
      "Pengusaha di Indonesia",
    ],
  },
];
/* Badge pill: border gradasi + kilau otomatis */
function Badge({
  children,
  tone = "navy",
  dot = false,
}: {
  children: React.ReactNode;
  tone?: "navy" | "light";
  dot?: boolean;
}) {
  const inner =
    tone === "navy" ? "bg-[#0C2342] text-white" : "bg-white text-red-600";
  return (
    <span className="badge-glow absolute -top-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full p-[2px]">
      <span
        className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full px-5 py-2 text-[13px] font-extrabold tracking-tight ${inner}`}
      >
        {dot && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
        )}
        {children}
        <span className="badge-shine pointer-events-none absolute inset-y-0 -left-full w-1/2" />
      </span>
    </span>
  );
}

/* Ikon ceklis emoji */
function Check() {
  return (
    <span className="shrink-0 text-[18px] leading-snug" aria-hidden="true">
      ✅
    </span>
  );
}

export default function SeminarCianjurPage() {
  return (
    <main className="mx-auto w-full max-w-3xl bg-white pb-28 text-slate-800">
      {/* ===== 1. HERO ===== */}
      <section className="bg-white px-5 pb-8 pt-10 text-center text-slate-900">
        {/* Judul */}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          Seret bin Mandeg Bisnis di Cianjur?
          <span className="block text-red-600">
            Coba Indonesia-Korea Business Project
          </span>
        </h1>

        {/* Kartu checklist + badge menimpa */}
        <div className="relative mx-auto mt-10 w-full rounded-xl border-2 border-[#0C2342] bg-white px-4 pb-4 pt-9 text-left shadow-[0_0_10px_rgba(12,35,66,0.18)]">
          <Badge>Potensi Income Puluhan, Ratusan, Miliaran</Badge>

          <ul className="space-y-4 text-[14px] leading-snug text-slate-700">
            <li className="flex items-start gap-3">
              <Check />
              <p>
                <b className="text-slate-900">Start:</b> 3-6 bulan jalankan
                bisnis di Indonesia.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Check />
              <p>
                <b className="text-slate-900">Next:</b> Kembangkan bisnis Anda
                di Korea.
              </p>
            </li>
          </ul>
        </div>

        {/* Poster + badge menimpa */}
        <div className="relative mx-auto mt-12 w-full">
          <Badge tone="light" dot>
            Indonesia-Korea Business Project
          </Badge>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/poster.png"
            alt="Poster Indonesia-Korea Business Project"
            className="w-full rounded-xl shadow-lg shadow-black/10"
          />
        </div>
      </section>

      {/* ===== 2. MENTOR ===== */}
      <section className="bg-white px-5 py-10 text-center text-slate-900">
        <div className="mx-auto w-full space-y-16">
          {MENTORS.map((m) => (
            <div key={m.name}>
              {/* Label */}
              <p className="text-[18px] font-extrabold tracking-tight text-[#0C2342]">
                {m.label}
              </p>

              {/* Foto besar, memudar ke putih di bagian bawah */}
              <div className="relative mx-auto mt-6 w-full max-w-[320px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.img}
                  alt={m.name}
                  className="aspect-[4/5] w-full object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/80 to-transparent" />
              </div>

              {/* Nama besar menimpa kaki foto */}
              <p className="relative -mt-10 text-5xl font-black tracking-tight text-[#0C2342]">
                {m.name}
              </p>
              <div className="mx-auto mt-3 h-[3px] w-20 rounded-full bg-gradient-to-r from-[#0C2342] to-red-600" />

              {/* Checklist */}
              <ul className="mx-auto mt-6 max-w-[360px] space-y-3 text-left text-[16px] font-bold leading-snug text-[#0C2342]">
                {m.items.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-6 w-6 shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="11" fill="#0C2342" />
                      <path
                        d="M7 12.5l3.2 3.2L17 9"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p>{t}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 4. GRATIS + CTA ===== */}
      <section className="bg-white px-5 py-10 text-left text-slate-900">
        <div className="mx-auto w-full rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          {/* Judul */}
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0C2342]">
            <span className="text-red-600">Gratis</span>, tapi hanya untuk yang
            terpilih:
          </h2>

          {/* Daftar ceklis */}
          <ul className="mt-5 space-y-3 text-[15px] leading-snug text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 font-black text-red-600">✓</span>
              <p>
                Karena <b className="text-[#0C2342]">tempat terbatas</b>.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 font-black text-red-600">✓</span>
              <p>
                Hanya yang <b className="text-[#0C2342]">serius</b> yang boleh
                ikut!
              </p>
            </li>
          </ul>

          {/* Catatan border putus-putus */}
          <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-[14px] leading-snug text-slate-600">
            <b className="text-[#0C2342]">Kurang cocok</b> untuk yang hanya
            ingin coba-coba. Prioritas diberikan kepada yang siap menjalankan
            bisnisnya.
          </div>

          {/* Kotak sorotan */}
          <div className="mt-5 rounded-lg bg-[#0C2342]/5 px-4 py-4 text-[15px] font-extrabold text-[#0C2342]">
            Daftar sekarang sebelum kuota habis.
          </div>
        </div>
      </section>
      <Cta id="daftar-form" />
    </main>
  );
}
