import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const now = new Date();

    // Awal hari ini
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Awal minggu ini (Senin)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - diffToMonday);

    // Awal bulan ini
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, today, week, month] = await Promise.all([
      prisma.pendaftaran.count(),
      prisma.pendaftaran.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pendaftaran.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.pendaftaran.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    // Breakdown per provinsi (top 10)
    const byProvinsi = await prisma.pendaftaran.groupBy({
      by: ["provinsi"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Breakdown per status
    const byStatus = await prisma.pendaftaran.groupBy({
      by: ["status"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Breakdown per ide bisnis
    const byIde = await prisma.pendaftaran.groupBy({
      by: ["ide"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Breakdown per sumber
    const bySumber = await prisma.pendaftaran.groupBy({
      by: ["sumber"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // 5 pendaftar terbaru
    const recent = await prisma.pendaftaran.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        provinsi: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Format response agar konsisten
    const formatGroup = (items: { _count: { id: number }; [key: string]: unknown }[], key: string) =>
      items.map((item) => ({
        label: (item[key] as string) || "(kosong)",
        value: item._count.id,
      }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        today,
        week,
        month,
        byProvinsi: formatGroup(byProvinsi, "provinsi"),
        byStatus: formatGroup(byStatus, "status"),
        byIde: formatGroup(byIde, "ide"),
        bySumber: formatGroup(bySumber, "sumber"),
        recent,
      },
    });
  } catch (error) {
    console.error("GET /api/pendaftaran/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
