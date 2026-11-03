const hashtags = ["#BisnisdiKorea", "#StartupKorea", "#BusinessIncubation"];

export default function Cta() {
  return (
    <section className="border-t  px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-[1200px] mx-auto">
        {/* PANEL CTA */}
        <div className="relative overflow-hidden  px-6 py-10 sm:px-12 sm:py-14">
          {/* Lingkaran dekoratif */}
         

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            {/* Teks */}
            <div className="lg:col-span-7">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-deep sm:text-3xl lg:text-4xl">
                Kesempatan Membangun Bisnis di Korea Tidak Harus Menunggu
                Sampai Nanti!
              </h2>

              <p className="mt-5 text-base leading-7 text-gray-600">
                Semakin cepat Anda memulai persiapan, semakin cepat Anda bisa
                mengambil langkah menuju masa depan sebagai entrepreneur.
              </p>
              <p className="mt-3 text-base leading-7 text-gray-600">
                Program ini memiliki kuota terbatas agar setiap peserta
                mendapatkan proses pendampingan yang lebih terarah.
              </p>

              <p className="mt-6 border-l-4 border-ocean pl-4 text-base font-semibold leading-7 text-deep sm:text-lg">
                Jangan hanya menjadi penonton kesuksesan orang lain. Mulailah
                membangun bisnis Anda sendiri!
              </p>
            </div>

            {/* Aksi */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-bold uppercase tracking-widest text-ocean">
                  Daftarkan diri Anda sekarang!
                </p>

                <a
                  href="#"
                  className="mt-5 flex w-full items-center justify-between gap-3 rounded-full bg-[#FB3F11] py-3 pl-7 pr-3 text-sm font-semibold text-white transition-colors hover:bg-ocean focus:outline-none focus-visible:ring-4 focus-visible:ring-ocean/30"
                >
                  Join Program Inkubasi Bisnis
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-deep text-white"
                  >
                    →
                  </span>
                </a>

                <p className="mt-4 text-sm leading-6 text-gray-500">
                  Konsultasikan rencana Anda bersama tim Bisnis di Korea.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}