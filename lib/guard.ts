import { auth } from "@/lib/auth";
import type { Role } from "@/lib/auth.config";

type SessionUser = { id?: string; role?: Role };

/** Sesi dengan role tertentu, atau null jika belum login / role tidak sesuai. */
async function requireRole(role: Role) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  return user && user.role === role ? session : null;
}

export const requireAdmin = () => requireRole("admin");

/** Sesi peserta beserta id pendaftaran-nya. */
export async function requirePeserta() {
  const session = await requireRole("peserta");
  const id = parseInt((session?.user as SessionUser | undefined)?.id ?? "", 10);
  return session && Number.isFinite(id) ? { session, id } : null;
}
