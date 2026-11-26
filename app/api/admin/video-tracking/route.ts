import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { ambilTracking } from "@/lib/video-tracking-query";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const sp = new URL(req.url).searchParams;
    const hasil = await ambilTracking({
      search: sp.get("search") ?? "",
      status: sp.get("status") ?? "",
    });
    return NextResponse.json({ success: true, ...hasil });
  } catch (e) {
    console.error("GET /api/admin/video-tracking error:", e);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
