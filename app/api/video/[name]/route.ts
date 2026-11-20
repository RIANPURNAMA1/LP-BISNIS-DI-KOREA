import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIR = path.join(process.cwd(), "storage", "video");
const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
};
const VALID = /^[A-Za-z0-9._-]+\.(mp4|webm|ogg|mov|m4v)$/i;

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  const name = params.name;
  if (!VALID.test(name)) return new NextResponse("Not found", { status: 404 });

  const file = path.join(DIR, name);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = TYPES[name.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  // Dukung Range request agar pemutar video bisa seek/skip ke depan.
  const range = req.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match) {
    const start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    end = Math.min(end, size - 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new NextResponse(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
