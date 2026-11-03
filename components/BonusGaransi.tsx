const bonuses = [
  {
    title: "Bonus konsultasi awal pengembangan ide bisnis.",
    icon: "M8 10h8M8 14h5M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  },
  {
    title: "Template Business Model Canvas.",
    icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6",
  },
  {
    title: "Panduan persiapan startup di Korea.",
    icon: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5zM18 19v2H6M9 7h5",
  },
  {
    title: "Akses komunitas dan networking bisnis.",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
];

export default function BonusGaransi() {
  return (
    <section className="border-t border-gray-100  py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            Bonus &amp; Garansi
          </p>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Bergabunglah dan Dapatkan Lebih dari Sekadar Pembelajaran!
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* BONUS PESERTA (kiri) */}
          <div className="lg:col-span-7">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Bonus Peserta
            </h3>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {bonuses.map((b) => (
                <li
                  key={b.title}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-ocean/40 hover:shadow-lg"
                >
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-ocean/10 text-ocean transition-transform duration-300 group-hover:-translate-y-0.5">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={b.icon}
                      />
                    </svg>
                  </span>
                  <p className="text-sm font-semibold leading-6 text-deep sm:text-base">
                    {b.title}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* KOMITMEN PENDAMPINGAN (kanan) */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-2xl border border-ocean/20 bg-ocean/5 p-6 sm:p-8">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-ocean text-white">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3zM9 12l2 2 4-4"
                  />
                </svg>
              </span>

              <h3 className="text-sm font-semibold uppercase tracking-widest text-ocean">
                Komitmen Pendampingan
              </h3>

              <p className="mt-4 text-base leading-7 text-deep">
                Kami berkomitmen memberikan arahan dan pendampingan sesuai
                tahapan program. Jika Anda belum memahami langkah berikutnya,
                kami membantu mengarahkan proses persiapan Anda.
              </p>

              <p className="mt-auto border-t border-ocean/20 pt-5 text-xs leading-5 text-gray-500 sm:text-sm">
                Program ini tidak menjamin persetujuan visa maupun keberhasilan
                bisnis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}