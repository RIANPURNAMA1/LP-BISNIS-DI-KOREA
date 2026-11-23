import { randomUUID } from "node:crypto";
import { mkdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/guard";
import { KEY_ARAHAN, KEY_VIDEO_URL, VIDEO_UPLOAD_PREFIX, isUploadedVideo } from "@/lib/jadwal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 200 * 1024 * 1024;
const DIR = path.join(process.cwd(), "storage", "video");
const TMP_DIR = path.join(DIR, "tmp");
const EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"] as const;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Gabungkan potongan menjadi video final, lalu pasang ke peserta. */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const uploadId = String(body?.uploadId ?? "").trim();
    const nama = String(body?.nama ?? "").trim();
    const arahan = String(body?.arahan ?? "").trim();
    const total = Number(body?.total);

    if (
      !ID_RE.test(uploadId) ||
      !Number.isInteger(total) ||
      total < 1 ||
      total > 100
    ) {
      return fail("Data unggahan tidak valid.");
    }
    if (arahan.length > 1000) return fail("Teks arahan maksimal 1000 karakter.", 400);

    const ext = nama.includes(".") ? nama.split(".").pop()!.toLowerCase() : "";
    if (!EXTENSIONS.includes(ext as (typeof EXTENSIONS)[number])) {
      return fail("Format video harus MP4, WebM, OGG, MOV, atau M4V.");
    }

    const tmp = path.join(TMP_DIR, `${uploadId}.${ext}`);
    const info = await stat(tmp).catch(() => null);
    if (!info || info.size === 0) return fail("Unggahan tidak ditemukan. Silakan ulangi.", 400);
    if (info.size > MAX_SIZE) {
      await unlink(tmp).catch(() => undefined);
      return fail("Ukuran video maksimal 200 MB.", 400);
    }

    await mkdir(DIR, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    const finalPath = path.join(DIR, fileName);
    await rename(tmp, finalPath);
    const url = `${VIDEO_UPLOAD_PREFIX}${fileName}`;

    const lamaRow = await prisma.pengaturan.findUnique({ where: { key: KEY_VIDEO_URL } });
    const lama = lamaRow?.value?.trim() ?? "";
    await prisma.$transaction([
      prisma.pengaturan.upsert({
        where: { key: KEY_VIDEO_URL },
        create: { key: KEY_VIDEO_URL, value: url },
        update: { value: url },
      }),
      prisma.pengaturan.upsert({
        where: { key: KEY_ARAHAN },
        create: { key: KEY_ARAHAN, value: arahan },
        update: { value: arahan },
      }),
    ]);
    if (lama !== url && isUploadedVideo(lama)) {
      const oldName = lama.slice(VIDEO_UPLOAD_PREFIX.length);
      if (/^[A-Za-z0-9._-]+\.(mp4|webm|ogg|mov|m4v)$/i.test(oldName)) {
        await unlink(path.join(DIR, oldName)).catch(() => undefined);
      }
    }

    return NextResponse.json({ success: true, videoUrl: url, ukuran: info.size });
  } catch (error) {
    console.error("POST /api/admin/video/finalize error:", error);
    return fail("Gagal menyelesaikan unggahan video.", 500);
  }
}
