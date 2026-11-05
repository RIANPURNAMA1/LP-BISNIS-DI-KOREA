import ScrollReveal from "@/components/ScrollReveal";

const benefits = [
  {
    title: "Business Opportunity",
    desc: "Mengenali peluang bisnis potensial di Korea.",
    icon: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  },
  {
    title: "Business Mentoring",
    desc: "Bimbingan langsung dari praktisi bisnis.",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    title: "Startup Development",
    desc: "Menyusun Business Plan.",
    icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6",
  },
  {
    title: "Startup Incubation",
    desc: "Pendampingan pengembangan konsep startup.",
    icon: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  },
  {
    title: "Business Establishment",
    desc: "Arahan aspek legal dan hukum di Korea.",
    icon: "M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2",
  },
  {
    title: "Business Visa Guidance",
    desc: "Bimbingan visa bisnis yang relevan.",
    icon: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM15 10h3M15 14h3M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M9 11h.01",
  },
];

const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

export default function Benefits() {
  return (
    <section className="border-t border-gray-100 py-16 sm:py-20">
      <div className={container}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* ============ KIRI: HEADER (sticky di desktop) ============ */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
            <ScrollReveal>
              <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
                Dari Ide Menjadi Startup yang Siap Dirintis di Korea!
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Bersama bisnisdikorea.com, Anda akan mendapatkan:
              </p>

              {/* Penutup: ikut menempel bersama header, jadi selalu terlihat */}
              <div className="mt-8 flex items-start gap-4 rounded-2xl border border-ocean/20 bg-ocean/5 p-5 sm:p-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5 13 4 4L19 7"
                    />
                  </svg>
                </span>
                <p className="text-sm font-semibold leading-6 text-deep sm:text-base">
                  Bukan sekadar belajar teori. Anda akan diarahkan untuk
                  mempersiapkan rencana bisnis yang bisa dikembangkan secara
                  nyata.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* ============ KANAN: JALUR 6 LAYANAN ============ */}
          <ol className="min-w-0 lg:col-span-7">
            {benefits.map((b, i) => (
              <li key={b.title} className="relative pb-8 last:pb-0">
                {/* Garis penghubung dari node ini ke node berikutnya */}
                {i < benefits.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-6 top-6 h-full w-px -translate-x-1/2 bg-gray-200"
                  />
                )}

                <ScrollReveal delay={i * 80}>
                  <div className="group flex gap-5">
                    <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-ocean transition-colors duration-300 group-hover:border-ocean group-hover:bg-ocean group-hover:text-white">
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

                    <div className="min-w-0 pt-0.5">
                      <span className="text-xs font-semibold tabular-nums text-ocean">
                        0{i + 1}
                      </span>
                      <h3 className="mt-0.5 text-lg font-bold leading-tight text-deep">
                        {b.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}