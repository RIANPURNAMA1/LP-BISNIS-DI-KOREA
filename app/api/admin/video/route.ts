import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import {
  KEY_ARAHAN,
  KEY_VIDEO_URL,
  VIDEO_UPLOAD_PREFIX,
  isUploadedVideo,
  validVideoUrl,
} from "@/lib/jadwal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 200 * 1024 * 1024; // 200 MB
const EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"] as const;
const UPLOAD_DIR = path.join(process.cwd(), "storage", "video");

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

async function videoUrlSaatIni() {
  const row = await prisma.pengaturan.findUnique({ where: { key: KEY_VIDEO_URL } });
  return row?.value?.trim() ?? "";
}

async function hapusFileLama(url: string) {
  if (!isUploadedVideo(url)) return;
  const name = url.slice(VIDEO_UPLOAD_PREFIX.length);
  if (!/^[A-Za-z0-9._-]+\.(mp4|webm|ogg|mov|m4v)$/i.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {
    /* file sudah tidak ada */
  });
}

async function simpan(url: string, arahan?: string) {
  const entries: [string, string][] = [[KEY_VIDEO_URL, url]];
  if (arahan !== undefined) entries.push([KEY_ARAHAN, arahan]);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.pengaturan.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
}

/** POST — unggah file video dari admin. */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const arahan = String(form?.get("arahan") ?? "").trim();
    if (!file || typeof file === "string" || !("arrayBuffer" in file))
      return fail("Pilih file video terlebih dahulu.", 400);
    if (arahan.length > 1000) return fail("Teks arahan maksimal 1000 karakter.", 400);

    const blob = file as Blob & { name?: string };
    const name = blob.name ?? "video";
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
    if (!EXTENSIONS.includes(ext as (typeof EXTENSIONS)[number]))
      return fail("Format video harus MP4, WebM, OGG, MOV, atau M4V.", 400);
    if (!blob.type.startsWith("video/") && blob.type !== "application/octet-stream")
      return fail("File yang dipilih bukan video.", 400);
    if (blob.size > MAX_SIZE) return fail("Ukuran video maksimal 200 MB.", 400);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await blob.arrayBuffer()));
    const url = `${VIDEO_UPLOAD_PREFIX}${fileName}`;

    const lama = await videoUrlSaatIni();
    await simpan(url, arahan);
    if (lama !== url) await hapusFileLama(lama);

    return NextResponse.json({ success: true, videoUrl: url, nama: name });
  } catch (error) {
    console.error("POST /api/admin/video error:", error);
    return fail("Gagal mengunggah video. Coba lagi.", 500);
  }
}

/** PUT — pasang video dari link YouTube/Vimeo. */
export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const videoUrl = String(body?.videoUrl ?? "").trim();
    const arahan = String(body?.arahan ?? "").trim();

    if (!validVideoUrl(videoUrl))
      return fail("Link harus berupa video YouTube/Vimeo yang valid.", 400);
    if (arahan.length > 1000) return fail("Teks arahan maksimal 1000 karakter.", 400);

    const lama = await videoUrlSaatIni();
    await simpan(videoUrl, arahan);
    if (lama !== videoUrl) await hapusFileLama(lama);

    return NextResponse.json({ success: true, videoUrl });
  } catch (error) {
    console.error("PUT /api/admin/video error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

/** DELETE — hapus video aktif (file upload ikut terhapus). */
export async function DELETE() {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const lama = await videoUrlSaatIni();
    await simpan("", undefined);
    await hapusFileLama(lama);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/video error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
