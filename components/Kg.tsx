const credentials = [
  {
    before: "Mengelola ",
    strong: "4 bisnis",
    after: " di Korea Selatan.",
  },
  {
    before: "Telah mementori ",
    strong: "ratusan orang",
    after: " dalam pengembangan bisnis dan entrepreneurship.",
  },
  {
    before: "Berpengalaman membangun dan mengembangkan ",
    strong: "bisnis Indonesia-Korea",
    after: ".",
  },
  {
    before: "Telah mendampingi ",
    strong: "lebih dari 20 peserta",
    after: " yang berhasil lolos dalam proses seleksi program startup.",
  },
];

const dokumentasi = [
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfTseT2DTTqGrWX4vFpyDRlMBRoH5SvlqPGm3YoUFXCHaW9eQXBMOI2Whq&s=10",
    alt: "Dokumentasi kegiatan mentoring bisnis",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAgMZX-1pT6VF68C1uSwGKhl26ar2cYKQPoetyOoP2Dp8tXxm1kq3coySp&s=10",
    alt: "Dokumentasi kegiatan bersama peserta",
  },
];

export default function Mentor() {
  return (
    <section
      id="mentor"
      className="scroll-mt-20 overflow-x-clip border-t border-gray-100 bg-white py-12 sm:py-16 lg:py-20"
    >
      {/*
        Urutan di HP/tablet: Foto → Penjelasan → Dokumentasi
        Desktop (lg): kolom kiri = Foto + Dokumentasi, kolom kanan = Penjelasan
      */}
      <div className="mx-auto grid w-full max-w-[1200px] gap-x-14 gap-y-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-y-8 lg:px-8">
        {/* FOTO */}
        <div className="min-w-0 pb-5 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <div className="relative">
          <img
  src="/gilar.png"
  alt="Gilar Budi Raharja, Founder & Business Mentor"
  className="h-auto w-full rounded-2xl"
  loading="lazy"
/>
            {/* Kartu nama mengambang */}
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:left-auto sm:right-6 sm:min-w-[16rem] sm:px-5 sm:py-4">
              <p className="break-words text-base font-bold leading-tight text-deep">
                Gilar Budi Raharja
              </p>
              <p className="mt-1 text-xs font-medium text-ocean">
                Founder &amp; Business Mentor
              </p>
            </div>
          </div>
        </div>

        {/* PENJELASAN */}
        <div className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            Bangun Kepercayaan
          </p>

          <h2 className="text-balance break-words text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Dibimbing oleh Praktisi yang Sudah Menjalani Bisnis di Korea!
          </h2>

          <ul className="mt-6 divide-y divide-gray-200 border-y border-gray-200 sm:mt-8">
            {credentials.map((c, i) => (
              <li key={i} className="flex gap-3 py-4 sm:gap-4">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ocean/10 text-ocean">
                  <svg
                    className="h-4 w-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="m5 13 4 4L19 7"
                    />
                  </svg>
                </span>
                <p className="min-w-0 break-words text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                  {c.before}
                  <strong className="font-semibold text-deep">{c.strong}</strong>
                  {c.after}
                </p>
              </li>
            ))}
          </ul>

          <blockquote className="mt-6 border-l-4 border-ocean pl-4 sm:mt-8 sm:pl-5">
            <p className="text-balance break-words text-lg font-bold leading-snug tracking-tight text-deep sm:text-xl">
              Belajar bukan hanya dari teori, tetapi dari pengalaman membangun
              bisnis secara langsung!
            </p>
          </blockquote>
        </div>

        {/* DOKUMENTASI */}
        <div className="grid min-w-0 grid-cols-2 gap-3 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          {dokumentasi.map((d) => (
            <img
              key={d.alt}
              src={d.src}
              alt={d.alt}
              className="aspect-[4/3] w-full rounded-2xl border border-gray-200 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}