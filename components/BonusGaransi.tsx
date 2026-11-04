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
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 12.5 2.8 2.8L16 9.7" />
    </svg>
  );
}

export default function BonusGaransi() {
  return (
    <section className="border-t border-gray-100 py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* BONUS PESERTA */}
          <div className="lg:col-span-7">
            <h2 className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
              Bergabunglah dan Dapatkan Lebih dari Sekadar Pembelajaran!
            </h2>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-widest text-gray-500">
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
          </div>

          {/* KOMITMEN PENDAMPINGAN */}
          <div className="lg:col-span-5 lg:border-l lg:border-gray-200 lg:pl-12">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-ocean">
              Komitmen Pendampingan
            </h3>

            <p className="mt-4 text-base leading-7 text-deep">
              Kami berkomitmen memberikan arahan dan pendampingan sesuai tahapan
              program. Jika Anda belum memahami langkah berikutnya, kami membantu
              mengarahkan proses persiapan Anda.
            </p>

            <p className="mt-6 text-xs leading-5 text-gray-500 sm:text-sm">
              Program ini tidak menjamin persetujuan visa maupun keberhasilan
              bisnis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}