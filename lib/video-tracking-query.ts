import prisma from "@/lib/db";
import { sedangMenonton, statusVideo, type StatusVideo } from "@/lib/video-tracking";

export type BarisTracking = {
  id: number;
  nama: string;
  email: string;
  whatsapp: string;
  status: StatusVideo;
  sedangMenonton: boolean;
  persen: number;
  mulaiAt: string | null;
  terakhirAt: string | null;
  selesaiAt: string | null;
};

/** Peserta yang sudah punya akses (satu-satunya yang bisa membuka video). */
export async function ambilTracking(opts: { search?: string; status?: string }) {
  const search = (opts.search ?? "").trim();
  const rows = await prisma.pendaftaran.findMany({
    where: {
      aksesAktifAt: { not: null },
      ...(search
        ? {
            OR: [
              { nama: { contains: search } },
              { email: { contains: search } },
              { whatsapp: { contains: search } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nama: true,
      email: true,
      whatsapp: true,
      videoSelesaiAt: true,
      videoMulaiAt: true,
      videoTerakhirAt: true,
      videoPersen: true,
    },
    orderBy: [{ videoTerakhirAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    take: 5000,
  });

  const now = Date.now();
  const semua: BarisTracking[] = rows.map((r) => ({
    id: r.id,
    nama: r.nama,
    email: r.email,
    whatsapp: r.whatsapp,
    status: statusVideo(r),
    sedangMenonton: sedangMenonton(r.videoTerakhirAt, now),
    persen: r.videoSelesaiAt ? 100 : r.videoPersen,
    mulaiAt: r.videoMulaiAt?.toISOString() ?? null,
    terakhirAt: r.videoTerakhirAt?.toISOString() ?? null,
    selesaiAt: r.videoSelesaiAt?.toISOString() ?? null,
  }));

  const ringkasan = {
    total: semua.length,
    belum: semua.filter((r) => r.status === "belum").length,
    proses: semua.filter((r) => r.status === "proses").length,
    selesai: semua.filter((r) => r.status === "selesai").length,
    menonton: semua.filter((r) => r.sedangMenonton).length,
  };

  const f = opts.status ?? "";
  const data =
    f === "menonton"
      ? semua.filter((r) => r.sedangMenonton)
      : f === "belum" || f === "proses" || f === "selesai"
        ? semua.filter((r) => r.status === f)
        : semua;

  return { ringkasan, data };
}
