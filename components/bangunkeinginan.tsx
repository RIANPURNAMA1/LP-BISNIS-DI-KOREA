import { ReactNode } from "react";

/* ───────────── Konstanta ───────────── */

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

// Jarak vertikal section + offset agar tidak tertutup navbar fixed saat anchor-scroll
const section = "scroll-mt-20 border-t border-gray-100 bg-white py-12 sm:py-16 lg:py-20";

/* ───────────── Ikon ───────────── */

function Icon({
  className = "h-5 w-5",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  market: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  concept: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  company: (
    <>
      <path d="M4 21V4h10v17M14 9h6v12M2 21h20" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </>
  ),
  legal: (
    <>
      <path d="M12 3v18M5 7h14" />
      <path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7ZM8 21h8" />
    </>
  ),
  visa: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M15 10h3M15 14h3" />
    </>
  ),
};

/* ───────────── Konten ───────────── */

const visi = [
  "Bayangkan memiliki perusahaan sendiri di Korea.",
  "Mengembangkan bisnis dengan pasar internasional.",
  "Membangun sumber penghasilan dari usaha yang Anda miliki.",
];

const hambatan = [
  { label: "Peluang pasar", icon: icons.market },
  { label: "Konsep bisnis", icon: icons.concept },
  { label: "Pendirian perusahaan", icon: icons.company },
  { label: "Legalitas", icon: icons.legal },
  { label: "Visa bisnis", icon: icons.visa },
];

/* ───────────── Halaman ───────────── */

export default function BisnisKorea() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section
        id="beranda"
        className="relative scroll-mt-20 overflow-hidden bg-white"
      >
        {/* Lingkaran dekoratif: kecil & tipis di mobile, penuh di layar besar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full border border-deep/10 sm:-right-24 sm:-top-24 sm:h-[24rem] sm:w-[24rem] lg:-right-10 lg:h-[30rem] lg:w-[30rem]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 hidden h-[16rem] w-[16rem] rounded-full border border-deep/10 sm:block lg:right-24 lg:top-14 lg:h-[18rem] lg:w-[18rem]"
        />

        {/* pt besar = ruang untuk navbar fixed */}
        <div className={`${container} relative pb-12 pt-28 sm:pb-20 sm:pt-36 lg:pb-28 lg:pt-44`}>
          <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-ocean" />
            Bangun Keinginan
          </p>
          <h1 className="max-w-3xl text-balance break-words text-[1.75rem] font-bold leading-tight tracking-tight text-deep sm:text-4xl lg:text-5xl">
            Korea Bukan Hanya Tempat untuk Bekerja.
            <span className="mt-2 block text-ocean">
              Korea Juga Tempat untuk Membangun Bisnis!
            </span>
          </h1>
        </div>
      </section>

      {/* CERITA */}
      <section id="tentang" className={section}>
        <div className={`${container} grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-14`}>
          <p className="max-w-md text-base leading-7 text-gray-600 lg:col-span-5">
            Selama ini, banyak orang Indonesia datang ke Korea untuk bekerja,
            mengumpulkan uang, dan membangun kehidupan yang lebih baik.
          </p>

          <div className="border-l-4 border-ocean pl-4 sm:pl-5 lg:col-span-7 lg:pl-8">
            <p className="text-balance break-words text-xl font-bold leading-snug tracking-tight text-deep sm:text-3xl">
              Tetapi, bagaimana jika Anda bisa melangkah lebih jauh?
            </p>
          </div>
        </div>
      </section>

      {/* VISI */}
      <section className={section}>
        <div className={container}>
          <ul className="divide-y divide-gray-200 border-y border-gray-200">
            {visi.map((teks) => (
              <li
                key={teks}
                className="break-words py-4 text-base font-semibold leading-snug tracking-tight text-deep sm:py-5 sm:text-xl lg:py-6 lg:text-2xl"
              >
                {teks}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MASALAH */}
      <section id="masalah" className={section}>
        <div className={container}>
          <div className="max-w-2xl">
            <h2 className="text-balance break-words text-xl font-bold leading-snug tracking-tight text-gray-900 sm:text-3xl">
              Masalahnya, memulai bisnis di negara asing tidak mudah.
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-500">
              Ada banyak hal yang harus dipahami:
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
            {hambatan.map((h) => (
              <li
                key={h.label}
                // item terakhir melebar di tablet agar tidak ada kotak yatim
                className="flex min-w-0 items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:last:col-span-2 lg:flex-col lg:items-start lg:gap-5 lg:p-5 lg:last:col-span-1"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean/10 text-ocean">
                  <Icon>{h.icon}</Icon>
                </span>
                <span className="min-w-0 break-words text-sm font-semibold text-deep sm:text-base lg:text-sm">
                  {h.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PENUTUP */}
      <section id="kontak" className={section}>
        <div className={container}>
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-gray-500 sm:text-lg">
              Anda tidak harus mencari tahu semuanya sendirian.
            </p>
            <p className="mt-2 text-balance break-words text-xl font-bold leading-snug tracking-tight text-deep sm:text-3xl">
              Kami siap mendampingi perjalanan Anda!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}