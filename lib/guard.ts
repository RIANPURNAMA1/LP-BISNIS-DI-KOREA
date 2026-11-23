import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import type { Role } from "@/lib/auth.config";

type SessionUser = { id?: string; role?: Role };

/** Sesi dengan role tertentu, atau null jika belum login / role tidak sesuai. */
async function requireRole(role: Role) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  return user && user.role === role ? session : null;
}

export const requireAdmin = () => requireRole("admin");

/** Sesi peserta beserta id pendaftaran-nya (belum termasuk status akses). */
export async function requirePeserta() {
  const session = await requireRole("peserta");
  const id = parseInt((session?.user as SessionUser | undefined)?.id ?? "", 10);
  return session && Number.isFinite(id) ? { session, id } : null;
}

/**
 * Gerbang utama area member.
 * Role di JWT bisa basi, jadi akses dicek ulang ke DB pada setiap request.
 * `aksesAktifAt` hanya ditulis admin saat pembayaran terverifikasi.
 */
export async function requirePesertaAktif() {
  const peserta = await requirePeserta();
  if (!peserta) return null;

  const row = await prisma.pendaftaran.findUnique({
    where: { id: peserta.id },
    select: { id: true, aksesAktifAt: true },
  });
  return row?.aksesAktifAt ? peserta : null;
}

/** Sesi affiliate beserta id-nya. Status aktif dicek ulang dari DB. */
export async function requireAfiliasi() {
  const session = await requireRole("afiliasi");
  const id = parseInt((session?.user as SessionUser | undefined)?.id ?? "", 10);
  if (!session || !Number.isFinite(id)) return null;

  const row = await prisma.affiliate.findUnique({
    where: { id },
    select: { id: true, aktif: true },
  });
  return row?.aktif ? { session, id } : null;
}
