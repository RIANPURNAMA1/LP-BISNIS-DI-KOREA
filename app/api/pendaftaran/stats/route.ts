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

    // Deret harian 75 hari terakhir (zona waktu Jakarta) untuk grafik & tren.
    const DAY = 86400000;
    const RANGE = 75;
    const keyOf = (d: Date) =>
      d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const dailyKeys = Array.from({ length: RANGE }, (_, i) =>
      keyOf(new Date(now.getTime() - (RANGE - 1 - i) * DAY))
    );
    const rangeRows = await prisma.pendaftaran.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: new Date(now.getTime() - (RANGE + 1) * DAY) } },
    });
    const bucket = new Map<string, number>();
    for (const r of rangeRows) {
      const k = keyOf(r.createdAt);
      bucket.set(k, (bucket.get(k) ?? 0) + 1);
    }
    const daily = dailyKeys.map((date) => ({ date, count: bucket.get(date) ?? 0 }));

    // Jumlah pada jendela [from, from+len) dihitung dari akhir deret (0 = hari ini).
    const sumBack = (daysBackStart: number, len: number) => {
      let t = 0;
      for (let i = 0; i < len; i++) {
        const idx = RANGE - 1 - (daysBackStart + i);
        if (idx >= 0 && idx < RANGE) t += daily[idx].count;
      }
      return t;
    };
    const todayKey = dailyKeys[RANGE - 1];
    const [ty, tm, td] = todayKey.split("-").map(Number);
    const dow = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay(); // 0=Min
    const elapsedWeek = dow === 0 ? 7 : dow; // hari berjalan sejak Senin
    const elapsedMonth = td;
    const prevMonthLen = new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();

    const prev = {
      today: sumBack(1, 1),
      week: sumBack(7, elapsedWeek), // hari yang sama minggu lalu
      month: sumBack(prevMonthLen, elapsedMonth), // tanggal yang sama bulan lalu
    };

    // Breakdown per provinsi/negara (top 10)
    const byProvinsiRaw = await prisma.pendaftaran.groupBy({
      by: ["provinsi", "kabupaten"],
      _count: { id: true },
    });
    const provMap = new Map<string, number>();
    for (const item of byProvinsiRaw) {
      const label =
        item.provinsi === "Luar Negeri"
          ? `Luar Negeri - ${item.kabupaten}`
          : item.provinsi || item.kabupaten || "Tidak diisi";
      provMap.set(label, (provMap.get(label) ?? 0) + item._count.id);
    }
    const mergedProvinsi = [...provMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

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
        kabupaten: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Format response agar konsisten
    const formatGroup = (items: { _count: { id: number }; [key: string]: unknown }[], key: string) =>
      items.map((item) => ({
        label: (item[key] as string) || "Tidak diisi",
        value: item._count.id,
      }));

    return NextResponse.json({
      success: true,
      data: {
        total,
        // dihitung dari deret harian (zona Jakarta) agar sebanding dengan `prev`
        today: sumBack(0, 1),
        week: sumBack(0, elapsedWeek),
        month: sumBack(0, elapsedMonth),
        byProvinsi: mergedProvinsi,
        daily,
        prev,
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
