"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  Globe,
  LogOut,
  BellRing,
  MessageCircle,
  UserCircle2,
  ChevronDown,
  Search,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pendaftaran", label: "Data Pendaftar", icon: ClipboardList },
  { href: "/admin/pengaturan", label: "Grup WhatsApp", icon: MessageCircle },
  { href: "/admin/notifikasi", label: "Notifikasi WA", icon: BellRing },
  { href: "/admin/profil", label: "Profil", icon: UserCircle2 },
];

/** Tooltip di sebelah kanan ikon; fixed supaya tidak terpotong area scroll sidebar. */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top + r.height / 2, left: r.right + 12 });
  }

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
    >
      {children}
      {pos && (
        <span
          role="tooltip"
          className="tip-in pointer-events-none fixed z-[60] hidden md:block whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{ top: pos.top, left: pos.left }}
        >
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-slate-900" />
          {label}
        </span>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const itemBase =
    "group relative flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition-colors";
  const itemPad = "px-3 md:justify-center md:px-0";

  return (
    <aside
      className={`fixed bottom-3 left-3 top-3 z-50 flex w-64 flex-col rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60 transition-transform duration-200 md:z-40 md:w-[68px] md:translate-x-0 md:shadow-sm ${
        open ? "translate-x-0" : "-translate-x-[110%]"
      }`}
    >
      {/* Logo */}
      <div
        className="flex h-16 shrink-0 items-center justify-between px-4 md:justify-center md:px-0"
      >
        <Tip label="Admin Panel">
        <Link href="/admin" aria-label="Admin Panel" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-[#0052A4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/3.webp"
              alt="Indonesia Korea Business Project"
              className="h-9 w-9 object-contain"
            />
          </span>
          {(
            <span className="min-w-0 leading-tight md:hidden">
              <span className="block truncate text-sm font-bold text-gray-900">Admin Panel</span>
              <span className="block truncate text-[11px] text-gray-500">
                Indonesia-Korea Business
              </span>
            </span>
          )}
        </Link>
        </Tip>
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 md:hidden">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Tip key={item.href} label={item.label}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={`${itemBase} ${itemPad} ${
                  isActive
                    ? "bg-[#0052A4]/10 text-[#0052A4]"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {isActive && (
                  <span className="absolute -left-3 top-2 h-7 w-1 rounded-r bg-[#0052A4]" />
                )}
                <Icon className="h-[19px] w-[19px] shrink-0" />
                <span className="truncate md:hidden">{item.label}</span>
              </Link>
            </Tip>
          );
        })}
      </nav>

    </aside>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    NAV_ITEMS.slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => (i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)))
      ?.label ?? "Admin Panel";

  const name = session?.user?.name || session?.user?.email || "Administrator";
  const email = session?.user?.email || "";
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/admin/pendaftaran?q=${encodeURIComponent(q)}` : "/admin/pendaftaran");
  }

  return (
    <header className="sticky top-3 z-30 flex h-16 items-center gap-3 rounded-2xl bg-white px-3 sm:gap-4 shadow-sm ring-1 ring-slate-200/60 sm:px-6">
      <button
        onClick={onMenu}
        aria-label="Buka menu"
        className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-600 hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="hidden shrink-0 text-lg font-bold text-slate-900 sm:block">{title}</h1>
      <form onSubmit={onSearch} className="relative ml-auto w-full min-w-0 max-w-xs">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari pendaftar..."
          className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
        />
      </form>

      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0052A4] text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-700 md:block">
            {name}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-200 px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
              {email && email !== name && (
                <p className="truncate text-xs text-gray-500">{email}</p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-400">Administrator</p>
            </div>
            <div className="p-1">
              <Link
                href="/admin/profil"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircle2 className="h-4 w-4" /> Profil
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Globe className="h-4 w-4" /> Website
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Desktop: sidebar ikon kecil tetap. Mobile: tersembunyi, dibuka lewat tombol burger.
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  // Jangan tampilkan layout admin di halaman login
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const fullWidth = true;

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#EEF1F8]">
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 overflow-x-hidden px-3 pt-3 md:pl-[92px]">
          <Header onMenu={() => setMenuOpen(true)} />
          <main
            className={
              fullWidth
                ? "w-full py-4"
                : "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
