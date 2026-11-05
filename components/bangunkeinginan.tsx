"use client";

import { ReactNode } from "react";
import ScrollReveal from "@/components/ScrollReveal";

/* ───────────── Konstanta ───────────── */

// Padding dalam disamakan dengan CTA
const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

/* ───────────── Animasi ───────────── */

function AnimatedText({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <ScrollReveal className={className} delay={delay}>
      {children}
    </ScrollReveal>
  );
}

/* ───────────── Konten ───────────── */

const paragraf = [
  "Selama ini, banyak orang Indonesia datang ke Korea untuk bekerja dan kuliah, mereka mengumpulkan uang, dan membangun kehidupan yang lebih baik.",
  "Tetapi, sedikit dari mereka yang berbisnis di Korea. Bagaimana jika Anda bisa melangkah lebih jauh?",
  "Bayangkan memiliki bisnis di Korea. Mengembangkan bisnis dengan pasar internasional. Membangun aset yang ke depan terus menghasilkan dari luar negeri.",
  "Masalahnya, memulai bisnis di negara asing tidak mudah. Ada banyak hal yang harus dipahami: peluang pasar, konsep bisnis, pendirian perusahaan, legalitas, hingga visa bisnis.",
];

/* ───────────── Halaman ───────────── */

export default function BisnisKorea() {
  return (
    <section
      id="peluang"
      className="relative scroll-mt-20 overflow-hidden bg-white px-4 sm:px-6 lg:px-2"
    >
      {/* Lingkaran dekoratif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full border border-deep/10 sm:-right-24 sm:-top-24 sm:h-[24rem] sm:w-[24rem] lg:-right-10 lg:h-[30rem] lg:w-[30rem]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 hidden h-[16rem] w-[16rem] rounded-full border border-deep/10 sm:block lg:right-24 lg:top-14 lg:h-[18rem] lg:w-[18rem]"
      />

      <div
        id="tentang"
        className={`${container} relative scroll-mt-20 pb-16 pt-28 sm:pb-20 sm:pt-36 lg:pb-24 lg:pt-40`}
      >
        <div className="max-w-3xl">

          {/* Heading */}
          <AnimatedText delay={100}>
            <h2 className="text-balance break-words text-[1.75rem] font-bold leading-tight tracking-tight text-deep sm:text-4xl lg:text-[38px]">
              Masih Sedikit Orang Indonesia{" "}
              <span className="text-ocean">Berbisnis di Korea!</span>
            </h2>
          </AnimatedText>

          {/* Deskripsi per paragraf */}
          <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-6 lg:mt-10 lg:space-y-8">
            {paragraf.map((teks, index) => (
              <AnimatedText key={teks} delay={200 + index * 100}>
                <p className="break-words text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
                  {teks}
                </p>
              </AnimatedText>
            ))}
          </div>

          {/* Penutup */}
          <div id="kontak" className="mt-8 scroll-mt-20 sm:mt-10 lg:mt-12">
            <AnimatedText delay={600}>
              <p className="text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
                Anda tidak harus mencari tahu semuanya sendirian.
              </p>
              <p className="mt-1 text-balance break-words text-xl font-bold leading-snug tracking-tight text-deep sm:text-2xl">
                Kami siap mendampingi perjalanan Anda!
              </p>
            </AnimatedText>
          </div>
        </div>
      </div>
    </section>
  );
}