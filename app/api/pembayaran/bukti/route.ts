import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requirePeserta } from "@/lib/guard";
import { notifyBuktiDiterima } from "@/lib/email";
import { notifyPembayaranMasuk } from "@/lib/wa-notif";
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

/**
 * Kirim bukti transfer sebagai gerbang aktivasi akun.
 * Boleh dipanggil peserta yang belum punya akses member (aksesAktifAt null).
 * Setelah admin menyetujui, akses /peserta dibuka oleh route verifikasi admin.
 */
export async function POST(req: NextRequest) {
  let filePath = "";
  try {
    const peserta = await requirePeserta();
    if (!peserta) return fail("Tidak terautentikasi.", 401);

    const p = await prisma.pendaftaran.findUnique({
      where: { id: peserta.id },
      select: { nama: true, whatsapp: true, email: true, aksesAktifAt: true },
    });
    if (!p) return fail("Data peserta tidak ditemukan.", 404);
    if (p.aksesAktifAt)
      return fail("Akun Anda sudah aktif. Silakan masuk ke halaman peserta.", 409);

    const terakhir = await prisma.pembayaranKonsultasi.findFirst({
      where: { pendaftaranId: peserta.id },
      orderBy: { id: "desc" },
      select: { status: true, catatanAdmin: true },
    });
    if (terakhir?.status === "menunggu")
      return fail("Bukti Anda sedang diverifikasi admin. Mohon tunggu.", 409);
    if (terakhir?.status === "dikonfirmasi")
      return fail("Pembayaran Anda sudah dikonfirmasi.", 409);

    const form = await req.formData().catch(() => null);
    if (!form) return fail("Data pembayaran tidak valid.");

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

    void notifyPembayaranMasuk({
      nama: p.nama,
      whatsapp: p.whatsapp,
      namaChannel,
      namaPengirim,
      jumlah: HARGA_KONSULTASI,
      buktiBayar: pembayaran.buktiBayar,
    });
    void notifyBuktiDiterima({ nama: p.nama, email: p.email });

    return NextResponse.json(
      {
        success: true,
        message: "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.",
        data: { id: pembayaran.id, status: pembayaran.status },
      },
      { status: 201 }
    );
  } catch (e) {
    if (filePath) await unlink(filePath).catch(() => {});
    console.error("POST /api/pembayaran/bukti error:", e);
    return fail("Gagal mengirim bukti pembayaran. Coba lagi.", 500);
  }
}
