import ScrollReveal from "@/components/ScrollReveal";

export default function Cta() {
  const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";
  return (
    <section
      id="cta"
      className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-2"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="relative overflow-hidden ">
          {/* Decorative accents */}

        

          <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-14">
            {/* Content */}
            <ScrollReveal className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 py-1.5 text-xs font-semibold tracking-wide text-ocean">
                #BisnisdiKorea #StartupKorea
              </span>

              <h2 className="max-w-2xl text-[24px] font-bold leading-[1.15] tracking-tight text-deep sm:text-4xl lg:text-[44px]">
                Kesempatan Membangun Bisnis di Korea{" "}
                <span className=" text-ocean">
                  Tidak Harus Menunggu Sampai Nanti!
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
                Semakin cepat Anda memulai persiapan, semakin cepat Anda bisa
                mengambil langkah menuju masa depan sebagai entrepreneur.
              </p>

              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500">
                Program ini memiliki kuota terbatas agar setiap peserta
                mendapatkan proses pendampingan yang lebih terarah.
              </p>

              <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-deep">
                Jangan hanya menjadi penonton kesuksesan orang lain. Mulailah
                membangun bisnis Anda sendiri!
              </p>
            </ScrollReveal>

            {/* CTA card */}
            <ScrollReveal delay={140} className="lg:col-span-5">
              <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                  BISNIS DI KOREA
                </p>

                <h3 className="mt-3 text-xl font-bold tracking-tight text-deep">
                  DAFTARKAN DIRI ANDA SEKARANG!
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Konsultasikan rencana Anda bersama tim Bisnis di Korea.
                </p>

                <div className="fade-up d3 mt-8 sm:mt-9">
                  <a
                    href="/daftar"
                    className="group flex w-full items-center justify-between gap-3 rounded-full bg-[#E3081C] pl-6 pr-2 py-3 text-base font-bold text-white transition-colors hover:bg-[#B30616] focus-ring sm:inline-flex sm:w-auto sm:justify-start sm:pl-7 sm:pr-2.5 sm:py-2.5 sm:text-sm"
                  >
                    JOIN SEKARANG
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0052A4] text-lg text-white transition-transform group-hover:translate-x-1 sm:h-9 sm:w-9 sm:text-base">
                      →
                    </span>
                  </a>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                  >
                    <path
                      d="M10 2.5 3.5 5v4.2c0 4 2.8 6.8 6.5 8.3 3.7-1.5 6.5-4.3 6.5-8.3V5L10 2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m7.5 10 1.7 1.7 3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Rintis dan Kembangkan Bisnis di Korea.
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
