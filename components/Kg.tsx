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

export default function Mentor() {
  return (
    <section className="border-t border-gray-100 bg-white py-12 lg:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
        {/* FOTO (kiri) */}
        <div className="lg:col-span-5">
          <div className="relative">
            {/* Dekorasi latar */}
            {/* <div
              aria-hidden="true"
              className="absolute -top-3 -left-3 hidden h-full w-full rounded-3xl bg-ocean/10 sm:block"
            /> */}

            {/* Foto utama: Gilar */}
            <div className="relative overflow-hidden ">
              <img
                src="gilar.png"
                alt="Gilar Budi Raharja, Founder & Business Mentor"
                className="h-80 w-full object-cover sm:h-[26rem] lg:h-[30rem]"
                loading="lazy"
              />
              {/* <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-deep/60 via-transparent to-transparent"
              /> */}
            </div>

            {/* Kartu nama mengambang */}
            <div className="absolute -bottom-5 left-4 right-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-lg sm:left-auto sm:right-6 sm:min-w-[16rem]">
              <p className="text-base font-bold leading-tight text-deep">
                Gilar Budi Raharja
              </p>
              <p className="mt-1 text-xs font-medium text-ocean">
                Founder &amp; Business Mentor
              </p>
            </div>
          </div>

          {/* Dokumentasi kegiatan */}
          <div className="mt-12 grid grid-cols-2 gap-3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfTseT2DTTqGrWX4vFpyDRlMBRoH5SvlqPGm3YoUFXCHaW9eQXBMOI2Whq&s=10"
              alt="Dokumentasi kegiatan mentoring bisnis"
              className="aspect-[4/3] w-full rounded-2xl border border-gray-200 object-cover"
              loading="lazy"
            />
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAgMZX-1pT6VF68C1uSwGKhl26ar2cYKQPoetyOoP2Dp8tXxm1kq3coySp&s=10"
              alt="Dokumentasi kegiatan bersama peserta"
              className="aspect-[4/3] w-full rounded-2xl border border-gray-200 object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* PENJELASAN (kanan) */}
        <div className="lg:col-span-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            Bangun Kepercayaan
          </p>

          <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Dibimbing oleh Praktisi yang Sudah Menjalani Bisnis di Korea!
          </h2>

          <ul className="mt-8 divide-y divide-gray-200 border-y border-gray-200">
            {credentials.map((c, i) => (
              <li key={i} className="flex gap-4 py-4">
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
                <p className="text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                  {c.before}
                  <strong className="font-semibold text-deep">{c.strong}</strong>
                  {c.after}
                </p>
              </li>
            ))}
          </ul>

          <blockquote className="mt-8 border-l-4 border-ocean pl-5">
            <p className="text-lg font-bold leading-snug tracking-tight text-deep sm:text-xl">
              Belajar bukan hanya dari teori, tetapi dari pengalaman membangun
              bisnis secara langsung!
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}