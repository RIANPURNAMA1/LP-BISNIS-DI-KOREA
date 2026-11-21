import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import type { Role } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const HOME: Record<Role, string> = { admin: "/admin", peserta: "/peserta" };

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const role = (req.auth?.user as { role?: Role } | undefined)?.role;

  const isAdminArea = path.startsWith("/admin");
  const isAdminLogin = path === "/admin/login";
  const isPesertaArea = path.startsWith("/peserta");
  const isPembayaranArea = path.startsWith("/pembayaran");
  const isPesertaLogin = path === "/login";

  const go = (to: string, withCallback = false) => {
    const url = new URL(to, nextUrl.origin);
    if (withCallback) url.searchParams.set("callbackUrl", `${path}${nextUrl.search}`);
    return Response.redirect(url);
  };

  // Belum login
  if (!role) {
    if (isAdminArea && !isAdminLogin) return go("/login", true);
    if (isPesertaArea || isPembayaranArea) return go("/login", true);
    return undefined;
  }

  // Sudah login: halaman login mengarah ke beranda sesuai role
  if (isAdminLogin || isPesertaLogin) return go(HOME[role]);

  // Role tidak boleh masuk area role lain
  if (isAdminArea && role !== "admin") return go(HOME[role]);
  if (isPesertaArea && role !== "peserta") return go(HOME[role]);
  // Halaman pembayaran hanya untuk peserta (admin kembali ke dashboard-nya).
  if (isPembayaranArea && role !== "peserta") return go(HOME[role]);

  // Catatan: pengecekan status akses (sudah bayar/belum) sengaja tidak di sini.
  // Middleware jalan di edge tanpa DB; otoritas ada di requirePesertaAktif()
  // dan server layout /peserta yang mengecek aksesAktifAt langsung dari DB.

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*", "/peserta/:path*", "/pembayaran/:path*", "/login"],
};
