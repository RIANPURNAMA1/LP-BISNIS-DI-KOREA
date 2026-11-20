import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BUKTI_NAME_RE } from "@/lib/pembayaran";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "bukti-bayar");

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Bukti pembayaran hanya bisa dilihat oleh admin/peserta yang login. */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Tidak terautentikasi.", { status: 401 });

    const name = decodeURIComponent(params.name);
    if (!BUKTI_NAME_RE.test(name)) return new NextResponse("Tidak ditemukan.", { status: 404 });

    const file = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".").pop()!.toLowerCase();
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Tidak ditemukan.", { status: 404 });
  }
}
