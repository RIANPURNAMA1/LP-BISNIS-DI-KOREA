import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buatKodeAfiliasi } from "@/lib/afiliasi";
import { affiliateDaftarSchema } from "@/lib/validations";
import {
  notifyAfiliasiTerdaftar,
} from "@/lib/email";
import { notifyAfiliasiBaru } from "@/lib/wa-notif";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Pendaftaran affiliate publik: langsung aktif, tanpa persetujuan admin. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const result = affiliateDaftarSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validasi gagal.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nama, email, whatsapp, password } = result.data;
    const sudahAda = await prisma.affiliate.findUnique({
      where: { email },
      select: { id: true },
    });
    if (sudahAda) {
      return NextResponse.json(
        {
          success: false,
          field: "email",
          error: "Email ini sudah terdaftar sebagai affiliate. Silakan login.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let affiliate: { id: number; kode: string } | null = null;
    // Kode unik: ulangi bila ada benturan (sangat jarang).
    for (let attempt = 0; attempt < 5 && !affiliate; attempt++) {
      try {
        affiliate = await prisma.affiliate.create({
          data: { nama, email, whatsapp, password: passwordHash, kode: buatKodeAfiliasi() },
          select: { id: true, kode: true },
        });
      } catch (e) {
        if (attempt === 4) throw e;
      }
    }
    if (!affiliate) return fail("Gagal membuat kode affiliate.", 500);

    void notifyAfiliasiTerdaftar({ nama, email, kode: affiliate.kode });
    void notifyAfiliasiBaru({ nama, email, whatsapp, kode: affiliate.kode });

    return NextResponse.json(
      { success: true, kode: affiliate.kode },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/afiliasi/daftar error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
