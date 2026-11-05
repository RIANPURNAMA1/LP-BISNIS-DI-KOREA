import ScrollReveal from "@/components/ScrollReveal";
import DokumentasiKegiatan from "@/components/DokumentasiKegiatan";
import {
  Award,
  BadgeCheck,
  Building2,
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

export default function Mentor() {
  return (
    <section
      id="mentor"
      className="relative scroll-mt-20 overflow-x-clip border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2"
    >
      {/*
        Mobile: Foto → Penjelasan → Dokumentasi
        Desktop: baris 1 = Foto (kiri) + Penjelasan (kanan), baris 2 = Dokumentasi
      */}
      <div className="mx-auto grid w-full max-w-[1200px] gap-x-14 gap-y-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-y-20 lg:px-8">
        {/* ============ FOTO ============ */}
        <ScrollReveal
          direction="left"
          className="min-w-0 pb-6 lg:col-span-5 lg:col-start-1 lg:row-start-1"
        >
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
        </ScrollReveal>

        {/* ============ PENJELASAN ============ */}
        <ScrollReveal
          direction="right"
          delay={80}
          className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ocean">
            <span aria-hidden className="h-px w-8 bg-ocean" />
            Bangun Kepercayaan
          </p>

          <h2 className="text-balance break-words text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Dibimbing oleh Praktisi yang Sudah Menjalani{" "}
            <span className="text-ocean">Bisnis di Korea!</span>
          </h2>

          {/* Satu panel berisi 4 poin, dipisah garis, bukan 4 kartu terpisah */}
          <ul className="mt-8 divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {credentials.map(({ icon: Icon, before, strong, after }) => (
              <li
                key={strong}
                className="flex items-start gap-4 px-5 py-4 sm:px-6 sm:py-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ocean/10 text-ocean">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <p className="min-w-0 break-words pt-1.5 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                  {before}
                  <strong className="font-semibold text-deep">{strong}</strong>
                  {after}
                </p>
              </li>
            ))}
          </ul>

          {/* Kutipan */}
          <blockquote className="relative mt-8 overflow-hidden rounded-2xl bg-deep px-6 py-7 text-white sm:px-8 sm:py-8">
            <Quote
              aria-hidden
              className="absolute -right-2 -top-2 h-24 w-24 text-white/10"
              strokeWidth={1.5}
            />
            <div
              aria-hidden
              className="absolute left-0 top-0 h-full w-1.5 bg-ocean"
            />
            <p className="relative text-balance break-words text-lg font-bold leading-snug tracking-tight sm:text-2xl">
              Belajar bukan hanya dari teori, tetapi dari pengalaman membangun
              bisnis secara langsung!
            </p>
            <footer className="relative mt-4 text-sm font-medium text-white/70">
              Gilar Budi Raharja
            </footer>
          </blockquote>
        </ScrollReveal>

        {/* ============ DOKUMENTASI ============ */}
        <div className="min-w-0 lg:col-span-12 lg:row-start-2">
          <DokumentasiKegiatan />
        </div>
      </div>
    </section>
  );
}