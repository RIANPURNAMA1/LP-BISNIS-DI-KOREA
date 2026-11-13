import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { parseTujuan } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 10000;

type Column = {
  header: string;
  width: number;
  align?: "left" | "center";
};

const COLUMNS: Column[] = [
  { header: "No", width: 6, align: "center" },
  { header: "Nama", width: 26 },
  { header: "WhatsApp", width: 20, align: "center" },
  { header: "Email", width: 30 },
  { header: "Domisili", width: 15, align: "center" },
  { header: "Negara", width: 20 },
  { header: "Provinsi/State", width: 22 },
  { header: "Kota/Kabupaten", width: 20 },
  { header: "Kecamatan", width: 18 },
  { header: "Desa/Kelurahan", width: 18 },
  { header: "Alamat Lengkap", width: 42 },
  { header: "Status", width: 20 },
  { header: "Ide Bisnis", width: 26 },
  { header: "Personal Income", width: 18 },
  { header: "Tujuan Program", width: 42 },
  { header: "Cerita Bisnis", width: 46 },
  { header: "Sumber Informasi", width: 20 },
  { header: "Tanggal Daftar", width: 20, align: "center" },
];

const PROJECT_NAME = "INDONESIA-KOREA BUSINESS PROJECT";

function tujuanText(value: unknown) {
  return parseTujuan(value).join("; ");
}

function estimateRowHeight(values: string[]) {
  // Perkiraan tinggi baris agar teks panjang tetap nyaman dibaca.
  const longest = Math.max(
    values[10].length / 42, // alamat
    values[14].length / 42, // tujuan
    values[15].length / 46, // cerita
    1,
  );
  return Math.min(96, Math.max(22, Math.ceil(longest) * 14));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Tidak terautentikasi." },
        { status: 401 },
      );
    }

    const search = (req.nextUrl.searchParams.get("search") ?? "").trim();
    const where = search
      ? {
          OR: [
            { nama: { contains: search } },
            { email: { contains: search } },
            { whatsapp: { contains: search } },
          ],
        }
      : {};

    const data = await prisma.pendaftaran.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = PROJECT_NAME;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Data Pendaftar", {
      views: [{ state: "frozen", ySplit: 4 }],
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2,
        },
      },
    });

    const columnCount = COLUMNS.length;

    COLUMNS.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width;
    });

    // ── Judul ────────────────────────────────────────────────────
    sheet.mergeCells(1, 1, 1, columnCount);
    const title = sheet.getCell(1, 1);
    title.value = `DATA PENDAFTAR — ${PROJECT_NAME}`;
    title.font = {
      name: "Calibri",
      size: 16,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    title.alignment = { horizontal: "center", vertical: "middle" };
    title.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0052A4" },
    };
    sheet.getRow(1).height = 36;

    // ── Subjudul ─────────────────────────────────────────────────
    sheet.mergeCells(2, 1, 2, columnCount);
    const subtitle = sheet.getCell(2, 1);
    subtitle.value = `Total ${data.length} pendaftar  •  Diekspor ${new Date().toLocaleString(
      "id-ID",
    )}`;
    subtitle.font = {
      name: "Calibri",
      size: 10,
      italic: true,
      color: { argb: "FFE0ECF9" },
    };
    subtitle.alignment = { horizontal: "center", vertical: "middle" };
    subtitle.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF003D7A" },
    };
    sheet.getRow(2).height = 22;

    // ── Garis aksen ──────────────────────────────────────────────
    sheet.mergeCells(3, 1, 3, columnCount);
    const accent = sheet.getCell(3, 1);
    accent.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE3081C" },
    };
    sheet.getRow(3).height = 5;

    // ── Header tabel ─────────────────────────────────────────────
    const headerRow = sheet.getRow(4);
    headerRow.height = 34;
    COLUMNS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0052A4" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF004080" } },
        left: { style: "thin", color: { argb: "FF004080" } },
        bottom: { style: "thin", color: { argb: "FF004080" } },
        right: { style: "thin", color: { argb: "FF004080" } },
      };
    });

    // ── Isi data ─────────────────────────────────────────────────
    data.forEach((row, index) => {
      const isLuar = row.provinsi === "Luar Negeri";
      const values = [
        index + 1,
        row.nama,
        row.whatsapp,
        row.email,
        isLuar ? "Luar Negeri" : "Indonesia",
        isLuar ? row.kabupaten : "",
        isLuar ? row.kecamatan : row.provinsi,
        isLuar ? row.desa : row.kabupaten,
        isLuar ? "" : row.kecamatan,
        isLuar ? "" : row.desa,
        row.alamat ?? "",
        row.status,
        row.ide,
        row.pendapatan ?? "",
        tujuanText(row.tujuan),
        row.cerita ?? "",
        row.sumber ?? "",
        row.createdAt,
      ];

      const excelRow = sheet.addRow(values);
      excelRow.height = estimateRowHeight(values.map((v) => String(v ?? "")));

      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10, color: { argb: "FF1F2937" } };
        cell.alignment = {
          horizontal: COLUMNS[colNumber - 1].align ?? "left",
          vertical: "top",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };

        // Warna selang-seling untuk memudahkan membaca baris.
        if (index % 2 === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
      });

      // Nomor urut rata tengah dan tebal.
      const numberCell = excelRow.getCell(1);
      numberCell.font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: "FF0052A4" },
      };

      // WhatsApp sebagai teks agar tanda "+" dan angka 0 di depan tidak hilang.
      const waCell = excelRow.getCell(3);
      waCell.numFmt = "@";

      // Tandai pendaftar luar negeri.
      if (isLuar) {
        const domisiliCell = excelRow.getCell(5);
        domisiliCell.font = {
          name: "Calibri",
          size: 10,
          bold: true,
          color: { argb: "FF0369A1" },
        };
        domisiliCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0F2FE" },
        };

        const negaraCell = excelRow.getCell(6);
        negaraCell.font = {
          name: "Calibri",
          size: 10,
          bold: true,
          color: { argb: "FF1F2937" },
        };
      }

      // Format tanggal daftar.
      const dateCell = excelRow.getCell(18);
      if (row.createdAt instanceof Date) {
        dateCell.numFmt = "dd/mm/yyyy hh:mm";
        dateCell.alignment = {
          horizontal: "center",
          vertical: "top",
          wrapText: true,
        };
      }

      // Status dan kesiapan bisnis diberi warna lembut.
      const statusCell = excelRow.getCell(12);
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFF6FF" },
      };
      statusCell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: "FF1D4ED8" },
      };

      const ideCell = excelRow.getCell(13);
      ideCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0FDF4" },
      };
      ideCell.font = {
        name: "Calibri",
        size: 10,
        color: { argb: "FF15803D" },
      };
    });

    // ── Filter otomatis di header ────────────────────────────────
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + data.length, column: columnCount },
    };

    const fileDate = new Date().toISOString().slice(0, 10);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pendaftar-bisnis-korea-${fileDate}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/pendaftaran/export error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat membuat file Excel." },
      { status: 500 },
    );
  }
}
