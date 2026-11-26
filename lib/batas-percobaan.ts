// Pembatas percobaan gagal sederhana (in-memory, per proses server).
// Cukup untuk menahan tebak-tebakan password; reset saat server restart.

type Catatan = { jumlah: number; mulai: number };
const store = new Map<string, Catatan>();

export const MAKS_GAGAL = 5;
export const JENDELA_MS = 15 * 60 * 1000;

function aktif(key: string): Catatan | null {
  const c = store.get(key);
  if (!c) return null;
  if (Date.now() - c.mulai > JENDELA_MS) {
    store.delete(key);
    return null;
  }
  return c;
}

/** Sisa menit penguncian, atau 0 jika belum terkunci. */
export function sisaKunciMenit(key: string): number {
  const c = aktif(key);
  if (!c || c.jumlah < MAKS_GAGAL) return 0;
  return Math.max(1, Math.ceil((c.mulai + JENDELA_MS - Date.now()) / 60000));
}

export function catatGagal(key: string) {
  const c = aktif(key);
  if (c) c.jumlah += 1;
  else store.set(key, { jumlah: 1, mulai: Date.now() });
}

export function resetGagal(key: string) {
  store.delete(key);
}
