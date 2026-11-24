import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIR = path.join(process.cwd(), "storage", "thumbnail");
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const VALID = /^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i;

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  if (!VALID.test(params.name)) return new NextResponse("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(DIR, params.name));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": TYPES[params.name.split(".").pop()!.toLowerCase()],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
