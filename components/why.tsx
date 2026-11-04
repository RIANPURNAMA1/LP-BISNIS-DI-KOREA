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
    desc: "Menyusun Business Model Canvas dan Business Plan.",
    icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6",
  },
  {
    title: "Startup Incubation",
    desc: "Pendampingan pengembangan konsep startup.",
    icon: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  },
  {
    title: "Business Establishment",
    desc: "Arahan persiapan pendirian perusahaan.",
    icon: "M4 21V4h10v17M14 9h6v12M2 21h20M8 8h2M8 12h2M8 16h2",
  },
  {
    title: "Business Visa Guidance",
    desc: "Bimbingan persiapan jalur visa bisnis yang relevan.",
    icon: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM15 10h3M15 14h3M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M9 11h.01",
  },
];

export default function Benefits() {
  return (
    <section className="border-t border-gray-100 py-10 sm:py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            Apa yang Anda dapatkan?
          </p>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Dari Ide Menjadi Startup yang Siap Dirintis di Korea!
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-500">
            Melalui Program Inkubasi Bisnis Startup, Anda akan mendapatkan:
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 transition-all duration-300 hover:border-ocean/40 hover:shadow-lg"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ocean/10 text-ocean transition-transform duration-300 group-hover:-translate-y-0.5">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-deep">{b.title}</h3>
              <p className="text-sm leading-6 text-gray-500">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* PENUTUP */}
        <div className="mt-8 flex items-start gap-4 rounded-2xl border border-ocean/20 bg-ocean/5 p-5 sm:items-center sm:p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean text-white">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </span>
          <p className="text-sm font-semibold leading-6 text-deep sm:text-base">
            Bukan sekadar belajar teori. Anda akan diarahkan untuk mempersiapkan
            rencana bisnis yang bisa dikembangkan secara nyata.
          </p>
        </div>
      </div>
    </section>
  );
}