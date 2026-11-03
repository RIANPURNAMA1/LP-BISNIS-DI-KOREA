// GANTI kutipan, nama, dan keterangan dengan ucapan asli peserta.
const photos = [
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Peserta yang lolos seleksi program startup",
    quote:
      "Dulu saya hanya berpikir untuk bekerja. Setelah ikut pendampingan, saya punya rencana bisnis yang jelas.",
    name: "Nama Peserta 1",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Mentornya benar-benar praktisi. Saya dibantu menyusun Business Model Canvas sampai siap dipresentasikan.",
    name: "Nama Peserta 2",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Saya tidak lagi bingung soal legalitas dan visa bisnis. Semua diarahkan tahap demi tahap.",
    name: "Nama Peserta 3",
    note: "Lolos seleksi program startup",
  },
  {
    src: "https://glints.com/id/lowongan/wp-content/uploads/2023/01/testimoni-adalah-glints.jpg",
    alt: "Dokumentasi peserta yang lolos seleksi",
    quote:
      "Bukan sekadar teori. Saya langsung diarahkan menyiapkan rencana bisnis yang bisa dijalankan.",
    name: "Nama Peserta 4",
    note: "Lolos seleksi program startup",
  },
];

function TestimoniCard({ p }: { p: (typeof photos)[number] }) {
  return (
    <figure className="mb-4 flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <img
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
        src={p.src}
        alt={p.alt}
        loading="lazy"
      />
      <div className="min-w-0">
        <blockquote className="text-sm leading-6 text-gray-600">
          “{p.quote}”
        </blockquote>
        <figcaption className="mt-3">
          <p className="text-sm font-bold text-deep">{p.name}</p>
          <p className="text-xs text-gray-500">{p.note}</p>
        </figcaption>
      </div>
    </figure>
  );
}

export default function Testimoni() {
  return (
    <section className="border-t border-gray-100 bg-white py-12 lg:py-16">
      {/* Animasi scroll vertikal (tanpa perlu ubah tailwind.config) */}
      <style>{`
        @keyframes marquee-down {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        .marquee-down { animation: marquee-down 30s linear infinite; }
        .marquee-wrap:hover .marquee-down { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-down { animation: none; transform: none; }
          .marquee-wrap { overflow-y: auto; }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Mereka Sudah Memulai Langkahnya. Sekarang Giliran Anda!
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-500">
            Lihat pengalaman peserta yang telah mengikuti pendampingan dan
            berhasil melangkah menuju impian membangun bisnis di Korea.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-12">
          {/* VIDEO TESTIMONI 1 (kiri) */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              <video
                className="aspect-video h-auto w-full max-w-full rounded-xl bg-deep object-cover"
                controls
                preload="metadata"
                poster="/images/testimoni-1-poster.jpg"
                aria-label="Video testimoni peserta 1"
              >
                <source src="/videos/testimoni-1.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* TESTIMONI FOTO BERGERAK (kanan) */}
          <div className="lg:col-span-5">
            <div className="marquee-wrap relative h-[32rem] overflow-hidden  sm:h-[36rem] lg:h-[40rem]">
              {/* Track: daftar digandakan agar loop mulus */}
              <div className="absolute inset-x-0 top-0 p-4">
                <div className="marquee-down">
                  {photos.map((p, i) => (
                    <TestimoniCard key={`a-${i}`} p={p} />
                  ))}
                  <div aria-hidden="true">
                    {photos.map((p, i) => (
                      <TestimoniCard key={`b-${i}`} p={p} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Gradasi atas & bawah */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white via-white/80 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}