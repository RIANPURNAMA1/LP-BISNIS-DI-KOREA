import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import prisma from "@/lib/db";
import {
  BUKTI_PENCAIRAN_PREFIX,
} from "@/lib/afiliasi";
import {
  BUKTI_EXTENSIONS,
  MAX_BUKTI_SIZE,
} from "@/lib/pembayaran";
import { adminPencairanSchema } from "@/lib/validations";
import {
  notifyPencairanDiproses,
} from "@/lib/email";
import { notifyPencairanDiprosesAfiliasi } from "@/lib/wa-notif";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "bukti-pencairan");

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

/** Admin memproses pencairan: tandai dibayar (unggah bukti) atau tolak. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let filePath = "";
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id)) return fail("ID pencairan tidak valid.");

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        affiliate: {
          select: { nama: true, email: true, whatsapp: true },
        },
      },
    });
    if (!payout) return fail("Data pencairan tidak ditemukan.", 404);
    if (payout.status !== "menunggu") {
      return fail("Pencairan ini sudah diproses.", 409);
    }

    const contentType = req.headers.get("content-type") ?? "";
    let status = "";
    let catatan = "";
    let file: (Blob & { name?: string }) | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      if (!form) return fail("Data pencairan tidak valid.");
      status = String(form.get("status") ?? "");
      catatan = String(form.get("catatan") ?? "");
      const f = form.get("bukti");
      if (f && typeof f !== "string" && "arrayBuffer" in f) {
        file = f as Blob & { name?: string };
      }
    } else {
      const body = await req.json().catch(() => null);
      status = String(body?.status ?? "");
      catatan = String(body?.catatan ?? "");
    }

    const result = adminPencairanSchema.safeParse({ status, catatan });
    if (!result.success) return fail("Status harus dibayar atau ditolak.");
    const statusAkhir = result.data.status;
    const catatanAdmin = result.data.catatan;

    let bukti = payout.bukti;
    if (statusAkhir === "dibayar") {
      if (!file) return fail("Unggah bukti transfer terlebih dahulu.");
      const name = file.name ?? "bukti";
      const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
      if (!BUKTI_EXTENSIONS.includes(ext as (typeof BUKTI_EXTENSIONS)[number])) {
        return fail("Format bukti harus JPG, PNG, atau WebP.");
      }
      if (file.size > MAX_BUKTI_SIZE) return fail("Ukuran bukti maksimal 5 MB.");

      await mkdir(UPLOAD_DIR, { recursive: true });
      const fileName = `${randomUUID()}.${ext}`;
      filePath = path.join(UPLOAD_DIR, fileName);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      bukti = `${BUKTI_PENCAIRAN_PREFIX}${fileName}`;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.payout.update({
        where: { id },
        data: {
          status: statusAkhir,
          bukti,
          catatanAdmin: catatanAdmin || null,
          diprosesAt: new Date(),
        },
      });
      await tx.komisi.updateMany({
        where: { payoutId: id },
        data:
          statusAkhir === "dibayar"
            ? { status: "dibayar" }
            : {
                status: "tersedia",
                payoutId: null,
                keterangan: catatanAdmin || "Pencairan ditolak admin",
              },
      });
      return row;
    });

    void notifyPencairanDiproses({
      nama: payout.affiliate.nama,
      email: payout.affiliate.email,
      status: statusAkhir,
      jumlah: payout.jumlah,
      bukti,
      catatan: catatanAdmin,
    });
    void notifyPencairanDiprosesAfiliasi({
      nama: payout.affiliate.nama,
      whatsapp: payout.affiliate.whatsapp,
      status: statusAkhir,
      jumlah: payout.jumlah,
      catatan: catatanAdmin,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    if (filePath) await unlink(filePath).catch(() => {});
    console.error("PUT /api/admin/afiliasi/pencairan/[id] error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
