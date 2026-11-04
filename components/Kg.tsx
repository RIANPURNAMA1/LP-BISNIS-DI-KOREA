import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Building2,
  Camera,
  Handshake,
  Quote,
  Users,
  type LucideIcon,
} from "lucide-react";

const credentials: {
  icon: LucideIcon;
  before: string;
  strong: string;
  after: string;
}[] = [
  {
    icon: Building2,
    before: "Mengelola ",
    strong: "4 bisnis",
    after: " di Korea Selatan.",
  },
  {
    icon: Users,
    before: "Telah mementori ",
    strong: "ratusan orang",
    after: " dalam pengembangan bisnis dan entrepreneurship.",
  },
  {
    icon: Handshake,
    before: "Berpengalaman membangun dan mengembangkan ",
    strong: "bisnis Indonesia-Korea",
    after: ".",
  },
  {
    icon: Award,
    before: "Telah mendampingi ",
    strong: "lebih dari 20 peserta",
    after: " yang berhasil lolos dalam proses seleksi program startup.",
  },
];

const dokumentasi = [
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfTseT2DTTqGrWX4vFpyDRlMBRoH5SvlqPGm3YoUFXCHaW9eQXBMOI2Whq&s=10",
    alt: "Dokumentasi kegiatan mentoring bisnis",
    caption: "Sesi mentoring bisnis",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAgMZX-1pT6VF68C1uSwGKhl26ar2cYKQPoetyOoP2Dp8tXxm1kq3coySp&s=10",
    alt: "Dokumentasi kegiatan bersama peserta",
    caption: "Kegiatan bersama peserta",
  },
];

export default function Mentor() {
  return (
    <section
      id="mentor"
      className="relative scroll-mt-20 overflow-x-clip border-t border-gray-100 bg-gradient-to-b from-white via-white to-gray-50/70 px-4 py-16 sm:px-6 sm:py-20 lg:px-2"
    >
      {/* Dekorasi latar */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-ocean/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-ocean/5 blur-3xl"
      />

      {/*
        Urutan di HP/tablet: Foto → Penjelasan → Dokumentasi
        Desktop (lg): kolom kiri = Foto + Dokumentasi, kolom kanan = Penjelasan
      */}
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-x-14 gap-y-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-y-10 lg:px-8">
        {/* ============ FOTO ============ */}
        <div className="min-w-0 pb-6 lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <div className="relative">
            {/* Bingkai offset */}
            <div
              aria-hidden
              className="absolute -left-3 -top-3 h-full w-full rounded-3xl border-2 border-ocean/20 sm:-left-4 sm:-top-4"
            />
            {/* Blok warna di belakang */}
            <div
              aria-hidden
              className="absolute -bottom-3 -right-3 h-2/3 w-2/3 rounded-3xl bg-ocean/10 sm:-bottom-4 sm:-right-4"
            />

            <div className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-xl shadow-gray-300/50 ring-1 ring-black/5">
              <img
                src="/gilar.png"
                alt="Gilar Budi Raharja, Founder & Business Mentor"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
              {/* Gradient lembut di bawah foto agar kartu nama terbaca */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent"
              />
            </div>

            {/* Badge atas */}
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-deep shadow-md backdrop-blur">
              <Building2 className="h-3.5 w-3.5 text-ocean" strokeWidth={2.25} />
              4 Bisnis di Korea
            </div>

            {/* Kartu nama mengambang */}
            <div className="absolute -bottom-6 left-4 right-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-gray-300/40 sm:left-auto sm:right-6 sm:min-w-[17rem] sm:px-5 sm:py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ocean/10 text-ocean">
                <BadgeCheck className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="break-words text-base font-bold leading-tight text-deep">
                  Gilar Budi Raharja
                </p>
                <p className="mt-1 text-xs font-medium text-ocean">
                  Founder &amp; Business Mentor
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============ PENJELASAN ============ */}
        <div className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ocean sm:text-sm">
            <span aria-hidden className="h-px w-8 bg-ocean" />
            Bangun Kepercayaan
          </p>

          <h2 className="text-balance break-words text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Dibimbing oleh Praktisi yang Sudah Menjalani   <span className=" text-ocean">Bisnis di Korea!</span>
          </h2>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {credentials.map(({ icon: Icon, before, strong, after }) => (
              <li
                key={strong}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-ocean/30 hover:shadow-lg hover:shadow-ocean/5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ocean/10 text-ocean transition-colors duration-300 group-hover:bg-ocean group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="mt-4 min-w-0 break-words text-sm leading-6 text-gray-600">
                  {before}
                  <strong className="font-semibold text-deep">{strong}</strong>
                  {after}
                </p>
              </li>
            ))}
          </ul>

          {/* Kutipan */}
          <blockquote className="relative mt-8 overflow-hidden rounded-2xl bg-deep px-6 py-6 text-white sm:px-8 sm:py-7">
            <Quote
              aria-hidden
              className="absolute -right-2 -top-2 h-24 w-24 text-white/10"
              strokeWidth={1.5}
            />
            <div
              aria-hidden
              className="absolute left-0 top-0 h-full w-1.5 bg-ocean"
            />
            <p className="relative text-balance break-words text-lg font-bold leading-snug tracking-tight sm:text-xl">
              Belajar bukan hanya dari teori, tetapi dari pengalaman membangun
              bisnis secara langsung!
            </p>
            <footer className="relative mt-4 text-xs font-medium text-white/70">
              Gilar Budi Raharja
            </footer>
          </blockquote>
        </div>

        {/* ============ DOKUMENTASI ============ */}
        <div className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Camera className="h-4 w-4 text-ocean" />
            Dokumentasi Kegiatan
          </p>
          <div className="grid grid-cols-2 gap-3">
            {dokumentasi.map((d) => (
              <figure
                key={d.alt}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
              >
                <img
                  src={d.src}
                  alt={d.alt}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium text-white">
                  {d.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}