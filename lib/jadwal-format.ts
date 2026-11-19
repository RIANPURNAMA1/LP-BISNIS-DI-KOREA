// Helper tampilan jadwal yang aman dipakai di komponen client (tanpa Prisma).

/** "2026-11-24" → "Selasa, 24 Nov 2026" (tanggal murni, tanpa pergeseran zona waktu). */
export function formatTanggal(tanggal: string, withDay = true): string {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", {
    timeZone: "UTC",
    weekday: withDay ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  menunggu: { label: "Menunggu konfirmasi", tone: "bg-amber-50 text-amber-700" },
  dikonfirmasi: { label: "Dikonfirmasi", tone: "bg-emerald-50 text-emerald-700" },
  selesai: { label: "Selesai", tone: "bg-slate-100 text-slate-600" },
  batal: { label: "Dibatalkan", tone: "bg-slate-100 text-slate-500" },
  ditolak: { label: "Ditolak", tone: "bg-red-50 text-red-700" },
};
