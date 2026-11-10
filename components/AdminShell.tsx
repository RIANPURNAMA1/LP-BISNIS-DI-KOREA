"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  Globe,
  LogOut,
  UserCircle2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pendaftaran", label: "Data Pendaftar", icon: ClipboardList },
  { href: "/admin/profil", label: "Profil", icon: UserCircle2 },
];

function AdminNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0052A4] text-white">
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Indonesia-Korea Business Project</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <Link
                href="/admin/profil"
                title="Buka profil"
                className="hidden items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-[#0052A4] sm:inline-flex"
              >
                <UserCircle2 className="h-4 w-4" />
                {session.user.name || session.user.email}
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-[#0052A4] text-[#0052A4]"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Jangan tampilkan layout admin di halaman login
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}