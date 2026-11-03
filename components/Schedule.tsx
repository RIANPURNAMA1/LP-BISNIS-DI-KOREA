const steps = [
  {
    session: "Sesi 1",
    time: "09:00 WIB",
    title: "Sidang Pleno Bilateral",
    desc: "Pemaparan makroekonomi oleh perwakilan kementerian perindustrian kedua negara serta arahan kebijakan korporasi utama.",
  },
  {
    session: "Sesi 2",
    time: "11:30 WIB",
    title: "Seminar Sektoral Terfokus",
    desc: "Tiga ruang paralel membedah regulasi modal, hilirisasi manufaktur, dan kesiapan infrastruktur transfer teknologi digital.",
  },
  {
    session: "Sesi 3",
    time: "14:00 WIB",
    title: "Janji Temu B2B Terkurasi",
    desc: "Sesi tatap muka eksklusif 40 menit per meja runding antara direksi terpilih sesuai pencocokan sektor industri.",
  },
  {
    session: "Sesi 4",
    time: "18:30 WIB",
    title: "Resepsi Jaringan Eksekutif",
    desc: "Forum informal petang untuk memfinalisasi nota kesepahaman awal dan menyusun tindak lanjut operasional kemitraan.",
  },
];

export default function Schedule() {
  return (
    <section id="jadwal" className="py-16 lg:py-24 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12 lg:mb-16">
          <p className="text-sm font-semibold text-ocean mb-3 uppercase tracking-wider">
            Struktur hari
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Jadwal simposium terpadu
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-500">
            Empat sesi berurutan dalam satu hari, dari forum kebijakan hingga
            pertemuan bisnis tatap muka.
          </p>
        </div>

        {/* Timeline */}
        <ol className="relative grid gap-6 lg:grid-cols-4 lg:gap-6">
          {/* Garis mobile (vertikal) */}
          <div
            aria-hidden="true"
            className="absolute left-5 top-5 bottom-5 w-px bg-gray-200 lg:hidden"
          />
          {/* Garis desktop (horizontal) */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-5 left-5 right-5 h-px bg-gray-200"
          />

          {steps.map((s, i) => (
            <li key={s.title} className="relative pl-14 lg:pl-0">
              {/* Nomor */}
              <div className="absolute left-0 top-0 lg:static z-10 grid place-items-center w-10 h-10 rounded-full bg-white border-2 border-ocean text-sm font-bold text-ocean lg:mb-5">
                {i + 1}
              </div>

              {/* Kartu */}
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-ocean/40 hover:shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ocean">
                    {s.session}
                  </span>
                  <span className="text-gray-300">•</span>
                  <time className="text-xs font-semibold text-gray-600">
                    {s.time}
                  </time>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="mt-14 lg:mt-20 rounded-3xl bg-deep px-6 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
              Kuota terbatas
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Amankan kursi delegasi Anda
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/70">
              Slot temu bisnis 1-on-1 dibatasi ketat demi menjaga relevansi
              mitra dialog.
            </p>
          </div>

          <a
            href="#sesi"
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-white pl-8 pr-3 py-3 text-sm font-semibold text-deep transition hover:bg-gray-100 focus-ring"
          >
            Pilih Sesi Janji Temu
            <span className="grid place-items-center w-8 h-8 rounded-full bg-deep text-white">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}