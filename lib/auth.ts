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
    // Login tunggal di /login: admin, affiliate, dan peserta memakai satu form.
    // Provider "peserta" dan "afiliasi" tetap ada untuk auto-login setelah daftar.
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
        const password = String(credentials.password);

        // 1) Admin
        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (admin && (await bcrypt.compare(password, admin.password))) {
          return {
            id: String(admin.id),
            email: admin.email,
            name: admin.name,
            role: "admin",
          };
        }

        // 2) Affiliate (akun terpisah dari peserta)
        const afiliasiKey = `afiliasi:${email}`;
        if (!isLocked(afiliasiKey)) {
          const affiliate = await prisma.affiliate.findUnique({ where: { email } });
          const ok =
            !!affiliate?.aktif &&
            !!affiliate.password &&
            (await bcrypt.compare(password, affiliate.password));
          if (ok && affiliate) {
            fails.delete(afiliasiKey);
            await prisma.affiliate.update({
              where: { id: affiliate.id },
              data: { lastLoginAt: new Date() },
            });
            return {
              id: String(affiliate.id),
              email: affiliate.email,
              name: affiliate.nama,
              role: "afiliasi",
            };
          }
          // Catat gagal hanya jika akun affiliate memang ada, agar percobaan
          // login peserta tidak mengunci akun affiliate dengan email sama.
          if (affiliate) recordFail(afiliasiKey);
        }

        // 3) Peserta
        if (isLocked(email)) return null;
        const peserta = await prisma.pendaftaran.findFirst({ where: { email } });
        const pesertaOk =
          !!peserta?.password && (await bcrypt.compare(password, peserta.password));
        if (!pesertaOk || !peserta) {
          if (peserta) recordFail(email);
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
    // Login affiliate (akun terpisah dari peserta)
    Credentials({
      id: "afiliasi",
      name: "afiliasi",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const key = `afiliasi:${email}`;
        if (isLocked(key)) return null;

        const affiliate = await prisma.affiliate.findUnique({ where: { email } });
        const ok =
          !!affiliate?.aktif &&
          !!affiliate.password &&
          (await bcrypt.compare(String(credentials.password), affiliate.password));
        if (!affiliate || !ok) {
          recordFail(key);
          return null;
        }

        fails.delete(key);
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { lastLoginAt: new Date() },
        });
        return {
          id: String(affiliate.id),
          email: affiliate.email,
          name: affiliate.nama,
          role: "afiliasi",
        };
      },
    }),
  ],
});
