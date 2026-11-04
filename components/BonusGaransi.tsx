import ScrollReveal from "@/components/ScrollReveal";

const bonuses = [
  "Bonus konsultasi awal pengembangan ide bisnis.",
  "Template Business Model Canvas.",
  "Panduan persiapan startup di Korea.",
  "Akses komunitas dan networking bisnis.",
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-ocean"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 12.5 2.8 2.8L16 9.7"
      />
    </svg>
  );
}

export default function BonusGaransi() {
  return (
    <section className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2">
      <div className="mx-auto max-w-[1200px]">
        <div className="relative overflow-hidden">
          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:gap-16 lg:p-14">
            {/* BONUS PESERTA */}
            <ScrollReveal className="lg:col-span-7">
              <h2 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
                Bergabunglah dan Dapatkan Lebih dari  <span className=" text-ocean">Sekadar Pembelajaran!</span>
              </h2>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-gray-500">
                Bonus Peserta
              </h3>

              <ul className="mt-4 space-y-3">
                {bonuses.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-base leading-7 text-deep">{b}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            {/* KOMITMEN PENDAMPINGAN */}
            <ScrollReveal
              delay={120}
              className="lg:col-span-5 lg:border-l lg:border-gray-200 lg:pl-12"
            >
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
                <span aria-hidden className="h-px w-8 bg-ocean" />
                Komitmen Pendampingan
              </p>

              <p className="mt-4 text-base leading-7 text-deep">
                Kami berkomitmen memberikan arahan dan pendampingan sesuai
                tahapan program. Jika Anda belum memahami langkah berikutnya,
                kami membantu mengarahkan proses persiapan Anda.
              </p>

              <p className="mt-6 text-xs leading-5 text-gray-500 sm:text-sm">
                Program ini tidak menjamin persetujuan visa maupun keberhasilan
                bisnis.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
