// Aturan bersama tracking video (server).

/** Heartbeat terakhir dalam rentang ini dianggap "sedang menonton". */
export const AKTIF_MS = 60_000;

export type StatusVideo = "belum" | "proses" | "selesai";

export function statusVideo(r: {
  videoSelesaiAt: Date | null;
  videoMulaiAt: Date | null;
}): StatusVideo {
  if (r.videoSelesaiAt) return "selesai";
  if (r.videoMulaiAt) return "proses";
  return "belum";
}

export function sedangMenonton(terakhir: Date | null, now = Date.now()) {
  return !!terakhir && now - terakhir.getTime() < AKTIF_MS;
}

export const STATUS_VIDEO_LABEL: Record<StatusVideo, string> = {
  belum: "Belum mulai",
  proses: "Belum selesai",
  selesai: "Selesai",
};
