import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { KEY_VIDEO_THUMB, THUMB_PREFIX } from "@/lib/jadwal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const DIR = path.join(process.cwd(), "storage", "thumbnail");

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

async function thumbSaatIni() {
  const row = await prisma.pengaturan.findUnique({ where: { key: KEY_VIDEO_THUMB } });
  return row?.value?.trim() ?? "";
}

async function hapusFile(url: string) {
  if (!url.startsWith(THUMB_PREFIX)) return;
  const name = url.slice(THUMB_PREFIX.length);
  if (!/^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(name)) return;
  await unlink(path.join(DIR, name)).catch(() => undefined);
}

async function simpan(value: string) {
  await prisma.pengaturan.upsert({
    where: { key: KEY_VIDEO_THUMB },
    create: { key: KEY_VIDEO_THUMB, value },
    update: { value },
  });
}

/** POST — unggah gambar thumbnail video. */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string" || !("arrayBuffer" in file))
      return fail("Pilih gambar thumbnail terlebih dahulu.", 400);

    const blob = file as Blob & { name?: string };
    const ext = (blob.name ?? "").split(".").pop()?.toLowerCase() ?? "";
    if (!EXTENSIONS.includes(ext)) return fail("Format gambar harus JPG, PNG, atau WebP.", 400);
    if (!blob.type.startsWith("image/")) return fail("File yang dipilih bukan gambar.", 400);
    if (blob.size > MAX_SIZE) return fail("Ukuran thumbnail maksimal 5 MB.", 400);

    await mkdir(DIR, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(path.join(DIR, fileName), Buffer.from(await blob.arrayBuffer()));
    const url = `${THUMB_PREFIX}${fileName}`;

    const lama = await thumbSaatIni();
    await simpan(url);
    await hapusFile(lama);

    return NextResponse.json({ success: true, thumbnailUrl: url });
  } catch (error) {
    console.error("POST /api/admin/video/thumbnail error:", error);
    return fail("Gagal mengunggah thumbnail. Coba lagi.", 500);
  }
}

/** DELETE — hapus thumbnail (peserta kembali memakai poster bawaan). */
export async function DELETE() {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const lama = await thumbSaatIni();
    await simpan("");
    await hapusFile(lama);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/video/thumbnail error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
