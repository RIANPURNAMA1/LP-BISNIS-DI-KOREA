import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  BUKTI_PENCAIRAN_PREFIX,
} from "@/lib/afiliasi";
import { BUKTI_NAME_RE } from "@/lib/pembayaran";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "bukti-pencairan");

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Bukti transfer pencairan hanya bisa dilihat admin atau affiliate pemiliknya. */
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.role) return new NextResponse("Tidak terautentikasi.", { status: 401 });

    const name = decodeURIComponent(params.name);
    if (!BUKTI_NAME_RE.test(name)) return new NextResponse("Tidak ditemukan.", { status: 404 });

    const payout = await prisma.payout.findFirst({
      where: { bukti: `${BUKTI_PENCAIRAN_PREFIX}${name}` },
      select: { affiliateId: true },
    });
    if (!payout) return new NextResponse("Tidak ditemukan.", { status: 404 });

    if (user.role === "admin") {
      // diizinkan
    } else if (user.role === "afiliasi") {
      const id = parseInt(user.id ?? "", 10);
      if (!Number.isFinite(id) || id !== payout.affiliateId) {
        return new NextResponse("Tidak diizinkan.", { status: 403 });
      }
    } else {
      return new NextResponse("Tidak diizinkan.", { status: 403 });
    }

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
