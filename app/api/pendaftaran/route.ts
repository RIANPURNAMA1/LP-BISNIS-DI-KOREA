import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import { eventWhere } from "@/lib/event";
import { posisiWhere } from "@/lib/posisi";
import { terkunciAffiliateLain } from "@/lib/afiliasi";
import { notifyPendaftaranBaru } from "@/lib/wa-notif";
import { notifyPesertaTerdaftar } from "@/lib/email";
import { pilihJadwal } from "@/lib/jadwal-format";
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

    // Kode afiliasi dari tautan undangan. Kode tidak dikenal = tolak,
    // self-referral = atribusi diabaikan (pendaftaran tetap berjalan).
    const kodeAfiliasi = result.data.kodeAfiliasi;
    let affiliate: { id: number; nama: string; email: string; whatsapp: string } | null = null;
    if (kodeAfiliasi) {
      const candidates = await prisma.affiliate.findUnique({
        where: { kode: kodeAfiliasi },
        select: { id: true, nama: true, email: true, whatsapp: true, aktif: true },
      });
      if (!candidates || !candidates.aktif) {
        return NextResponse.json(
          {
            success: false,
            field: "kodeAfiliasi",
            error: "Kode afiliasi tidak ditemukan atau tidak aktif.",
          },
          { status: 400 }
        );
      }
      const waPendaftar = result.data.whatsapp.replace(/\D/g, "");
      const waAfiliasi = candidates.whatsapp.replace(/\D/g, "");
      const selfReferral =
        candidates.email === email ||
        (waPendaftar.length >= 8 && waPendaftar === waAfiliasi);
      affiliate = selfReferral ? null : candidates;
      // Peserta yang masih terikat ke affiliate lain (masa 90 hari / sudah closing)
      // tidak boleh diklaim affiliate baru. Pendaftaran tetap berjalan tanpa atribusi.
      if (affiliate && (await terkunciAffiliateLain(result.data.whatsapp, affiliate.id))) {
        affiliate = null;
      }
    }

    // Sumber akuisisi mengikuti atribusi affiliate agar masuk statistik admin.
    const sumber = affiliate ? `Afiliasi: ${affiliate.nama}` : result.data.sumber;

    // Simpan ke database via Prisma (password disimpan sebagai hash).
    // Pendaftaran + atribusi dibuat dalam satu transaksi.
    const { password, kodeAfiliasi: _kode, ...data } = result.data;
    const pendaftaran = await prisma.$transaction(async (tx) => {
      const row = await tx.pendaftaran.create({
        data: {
          ...data,
          sumber,
          email,
          password: await bcrypt.hash(password, 10),
          tujuan: serializeTujuan(result.data.tujuan),
        },
      });
      if (affiliate) {
        await tx.referral.create({
          data: {
            affiliateId: affiliate.id,
            pendaftaranId: row.id,
            kode: kodeAfiliasi,
            status: "terdaftar",
          },
        });
      }
      return row;
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

    const kategoriWhere = posisiWhere(query.kategori);
    const baseWhere = {
      ...(query.search
        ? {
            OR: [
              { nama: { contains: query.search } },
              { email: { contains: query.search } },
              { whatsapp: { contains: query.search } },
              { referral: { affiliate: { nama: { contains: query.search } } } },
              { referral: { kode: { contains: query.search } } },
            ],
          }
        : {}),
      ...eventWhere(query.event),
      ...kategoriWhere,
    };
    // Meeting lanjutan = peserta yang sudah submit konfirmasi(posisi A–D).
    // Syarat "punya posisi" hanya dipakai bila tidak ada filter kategori,
    // supaya tidak menimpa posisiKonsultasi: "A"–"D" dari filter.
    const meetingWhere = {
      ...baseWhere,
      konsultasiAt: { not: null },
      ...("posisiKonsultasi" in kategoriWhere
        ? {}
        : { posisiKonsultasi: { not: null } }),
    };
    const where = query.meeting === "1" ? meetingWhere : baseWhere;

    const [rows, totalSemua, totalMeeting] = await Promise.all([
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

    // Ambil jadwal milik baris yang tampil untuk ditampilkan di kolom admin.
    const jadwalRows = await prisma.jadwalSesi.findMany({
      where: { pendaftaranId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        pendaftaranId: true,
        tanggal: true,
        jam: true,
        status: true,
        catatan: true,
      },
    });
    const jadwalMap = new Map<number, typeof jadwalRows>();
    for (const j of jadwalRows) {
      const list = jadwalMap.get(j.pendaftaranId) ?? [];
      list.push(j);
      jadwalMap.set(j.pendaftaranId, list);
    }

    // Atribusi affiliate: satu pendaftaran maksimal satu affiliate.
    const referralRows = await prisma.referral.findMany({
      where: { pendaftaranId: { in: rows.map((r) => r.id) } },
      select: {
        pendaftaranId: true,
        status: true,
        affiliate: { select: { id: true, nama: true, kode: true } },
      },
    });
    const afiliasiMap = new Map(
      referralRows.map((r) => [
        r.pendaftaranId,
        {
          id: r.affiliate.id,
          nama: r.affiliate.nama,
          kode: r.affiliate.kode,
          status: r.status,
        },
      ])
    );

    return NextResponse.json({
      success: true,
      data: rows.map((d) => ({
        ...d,
        tujuan: parseTujuan(d.tujuan),
        // Jadwal aktif lebih diprioritaskan daripada jadwal lama yang dibatalkan.
        jadwal: pilihJadwal(jadwalMap.get(d.id) ?? []),
        afiliasi: afiliasiMap.get(d.id) ?? null,
      })),
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
