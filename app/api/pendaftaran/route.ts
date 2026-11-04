import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { pendaftaranSchema, listQuerySchema } from "@/lib/validations";

// ─── POST — Simpan pendaftaran baru ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validasi dengan Zod
    const result = pendaftaranSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: "Validasi gagal.", errors },
        { status: 400 }
      );
    }

    // Simpan ke database via Prisma
    const pendaftaran = await prisma.pendaftaran.create({
      data: result.data,
    });

    return NextResponse.json(
      { success: true, id: pendaftaran.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pendaftaran error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

// ─── GET — Daftar pendaftar dengan pagination ────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    const where = query.search
      ? {
          OR: [
            { nama: { contains: query.search } },
            { email: { contains: query.search } },
            { whatsapp: { contains: query.search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.pendaftaran.findMany({
        where,
        orderBy: { [query.sort]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.pendaftaran.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    console.error("GET /api/pendaftaran error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
