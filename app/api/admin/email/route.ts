import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { getEmailSettings, saveEmailSettings, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    return NextResponse.json({ success: true, data: await getEmailSettings() });
  } catch (e) {
    console.error("GET /api/admin/email error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// Simpan pengaturan. Password kosong = pertahankan password yang sudah tersimpan.
export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const b = await req.json().catch(() => null);
    if (!b) return fail("Data tidak valid.");

    const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
    const current = await getEmailSettings();
    const port = parseInt(String(b.port), 10);
    const settings = {
      enabled: !!b.enabled,
      host: str(b.host, 255),
      port: Number.isInteger(port) && port > 0 && port < 65536 ? port : 587,
      secure: !!b.secure,
      user: str(b.user, 255),
      fromName: str(b.fromName, 100),
      fromEmail: str(b.fromEmail, 255),
      subject: str(b.subject, 200),
      message: str(b.message, 2000),
      paymentSubject: str(b.paymentSubject ?? current.paymentSubject, 200),
      paymentMessage: str(b.paymentMessage ?? current.paymentMessage, 2000),
    };
    if (settings.fromEmail && !EMAIL_RE.test(settings.fromEmail))
      return fail("Email pengirim tidak valid.");

    const password = typeof b.password === "string" ? b.password : "";
    if (settings.enabled) {
      if (!settings.host || !settings.user || !settings.fromEmail)
        return fail("Lengkapi host, username, dan email pengirim sebelum mengaktifkan.");
      if (!password && !current.hasPassword)
        return fail("Isi password SMTP sebelum mengaktifkan.");
    }
    await saveEmailSettings(settings, password);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/admin/email error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// Kirim email uji ke alamat tertentu: { to }
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())?.user) return fail("Tidak terautentikasi.", 401);
    const b = await req.json().catch(() => ({}));
    const to = String(b?.to ?? "").trim();
    if (!EMAIL_RE.test(to)) return fail("Masukkan alamat email tujuan yang valid.");
    try {
      await sendEmail(to, "Peserta");
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Gagal mengirim email uji.");
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/admin/email error:", e);
    return fail("Terjadi kesalahan server.", 500);
  }
}
