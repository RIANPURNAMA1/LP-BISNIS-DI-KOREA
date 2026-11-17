import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { KEY_GRUP_JABODETABEK, KEY_GRUP_LUAR, getGrupLinks } from "@/lib/grup";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Tidak terautentikasi." },
    { status: 401 }
  );
}

// Link kosong diperbolehkan (grup belum dibuat). Jika diisi, harus URL http(s).
function validateLink(value: unknown, label: string): string | null {
  if (typeof value !== "string") return `${label} tidak valid.`;
  const v = value.trim();
  if (!v) return null;
  if (v.length > 500) return `${label} terlalu panjang.`;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:")
      return `${label} harus diawali https://`;
  } catch {
    return `${label} bukan URL yang valid.`;
  }
  return null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();
    const links = await getGrupLinks();
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error("GET /api/admin/pengaturan error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const errJabo = validateLink(body.jabodetabek, "Link grup Jabodetabek");
    const errLuar = validateLink(
      body.luarJabodetabek,
      "Link grup Luar Jabodetabek"
    );
    const error = errJabo || errLuar;
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const entries: [string, string][] = [
      [KEY_GRUP_JABODETABEK, String(body.jabodetabek).trim()],
      [KEY_GRUP_LUAR, String(body.luarJabodetabek).trim()],
    ];
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.pengaturan.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/pengaturan error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
