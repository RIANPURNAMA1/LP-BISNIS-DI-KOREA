import Cta from "./Cta";
import Image from "next/image";
import poster from "@/public/poster.png";

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
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
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

          <Image
            src={poster}
            alt="Poster Indonesia-Korea Business Project"
            priority // preload, tidak di-lazy-load
            placeholder="blur" // blur-up selama gambar dimuat
            sizes="(max-width: 768px) 100vw, 480px"
            quality={80}
            className="h-auto w-full rounded-xl shadow-lg shadow-black/10"
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
              <div className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-[320px] overflow-hidden">
                <Image
                  src={m.img}
                  alt={m.name}
                  fill
                  sizes="(max-width: 320px) 100vw, 320px"
                  quality={75}
                  className="object-cover object-top"
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

{/* ===== 4. JADWAL + GRATIS-TERPILIH ===== */}
<section className="bg-white px-5 py-10 text-slate-900">
  <div className="mx-auto w-full overflow-hidden rounded-2xl bg-white text-center shadow-[0_8px_30px_rgba(12,35,66,0.08)] ring-1 ring-slate-100">
    {/* Jadwal */}
    <div className="px-5 py-7">
      <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-red-500">
        Rabu
      </p>
      <p className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-[#0C2342]">
        11 November 2026
      </p>
      <p className="mt-3 inline-block rounded-full bg-[#0C2342]/10 px-4 py-1.5 text-[15px] font-bold text-[#0C2342]">
        9:00 WIB
      </p>
    </div>

    {/* Lokasi */}
    <div className="mx-5 border-t border-dashed border-slate-200 py-5">
      <p className="text-[18px] font-bold leading-tight text-[#0C2342]">
        Seminar Room
      </p>
      <p className="mt-1 text-[15px] leading-snug text-slate-500">
        Bumi Marhamah, Cianjur
      </p>
    </div>

    {/* Gratis-Terpilih */}
    <div className="bg-gradient-to-b from-red-50/70 to-white px-5 py-7">
      <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-red-500">
        Gratis-Terpilih!
      </h2>
      <p className="mt-3 text-[15px] leading-snug text-slate-600">
        Karena <b className="font-semibold text-[#0C2342]">tempat terbatas</b>
        <br />
        dan hanya yang <b className="font-semibold text-[#0C2342]">serius</b>{" "}
        boleh ikut!
      </p>
    </div>
  </div>
</section>
      <Cta id="daftar-form" />
    </main>
  );
}
