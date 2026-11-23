import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { KEY_GRUP_KONSULTASI, KEY_GRUP_UMUM, getGrupLinks } from "@/lib/grup";
import { KEY_REKENING, getRekening, type Rekening } from "@/lib/pembayaran";
import {
  KEY_AFILIASI_KOMISI,
  KEY_AFILIASI_MIN_PENCAIRAN,
  getAfiliasiSettings,
} from "@/lib/afiliasi";

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
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();
    const [links, rekening, afiliasi] = await Promise.all([
      getGrupLinks(),
      getRekening(),
      getAfiliasiSettings(),
    ]);
    return NextResponse.json({
      success: true,
      data: { ...links, rekening, afiliasi },
    });
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
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    if (Object.prototype.hasOwnProperty.call(body, "umum")) {
      const error = validateLink(body.umum, "Link grup Korean Bisnis Klub");
      if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    }
    if (Object.prototype.hasOwnProperty.call(body, "grupKonsultasi")) {
      const error = validateLink(body.grupKonsultasi, "Link grup Konsultasi Online");
      if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    }
    if (body.afiliasi && typeof body.afiliasi === "object") {
      for (const [field, label] of [
        ["komisi", "Nominal komisi affiliate"],
        ["minimalPencairan", "Minimal pencairan affiliate"],
      ] as const) {
        if (!Object.prototype.hasOwnProperty.call(body.afiliasi, field)) continue;
        const raw = body.afiliasi[field];
        const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
        if (!Number.isFinite(n) || n < 0 || n > 100_000_000) {
          return NextResponse.json(
            { success: false, error: `${label} harus berupa angka 0–100.000.000.` },
            { status: 400 }
          );
        }
      }
    }

    const entries: [string, string][] = [];
    if (Object.prototype.hasOwnProperty.call(body, "umum")) {
      entries.push([KEY_GRUP_UMUM, String(body.umum ?? "").trim()]);
    }
    if (Object.prototype.hasOwnProperty.call(body, "grupKonsultasi")) {
      entries.push([KEY_GRUP_KONSULTASI, String(body.grupKonsultasi ?? "").trim()]);
    }
    if (body.afiliasi && typeof body.afiliasi === "object") {
      const a = body.afiliasi as { komisi?: unknown; minimalPencairan?: unknown };
      if (a.komisi !== undefined) {
        entries.push([KEY_AFILIASI_KOMISI, String(parseInt(String(a.komisi), 10))]);
      }
      if (a.minimalPencairan !== undefined) {
        entries.push([
          KEY_AFILIASI_MIN_PENCAIRAN,
          String(parseInt(String(a.minimalPencairan), 10)),
        ]);
      }
    }
    if (body.rekening && typeof body.rekening === "object") {
      const r = body.rekening as Partial<Rekening>;
      for (const [field, key] of Object.entries(KEY_REKENING)) {
        if (Object.prototype.hasOwnProperty.call(r, field)) {
          const value = String(r[field as keyof Rekening] ?? "").trim().slice(0, 150);
          entries.push([key, value]);
        }
      }
    }

    if (entries.length) {
      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.pengaturan.upsert({
            where: { key },
            create: { key, value },
            update: { value },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/pengaturan error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
