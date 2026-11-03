const VIDEO_URL = "https://www.youtube.com/embed/KaLxCiilHns";

export default function Jumbotron() {
  return (
    <section id="janji-temu" className="py-16 lg:py-20">
      <div className="bg-soft rounded-[2rem] p-8 sm:p-12 lg:p-16 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Teks */}
        <div>
          <p className="text-sm font-semibold text-ocean mb-3">Janji temu B2B</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1]">
            Amankan kursi delegasi Anda
          </h2>
          <p className="mt-4 text-sm leading-7 text-deep/60 max-w-md">
            Slot temu bisnis 1-on-1 dibatasi ketat demi menjaga relevansi mitra dialog.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#sesi"
              className="group inline-flex items-center justify-center gap-3 text-sm font-semibold text-white bg-deep hover:bg-ocean rounded-full pl-7 pr-2.5 py-2.5 transition-colors focus-ring"
            >
              Pilih Sesi Janji Temu
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white/20 transition-transform group-hover:translate-x-1">
                <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 12H5m14 0-4 4m4-4-4-4"
                  />
                </svg>
              </span>
            </a>
            <a
              href="#jadwal"
              className="inline-flex items-center justify-center text-sm font-semibold text-deep border border-deep/20 hover:bg-white rounded-full px-7 py-3.5 transition-colors focus-ring"
            >
              Pelajari lebih lanjut
            </a>
          </div>
        </div>

        {/* Video */}
        <div className="w-full">
          <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-card bg-deep/10">
            <iframe
              className="w-full h-full"
              src={VIDEO_URL}
              title="Video Forum Bilateral Indonesia-Korea Business Project"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}