import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import authConfig from "./auth.config";

// Pembatas percobaan login per email (in-memory, per instance server).
const MAX_FAIL = 5;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map<string, { n: number; first: number }>();

function isLocked(key: string) {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    fails.delete(key);
    return false;
  }
  return f.n >= MAX_FAIL;
}

function recordFail(key: string) {
  const f = fails.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) fails.set(key, { n: 1, first: Date.now() });
  else f.n += 1;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Login admin
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(String(credentials.password), user.password);
        if (!isValid) return null;

        return { id: String(user.id), email: user.email, name: user.name, role: "admin" };
      },
    }),
    // Login peserta (pendaftar)
    Credentials({
      id: "peserta",
      name: "peserta",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        if (isLocked(email)) return null;

        const peserta = await prisma.pendaftaran.findFirst({ where: { email } });
        const ok =
          !!peserta?.password &&
          (await bcrypt.compare(String(credentials.password), peserta.password));
        if (!peserta || !ok) {
          recordFail(email);
          return null;
        }

        fails.delete(email);
        await prisma.pendaftaran.update({
          where: { id: peserta.id },
          data: { lastLoginAt: new Date() },
        });
        return {
          id: String(peserta.id),
          email: peserta.email,
          name: peserta.nama,
          role: "peserta",
          // Info untuk memilih tujuan setelah login. Akses tetap diverifikasi
          // ulang dari DB oleh requirePesertaAktif().
          aksesAktif: !!peserta.aksesAktifAt,
        };
      },
    }),
  ],
});
