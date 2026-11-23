import { createWriteStream } from "node:fs";
import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CHUNK = 10 * 1024 * 1024; // 10 MB per potongan
const MAX_TOTAL = 100; // maksimal 100 potongan (~1 GB)
const TMP_DIR = path.join(process.cwd(), "storage", "video", "tmp");
const EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"] as const;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Terima satu potongan (chunk) video dan tambahkan ke file sementara. */
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);

    const form = await req.formData().catch(() => null);
    const uploadId = String(form?.get("uploadId") ?? "").trim();
    const index = Number(form?.get("index"));
    const total = Number(form?.get("total"));
    const nama = String(form?.get("nama") ?? "").trim();
    const chunk = form?.get("chunk");

    if (
      !ID_RE.test(uploadId) ||
      !Number.isInteger(index) ||
      !Number.isInteger(total) ||
      index < 0 ||
      total < 1 ||
      index >= total ||
      total > MAX_TOTAL
    ) {
      return fail("Data potongan video tidak valid.");
    }
    if (!chunk || typeof chunk === "string" || !("stream" in chunk)) {
      return fail("Potongan video tidak ditemukan.");
    }

    const blob = chunk as Blob;
    if (blob.size === 0 || blob.size > MAX_CHUNK) return fail("Ukuran potongan tidak valid.");

    const ext = nama.includes(".") ? nama.split(".").pop()!.toLowerCase() : "";
    if (!EXTENSIONS.includes(ext as (typeof EXTENSIONS)[number])) {
      return fail("Format video harus MP4, WebM, OGG, MOV, atau M4V.");
    }

    await mkdir(TMP_DIR, { recursive: true });
    const target = path.join(TMP_DIR, `${uploadId}.${ext}`);
    await pipeline(
      Readable.fromWeb(blob.stream() as unknown as import("node:stream/web").ReadableStream),
      createWriteStream(target, { flags: "a" }),
    );

    return NextResponse.json({ success: true, diterima: blob.size });
  } catch (error) {
    console.error("POST /api/admin/video/chunk error:", error);
    return fail("Gagal menyimpan potongan video.", 500);
  }
}

/** Hapus file sementara milik uploadId (dipakai saat upload dibatalkan/gagal). */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin())) return fail("Tidak terautentikasi.", 401);
    const uploadId = new URL(req.url).searchParams.get("uploadId") ?? "";
    if (!ID_RE.test(uploadId)) return fail("ID upload tidak valid.");

    const files = await readdir(TMP_DIR).catch(() => [] as string[]);
    await Promise.all(
      files
        .filter((f) => f.startsWith(`${uploadId}.`))
        .map((f) => unlink(path.join(TMP_DIR, f)).catch(() => undefined)),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/video/chunk error:", error);
    return fail("Gagal membersihkan file sementara.", 500);
  }
}
