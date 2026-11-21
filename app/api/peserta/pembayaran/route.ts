import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePesertaAktif } from "@/lib/guard";
import {
  BUKTI_EXTENSIONS,
  HARGA_KONSULTASI,
  MAX_BUKTI_SIZE,
  METODE_BAYAR,
  buktiUrl,
  channelOptions,
  type MetodeBayar,
} from "@/lib/pembayaran";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "bukti-bayar");

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Status pembayaran peserta yang sedang login. */
export async function GET() {
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const [p, terakhir] = await Promise.all([
      prisma.pendaftaran.findUnique({
        where: { id: peserta.id },
        select: {
          nama: true,
          whatsapp: true,
          email: true,
          videoSelesaiAt: true,
          konsultasiAt: true,
        },
      }),
      prisma.pembayaranKonsultasi.findFirst({
        where: { pendaftaranId: peserta.id },
        orderBy: { id: "desc" },
      }),
    ]);
    if (!p) return fail("Data peserta tidak ditemukan.", 404);

    return NextResponse.json({
      success: true,
      data: {
        profil: { nama: p.nama, whatsapp: p.whatsapp, email: p.email },
        videoSelesai: !!p.videoSelesaiAt,
        konsultasiSelesai: !!p.konsultasiAt,
        harga: HARGA_KONSULTASI,
        pembayaran: terakhir
          ? {
              id: terakhir.id,
              metode: terakhir.metode,
              namaChannel: terakhir.namaChannel,
              namaPengirim: terakhir.namaPengirim,
              buktiBayar: terakhir.buktiBayar,
              jumlah: terakhir.jumlah,
              status: terakhir.status,
              catatanAdmin: terakhir.catatanAdmin,
              createdAt: terakhir.createdAt,
              verifiedAt: terakhir.verifiedAt,
            }
          : null,
      },
    });
  } catch (e) {
    console.error("GET /api/peserta/pembayaran error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/** Kirim bukti pembayaran (multipart/form-data). */
export async function POST(req: NextRequest) {
  let filePath = "";
  try {
    const peserta = await requirePesertaAktif();
    if (!peserta) return fail("Akses peserta belum aktif.", 403);

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: {
        nama: true,
        whatsapp: true,
        email: true,
        videoSelesaiAt: true,
        konsultasiAt: true,
      },
    });
    if (!p) return fail("Data peserta tidak ditemukan.", 404);
    if (p.konsultasiAt) return fail("Konsultasi online Anda sudah dikonfirmasi.", 409);
    if (!p.videoSelesaiAt)
      return fail("Selesaikan menonton video pengarahan terlebih dulu.", 403);

    const menunggu = await prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: peserta.id, status: "menunggu" },
      select: { id: true },
    });
    if (menunggu)
      return fail(
        "Pembayaran Anda sedang diverifikasi admin. Hubungi admin jika ingin mengganti bukti.",
        409
      );

    const form = await req.formData().catch(() => null);
    if (!form) return fail("Data checkout tidak valid.");

    const metode = String(form.get("metode") ?? "").trim();
    const namaChannel = String(form.get("namaChannel") ?? "").trim();
    const namaPengirim = String(form.get("namaPengirim") ?? "").trim();
    const file = form.get("bukti");

    if (!METODE_BAYAR.includes(metode as MetodeBayar))
      return fail("Metode pembayaran hanya transfer bank.");
    if (!channelOptions(metode).includes(namaChannel))
      return fail("Pilih nama bank yang tersedia.");
    if (namaPengirim.length < 2 || namaPengirim.length > 255)
      return fail("Nama pengirim harus 2–255 karakter.");
    if (!file || typeof file === "string" || !("arrayBuffer" in file))
      return fail("Unggah bukti pembayaran terlebih dahulu.");

    const blob = file as Blob & { name?: string };
    const name = blob.name ?? "bukti";
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
    if (!BUKTI_EXTENSIONS.includes(ext as (typeof BUKTI_EXTENSIONS)[number]))
      return fail("Format bukti harus JPG, PNG, atau WebP.");
    if (blob.size > MAX_BUKTI_SIZE) return fail("Ukuran bukti maksimal 5 MB.");

    await mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    filePath = path.join(UPLOAD_DIR, fileName);
    await writeFile(filePath, Buffer.from(await blob.arrayBuffer()));

    const pembayaran = await prisma.pembayaranKonsultasi.create({
      data: {
        pendaftaranId: peserta.id,
        nama: p.nama,
        whatsapp: p.whatsapp,
        email: p.email,
        metode,
        namaChannel,
        namaPengirim,
        buktiBayar: buktiUrl(fileName),
        jumlah: HARGA_KONSULTASI,
        status: "menunggu",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.",
      data: { id: pembayaran.id, status: pembayaran.status },
    });
  } catch (e) {
    if (filePath) await unlink(filePath).catch(() => {});
    console.error("POST /api/peserta/pembayaran error:", e);
    return fail("Gagal mengirim bukti pembayaran. Coba lagi.", 500);
  }
}
