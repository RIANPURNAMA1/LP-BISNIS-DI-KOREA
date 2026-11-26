import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/guard";
import { ambilTracking } from "@/lib/video-tracking-query";
import { STATUS_VIDEO_LABEL } from "@/lib/video-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const wib = (v: string | null) =>
  v ? new Date(v).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) : "";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const format = sp.get("format") === "csv" ? "csv" : "xlsx";
  const { data } = await ambilTracking({
    search: sp.get("search") ?? "",
    status: sp.get("status") ?? "",
  });

  const header = ["No", "Nama", "Email", "WhatsApp", "Status", "Progres (%)", "Mulai", "Terakhir Menonton", "Selesai"];
  const rows = data.map((r, i) => [
    i + 1,
    r.nama,
    r.email,
    r.whatsapp,
    STATUS_VIDEO_LABEL[r.status],
    r.persen,
    wib(r.mulaiAt),
    wib(r.terakhirAt),
    wib(r.selesaiAt),
  ]);
  const tgl = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tracking-video-${tgl}.csv"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Tracking Video");
  ws.addRow(header).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  [6, 26, 30, 20, 16, 12, 22, 22, 22].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tracking-video-${tgl}.xlsx"`,
    },
  });
}
