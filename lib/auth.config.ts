import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export type Role = "admin" | "peserta";

type RoleUser = { id?: string; role?: Role; aksesAktif?: boolean };

/**
 * Konfigurasi yang aman dipakai di middleware (edge): tanpa akses database.
 * Callback ada di sini agar `role` tersedia di `req.auth` pada middleware.
 */
const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [Credentials({})],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as RoleUser).role;
        token.aksesAktif = (user as RoleUser).aksesAktif === true;
      }

      // Dipanggil dari useSession().update() setelah admin mengubah profil.
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.email === "string") token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as RoleUser;
        u.id = token.id as string;
        // Token tanpa role dianggap belum terautentikasi (lebih aman dari fallback admin).
        u.role = token.role as Role | undefined;
        // Dipakai login page untuk memilih tujuan: /peserta atau /pembayaran.
        // Bukan otoritas akses; guard server tetap mengecek DB.
        (u as RoleUser).aksesAktif = token.aksesAktif === true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
