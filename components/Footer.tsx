export default function Footer() {
  return (
    <footer
      id="kontak"
      className="relative bg-deep text-white px-6 lg:px-14 pt-20 pb-12 overflow-hidden"
    >
      {/* Full background decorative layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ocean/20 rounded-full blur-[120px]"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-sky/15 rounded-full blur-[120px]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-40"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 grid md:grid-cols-12 gap-12 md:gap-16">
        {/* Brand */}
        <div className="md:col-span-5">
          <p className="text-3xl font-bold leading-snug tracking-tight">
           <img src="/logo2.png" alt="Logo IKBP" className="w-48 mb-4" />
          </p>
          <p className="mt-5 text-sm text-white/70 max-w-xl leading-7">
            Forum kemitraan strategis dan dialog bilateral industri Indonesia-Korea.
          </p>
          <div className="mt-6">
            <p className="text-lg font-extrabold tracking-tight text-white">
              BISNIS DI KOREA
            </p>
            <p className="mt-1 text-sm text-white/70">
              Rintis dan Kembangkan Bisnis di Korea.
            </p>
          </div>
        </div>

        {/* Navigasi */}
        <div className="md:col-span-3">
          <p className="text-sm font-semibold mb-4 uppercase tracking-wider text-white/80">
            Navigasi
          </p>
          <ul className="space-y-3 text-sm text-white/65">
            <li>
              <a href="#beranda" className="hover:text-white transition-colors">
                Beranda
              </a>
            </li>
            <li>
              <a href="#sesi" className="hover:text-white transition-colors">
                Sesi Bisnis
              </a>
            </li>
            <li>
              <a href="#kontak" className="hover:text-white transition-colors">
                Kontak
              </a>
            </li>
            <li>
              <a href="#sekretariat" className="hover:text-white transition-colors">
                Sekretariat acara
              </a>
            </li>
          </ul>
        </div>

        {/* Sekretariat acara */}
        <div className="md:col-span-4">
          <p className="text-sm font-semibold mb-4 uppercase tracking-wider text-white/80">
            Sekretariat acara
          </p>
          <ul className="space-y-3 text-sm text-white/65">
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-white/50 mt-0.5">&#9993;</span>
              <a
                href="mailto:sekretariat@ikbusinessproject.id"
                className="hover:text-white transition-colors"
              >
                sekretariat@ikbusinessproject.id
              </a>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-white/50 mt-0.5">&#9742;</span>
              <span>+62 21 5299 3000</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-white/50 mt-0.5">&#9200;</span>
              <span>Senin–Jumat, 08.30–17.30 WIB</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 text-white/50 mt-0.5">&#127968;</span>
              <span>Jakarta &amp; Seoul</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="relative z-10 mt-16 pt-8 border-t border-white/15 text-xs text-white/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <p>
          © 2026 Indonesia-Korea Business Project. Inisiatif kemitraan strategis industri dan
          investasi Indonesia–Korea Selatan.
        </p>
        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="text-white/40">Forum Bilateral Tingkat Eksekutif</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/70">
              #BisnisdiKorea
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/70">
              #StartupKorea
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/70">
              #BusinessIncubation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
