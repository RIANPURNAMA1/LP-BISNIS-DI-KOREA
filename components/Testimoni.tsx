"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { BriefcaseBusiness, Building2, Globe2, User } from "lucide-react";

const experts = [
  {
    src: "https://images.openai.com/static-rsc-4/zrpTegMUk3r9qUyp1zBjvsK-47e86yDv6dPa4icWNLwXVQyRXhuWm8U8eG1jXaBq6IUmfKLCxEyFuWAE7aOW7Y5OekVjPIrNXmuCPeFFRhmQsTjEOTdKQeayTu7OZs2JivGqojwWYkFPdbvFy3iCshbyMkYuWohP5eNwmkFOe0xh1N3bbtZRyJmsDjO0ISxu?purpose=fullsize",
    alt: "Profil praktisi bisnis internasional",
    name: "Nama Narasumber 1",
    role: "Praktisi Bisnis Internasional",
    organization: "Nama Perusahaan / Institusi",
    expertise: "Pengembangan Bisnis",
    description:
      "Memiliki pengalaman dalam pengembangan usaha, strategi bisnis, serta membangun peluang kerja sama antara Indonesia dan Korea Selatan.",
  },
  {
    src: "https://images.openai.com/static-rsc-4/CyKn6hYd21nfIsDku3LeRe-SujJuxx2BaJ2c8atmtqS8Ar5DkJGnOs6FvYE8dkXct528vY6-qLw3uiD1dhkG3Tj7oIPnthnrFTUv0wYwsQ2Y4mYfchC0_BsuGt1p5A1HGzrNi-8pYBt-ImY3tYvOMNg5l9lVIiyV08FPR9W5XozmzxTiUByujyW3MopK_ORh?purpose=fullsize",
    alt: "Profil ahli pengembangan startup",
    name: "Nama Narasumber 2",
    role: "Startup Development Expert",
    organization: "Nama Perusahaan / Institusi",
    expertise: "Pengembangan Startup",
    description:
      "Berfokus pada pengembangan model bisnis, validasi ide usaha, strategi startup, dan persiapan pengembangan bisnis yang berkelanjutan.",
  },
  {
    src: "https://images.openai.com/static-rsc-4/9Xul4up-QDJMjJpctO___hEdLR9npRLcFARgr6eafOpeMhFae2ozh5Sp05C4_l2fKCn1MaTWzmDz5BYJrpPQXfdIHUwHHgin-DZsqJ1mtIt6pzamp0zjSjC6MuFkO1qy_Okx_-OrLvL7oXjTYtrIwE5f7dYe9W1lalH7YwcZZgjZRjHjWo6KBiB5n7twp1VH?purpose=fullsize",
    alt: "Profil praktisi investasi dan bisnis Korea",
    name: "Nama Narasumber 3",
    role: "Business & Investment Practitioner",
    organization: "Nama Perusahaan / Institusi",
    expertise: "Investasi dan Ekspansi Pasar",
    description:
      "Memahami peluang investasi, strategi memasuki pasar Korea Selatan, serta potensi kolaborasi bisnis lintas negara.",
  },
  {
    src: "https://images.openai.com/static-rsc-4/DAoK4SsYTKKYnZaxWoK2-idFCl6F0r28Yr01_LmFZI2BwgfNjQcKlfnTK87UwiAV4uuUAC4Dak924M0Tv6MqbwM4rqokBKnZ5FUlyH5pT6lPm30qER_soOnGEQvrTrwIH6DixPmFOoRRqoGmp6pKAETZ3do9PLS5Cntmvw1aVdE5MgGDXe7mgjBjEwOyLrpC?purpose=fullsize",
    alt: "Profil ahli ekosistem bisnis Korea Selatan",
    name: "Nama Narasumber 4",
    role: "Korea Business Consultant",
    organization: "Nama Perusahaan / Institusi",
    expertise: "Ekosistem Bisnis Korea",
    description:
      "Memiliki wawasan mengenai lingkungan bisnis Korea Selatan, regulasi usaha, serta berbagai aspek yang perlu dipahami dalam membangun bisnis di Korea.",
  },
];

type Expert = (typeof experts)[number];

const DURASI = 7;
const pad = (n: number) => String(n).padStart(2, "0");

/* Satu komponen foto dengan rasio tetap (16:9) untuk semua gambar */
function FotoNarasumber({
  p,
  className = "",
  decorative = false,
}: {
  p: Expert;
  className?: string;
  decorative?: boolean;
}) {
  const [gagal, setGagal] = useState(false);

  return (
    <div
      className={`relative aspect-[16/9] overflow-hidden bg-gray-100 ${className}`}
    >
      {gagal ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <User className="h-1/2 w-1/2" strokeWidth={1.2} />
        </div>
      ) : (
        <img
          src={p.src}
          alt={decorative ? "" : p.alt}
          width={800}
          height={450}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setGagal(true)}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
    </div>
  );
}

function PanelProfil({
  p,
  index,
  total,
}: {
  p: Expert;
  index: number;
  total: number;
}) {
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <FotoNarasumber p={p} className="w-full" />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ocean">
            <BriefcaseBusiness className="h-4 w-4" strokeWidth={1.8} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {p.expertise}
            </span>
          </div>
          <span className="text-xs font-medium tabular-nums text-gray-400">
            {pad(index + 1)} / {pad(total)}
          </span>
        </div>

        <h3 className="mt-3 text-balance text-xl font-bold leading-tight tracking-tight text-deep sm:text-2xl">
          {p.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-ocean">{p.role}</p>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          {p.description}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-gray-500">
          <Building2
            className="h-4 w-4 shrink-0 text-gray-400"
            strokeWidth={1.8}
          />
          <span className="text-sm">{p.organization}</span>
        </div>
      </div>
    </figure>
  );
}

function BarisNarasumber({
  p,
  index,
  aktif,
  onPilih,
  onSelesai,
}: {
  p: Expert;
  index: number;
  aktif: boolean;
  onPilih: () => void;
  onSelesai: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPilih}
      aria-current={aktif}
      aria-label={`Tampilkan profil ${p.name}`}
      className={`relative flex w-full items-center gap-4 border-b border-gray-200 py-4 pl-5 pr-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean ${
        aktif ? "bg-ocean/5" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`absolute left-0 top-0 h-full w-0.5 bg-ocean transition-opacity ${
          aktif ? "opacity-100" : "opacity-0"
        }`}
      />

      <span
        className={`w-6 shrink-0 text-xs font-semibold tabular-nums ${
          aktif ? "text-ocean" : "text-gray-400"
        }`}
      >
        {pad(index + 1)}
      </span>

      <FotoNarasumber
        p={p}
        decorative
        className={`w-20 shrink-0 rounded-md transition-opacity sm:w-24 ${
          aktif ? "opacity-100" : "opacity-70"
        }`}
      />

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-bold sm:text-base ${
            aktif ? "text-deep" : "text-gray-700"
          }`}
        >
          {p.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-gray-500 sm:text-sm">
          {p.role}
        </span>
      </span>

      {aktif && (
        <span
          key={index}
          aria-hidden="true"
          className="expert-progress absolute bottom-0 left-0 h-0.5 w-full origin-left bg-ocean"
          onAnimationEnd={(e) => {
            if (e.animationName === "expert-progress") onSelesai();
          }}
        />
      )}
    </button>
  );
}

export default function Testimoni() {
  const [aktif, setAktif] = useState(0);
  const n = experts.length;

  const berikutnya = () => setAktif((a) => (a + 1) % n);

  return (
    <section
      id="experts"
      className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2"
    >
      <style>{`
        @keyframes expert-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        .expert-progress {
          animation: expert-progress ${DURASI}s linear forwards;
        }

        @media (hover: hover) {
          .expert-wrap:hover .expert-progress {
            animation-play-state: paused;
          }
        }

        .expert-wrap:has(:focus-visible) .expert-progress {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .expert-progress {
            animation: none;
            transform: none;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <ScrollReveal className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-8 bg-ocean" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-ocean">
              Our Experts
            </span>
          </div>

          <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
            Mengenal Para Profesional di Balik{" "}
            <span className="text-ocean">Peluang Bisnis Indonesia–Korea</span>
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Kenali para praktisi, profesional, dan ahli dari berbagai bidang
            yang memiliki wawasan serta pengalaman dalam dunia bisnis,
            investasi, dan pengembangan usaha Indonesia–Korea.
          </p>
        </ScrollReveal>

        <div className="expert-wrap mt-10 grid gap-6 sm:mt-12 lg:grid-cols-12 lg:items-start lg:gap-10">
          {/* PANEL PROFIL */}
          <ScrollReveal
            delay={100}
            className="min-w-0 lg:order-2 lg:col-span-7"
          >
            <div className="grid">
              {experts.map((p, i) => (
                <div
                  key={p.name}
                  aria-hidden={i !== aktif}
                  className={`col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500 ${
                    i === aktif
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  <PanelProfil p={p} index={i} total={n} />
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* DAFTAR NARASUMBER */}
          <ScrollReveal
            delay={150}
            className="min-w-0 lg:order-1 lg:col-span-5"
          >
            <div
              role="group"
              aria-label="Pilih profil narasumber"
              className="border-t border-gray-200"
            >
              {experts.map((p, i) => (
                <BarisNarasumber
                  key={p.name}
                  p={p}
                  index={i}
                  aktif={i === aktif}
                  onPilih={() => setAktif(i)}
                  onSelesai={berikutnya}
                />
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* FOOTER SECTION */}
        <ScrollReveal delay={200}>
          <div className="mt-10 flex items-start gap-3 border-t border-gray-200 pt-6 sm:mt-12">
            <Globe2
              className="mt-0.5 h-5 w-5 shrink-0 text-ocean"
              strokeWidth={1.8}
            />
            <p className="max-w-2xl text-sm leading-6 text-gray-600">
              Menghubungkan wawasan, pengalaman, dan peluang kolaborasi untuk
              mendukung pengembangan bisnis antara Indonesia dan Korea
              Selatan.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}