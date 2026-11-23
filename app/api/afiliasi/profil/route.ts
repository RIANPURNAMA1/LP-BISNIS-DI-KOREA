import { NextRequest, NextResponse } from "next/server";
import { requireAfiliasi } from "@/lib/guard";
import prisma from "@/lib/db";
import { affiliateProfilSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Simpan rekening tujuan pencairan milik affiliate. */
export async function PUT(req: NextRequest) {
  try {
    const afiliasi = await requireAfiliasi();
    if (!afiliasi) return fail("Tidak terautentikasi.", 401);

    const body = await req.json().catch(() => null);
    const result = affiliateProfilSchema.safeParse(body ?? {});
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal.", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.affiliate.update({
      where: { id: afiliasi.id },
      data: result.data,
      select: {
        bankNama: true,
        bankNo: true,
        bankAtasNama: true,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PUT /api/afiliasi/profil error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
