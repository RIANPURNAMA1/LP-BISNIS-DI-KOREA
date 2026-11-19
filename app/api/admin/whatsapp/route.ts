import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import {
  disconnectWhatsApp,
  getWaSnapshot,
  hasSavedSession,
  sendWaText,
  startWhatsApp,
} from "@/lib/whatsapp";
import {
  TEST_MESSAGE,
  getNotifSettings,
  parseNumbers,
  saveNotifSettings,
} from "@/lib/wa-notif";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Tidak terautentikasi." },
    { status: 401 }
  );
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

// Status koneksi + pengaturan notifikasi (dipolling oleh halaman admin).
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    let snap = getWaSnapshot();
    // Ada sesi tersimpan tapi koneksi belum jalan (mis. server baru restart): pulihkan.
    if (snap.status === "disconnected" && hasSavedSession()) {
      void startWhatsApp();
      snap = getWaSnapshot();
    }
    const settings = await getNotifSettings();
    return NextResponse.json({ success: true, ...snap, settings });
  } catch (error) {
    console.error("GET /api/admin/whatsapp error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// Aksi: connect | disconnect | test
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "connect") {
      void startWhatsApp();
      // beri waktu singkat agar status/QR pertama sudah terisi
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ success: true, ...getWaSnapshot() });
    }

    if (action === "disconnect") {
      await disconnectWhatsApp();
      // matikan notifikasi karena tidak ada koneksi lagi
      const settings = await getNotifSettings();
      await saveNotifSettings({ ...settings, enabled: false });
      return NextResponse.json({ success: true, ...getWaSnapshot() });
    }

    if (action === "test") {
      if (getWaSnapshot().status !== "connected")
        return fail("WhatsApp belum terhubung.");
      const numbers = parseNumbers(
        Array.isArray(body.numbers) ? body.numbers : []
      );
      if (numbers.length === 0)
        return fail("Isi minimal satu nomor tujuan yang valid.");
      const results = await sendWaText(numbers, TEST_MESSAGE);
      const gagal = results.filter((r) => !r.ok);
      if (gagal.length === results.length)
        return fail("Pesan tes gagal terkirim. Periksa nomor tujuan.", 502);
      return NextResponse.json({ success: true, results });
    }

    return fail("Aksi tidak dikenal.");
  } catch (error) {
    console.error("POST /api/admin/whatsapp error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}

// Simpan pengaturan notifikasi (aktif/nonaktif + nomor tujuan).
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session?.user) return unauthorized();

    const body = await req.json();
    const numbers = parseNumbers(Array.isArray(body.numbers) ? body.numbers : []);
    const enabled = Boolean(body.enabled);

    if (numbers.length > 5) return fail("Maksimal 5 nomor tujuan.");
    if (enabled && getWaSnapshot().status !== "connected")
      return fail("Hubungkan WhatsApp terlebih dahulu sebelum mengaktifkan notifikasi.");
    if (enabled && numbers.length === 0)
      return fail("Isi minimal satu nomor tujuan yang valid.");

    await saveNotifSettings({ enabled, numbers });
    return NextResponse.json({ success: true, settings: { enabled, numbers } });
  } catch (error) {
    console.error("PUT /api/admin/whatsapp error:", error);
    return fail("Terjadi kesalahan server.", 500);
  }
}
