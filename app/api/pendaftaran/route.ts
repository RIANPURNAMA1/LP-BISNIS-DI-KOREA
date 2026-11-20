import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { eventWhere } from "@/lib/event";
import { notifyPendaftaranBaru } from "@/lib/wa-notif";
import { notifyPesertaTerdaftar } from "@/lib/email";
import {
  pendaftaranSchema,
  listQuerySchema,
  serializeTujuan,
  parseTujuan,
} from "@/lib/validations";

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

    // Email harus unik: satu email hanya boleh mendaftar sekali.
    const email = result.data.email.trim().toLowerCase();
    const sudahAda = await prisma.pendaftaran.findFirst({
      where: { email },
      select: { id: true },
    });
    if (sudahAda) {
      return NextResponse.json(
        {
          success: false,
          field: "email",
          error:
            "Email ini sudah terdaftar. Gunakan email lain atau hubungi admin jika Anda sudah pernah mendaftar.",
        },
        { status: 409 }
      );
    }

    // Simpan ke database via Prisma (password disimpan sebagai hash)
    const { password, ...data } = result.data;
    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        ...data,
        email,
        password: await bcrypt.hash(password, 10),
        tujuan: serializeTujuan(result.data.tujuan),
      },
    });

    // Notifikasi WhatsApp ke admin (di latar belakang; tidak menunda/menggagalkan respons).
    void notifyPendaftaranBaru({
      id: pendaftaran.id,
      nama: pendaftaran.nama,
      whatsapp: pendaftaran.whatsapp,
      email: pendaftaran.email,
      provinsi: pendaftaran.provinsi,
      kabupaten: pendaftaran.kabupaten,
      desa: pendaftaran.desa,
      status: pendaftaran.status,
      ide: pendaftaran.ide,
      pendapatan: pendaftaran.pendapatan,
      tujuan: parseTujuan(pendaftaran.tujuan),
      sumber: pendaftaran.sumber,
      createdAt: pendaftaran.createdAt,
    });

    // Email konfirmasi ke peserta (di latar belakang; gagal kirim tidak memengaruhi pendaftaran).
    void notifyPesertaTerdaftar({ nama: pendaftaran.nama, email: pendaftaran.email });

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
    const session = await requireAdmin();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    const baseWhere = {
      ...(query.search
        ? {
            OR: [
              { nama: { contains: query.search } },
              { email: { contains: query.search } },
              { whatsapp: { contains: query.search } },
            ],
          }
        : {}),
      ...eventWhere(query.event),
    };
    const meetingWhere = { ...baseWhere, konsultasiAt: { not: null } };
    const where = query.meeting === "1" ? meetingWhere : baseWhere;

    const [data, totalSemua, totalMeeting] = await Promise.all([
      prisma.pendaftaran.findMany({
        omit: { password: true },
        where,
        orderBy: { [query.sort]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.pendaftaran.count({ where: baseWhere }),
      prisma.pendaftaran.count({ where: meetingWhere }),
    ]);
    const total = query.meeting === "1" ? totalMeeting : totalSemua;

    return NextResponse.json({
      success: true,
      data: data.map((d) => ({ ...d, tujuan: parseTujuan(d.tujuan) })),
      total,
      totalSemua,
      totalMeeting,
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
