import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import pino from "pino";

/**
 * Koneksi WhatsApp (Baileys) untuk notifikasi admin.
 *
 * - Satu koneksi (singleton) per proses Node, disimpan di globalThis supaya
 *   tidak ganda saat hot-reload / banyak route memanggilnya.
 * - Sesi login disimpan di folder WA_SESSION_DIR (default: ./.wa-session),
 *   jadi setelah scan QR sekali, koneksi pulih otomatis saat server restart.
 * - Jalankan hanya SATU instance aplikasi (PM2 fork mode), karena satu
 *   sesi WhatsApp tidak boleh dipakai dua proses sekaligus.
 */

export type WaStatus = "disconnected" | "connecting" | "qr" | "connected";

export type WaSnapshot = {
  status: WaStatus;
  qr: string | null; // data URL gambar QR (hanya saat status "qr")
  number: string | null; // nomor yang terhubung
};

type WaState = {
  sock: any | null;
  status: WaStatus;
  qr: string | null;
  number: string | null;
  starting: boolean;
  wantConnected: boolean; // false setelah admin menekan "Putuskan"
  retry: number;
  timer: NodeJS.Timeout | null;
};

const g = globalThis as unknown as { __waState?: WaState; __waWatchdog?: NodeJS.Timeout };

const state: WaState = (g.__waState ??= {
  sock: null,
  status: "disconnected",
  qr: null,
  number: null,
  starting: false,
  wantConnected: false,
  retry: 0,
  timer: null,
});

const SESSION_DIR =
  process.env.WA_SESSION_DIR || path.join(process.cwd(), ".wa-session");

export function hasSavedSession() {
  // Hanya dianggap ada sesi jika sudah pernah berhasil login (registered),
  // bukan sekadar file kredensial dari QR yang belum dipindai.
  try {
    const file = path.join(SESSION_DIR, "creds.json");
    if (!fs.existsSync(file)) return false;
    return JSON.parse(fs.readFileSync(file, "utf-8"))?.registered === true;
  } catch {
    return false;
  }
}

function clearSession() {
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  } catch (e) {
    console.error("[wa] gagal menghapus sesi:", e);
  }
}

export function getWaSnapshot(): WaSnapshot {
  return { status: state.status, qr: state.qr, number: state.number };
}

/** Ubah nomor apa pun ke format internasional tanpa "+": 0812.. -> 62812.. */
export function normalizeNumber(raw: string) {
  let n = String(raw).replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

function scheduleRestart(delayMs: number) {
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    state.timer = null;
    void startWhatsApp();
  }, delayMs);
}

/** Mulai koneksi. Jika belum pernah login, akan menghasilkan QR. */
export async function startWhatsApp() {
  if (state.sock || state.starting) return;
  state.starting = true;
  state.wantConnected = true;
  state.status = "connecting";
  state.qr = null;

  try {
    const baileys: any = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default ?? baileys.makeWASocket;
    const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } =
      baileys;

    fs.mkdirSync(SESSION_DIR, { recursive: true });
    const { state: auth, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    let version: number[] | undefined;
    try {
      version = (await fetchLatestBaileysVersion()).version;
    } catch {
      // pakai versi bawaan library bila gagal mengambil versi terbaru
    }

    const sock = makeWASocket({
      ...(version ? { version } : {}),
      auth,
      logger: pino({ level: "silent" }),
      browser: ["Admin Pendaftaran", "Chrome", "1.0.0"],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      // Ping berkala menjaga koneksi tetap hidup dan mendeteksi koneksi mati diam-diam.
      keepAliveIntervalMs: 25_000,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
    });
    state.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          state.qr = await QRCode.toDataURL(qr, { width: 300, margin: 1 });
          state.status = "qr";
        } catch (e) {
          console.error("[wa] gagal membuat QR:", e);
        }
      }

      if (connection === "open") {
        state.status = "connected";
        state.qr = null;
        state.retry = 0;
        state.number =
          String(sock.user?.id || "")
            .split(":")[0]
            .split("@")[0] || null;
        console.log("[wa] terhubung sebagai", state.number);
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as any)?.output?.statusCode;
        state.sock = null;
        state.qr = null;

        // Logout dari HP (Perangkat tertaut -> keluar): sesi tidak berlaku lagi.
        if (code === DisconnectReason.loggedOut) {
          clearSession();
          state.status = "disconnected";
          state.number = null;
          state.wantConnected = false;
          return;
        }

        if (!state.wantConnected) {
          state.status = "disconnected";
          return;
        }

        // 440 = sesi dipakai proses lain (mis. dua instance server jalan bersamaan).
        // Beri jeda lebih lama agar dua proses tidak saling menendang terus-menerus.
        if (code === DisconnectReason.connectionReplaced) {
          console.warn(
            "[wa] sesi digantikan koneksi lain. Pastikan hanya SATU instance server yang berjalan."
          );
          state.status = "connecting";
          scheduleRestart(30_000);
          return;
        }

        // 515 = restart wajib setelah QR berhasil dipindai (normal).
        if (code === DisconnectReason.restartRequired) {
          state.status = "connecting";
          scheduleRestart(500);
          return;
        }

        // Belum pernah login & QR kedaluwarsa: berhenti, admin klik Hubungkan lagi.
        if (!auth.creds.registered) {
          state.status = "disconnected";
          state.wantConnected = false;
          return;
        }

        // Putus di tengah jalan (jaringan dll): coba lagi dengan jeda bertahap.
        state.status = "connecting";
        state.retry += 1;
        scheduleRestart(Math.min(2000 * state.retry, 30000));
      }
    });
  } catch (e) {
    console.error("[wa] gagal memulai:", e);
    state.sock = null;
    // Kegagalan sementara (jaringan, dll) tidak boleh memutus permanen: coba lagi.
    if (hasSavedSession()) {
      state.status = "connecting";
      state.retry += 1;
      scheduleRestart(Math.min(2000 * state.retry, 30000));
    } else {
      state.status = "disconnected";
    }
  } finally {
    state.starting = false;
  }
}

/**
 * Penjaga koneksi: tiap 30 detik, jika sesi tersimpan tetapi tidak ada koneksi
 * dan tidak ada percobaan sambung yang dijadwalkan, sambungkan lagi.
 * Dihentikan otomatis saat admin menekan "Putuskan" (sesi dihapus).
 */
export function ensureWaWatchdog() {
  if (g.__waWatchdog) return;
  g.__waWatchdog = setInterval(() => {
    if (!state.sock && !state.starting && !state.timer && hasSavedSession()) {
      console.log("[wa] penjaga: koneksi mati, menyambung ulang");
      state.retry = 0;
      void startWhatsApp();
    }
  }, 30_000);
  g.__waWatchdog.unref?.();
}

/** Putuskan koneksi dan hapus sesi (harus scan QR lagi untuk menyambung). */
export async function disconnectWhatsApp() {
  state.wantConnected = false;
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  const sock = state.sock;
  state.sock = null;
  if (sock) {
    try {
      await sock.logout();
    } catch {
      try {
        sock.end(undefined);
      } catch {}
    }
  }
  clearSession();
  state.status = "disconnected";
  state.qr = null;
  state.number = null;
  state.retry = 0;
}

/** Kirim pesan teks ke beberapa nomor. Mengembalikan hasil per nomor. */
export async function sendWaText(numbers: string[], text: string) {
  if (state.status !== "connected" || !state.sock) {
    throw new Error("WhatsApp belum terhubung.");
  }
  const results: { number: string; ok: boolean; error?: string }[] = [];
  for (const raw of numbers) {
    const number = normalizeNumber(raw);
    if (!number) continue;
    try {
      await state.sock.sendMessage(`${number}@s.whatsapp.net`, { text });
      results.push({ number, ok: true });
    } catch (e) {
      results.push({
        number,
        ok: false,
        error: e instanceof Error ? e.message : "Gagal mengirim",
      });
    }
    // jeda kecil antar penerima supaya tidak terlihat seperti spam
    await new Promise((r) => setTimeout(r, 800));
  }
  return results;
}
