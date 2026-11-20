// Memulihkan koneksi WhatsApp otomatis jika sebelumnya sudah pernah scan QR.
import { ensureWaWatchdog, hasSavedSession, startWhatsApp } from "@/lib/whatsapp";

if (hasSavedSession()) {
  void startWhatsApp();
}

// Error tak tertangkap dari library WhatsApp cukup dicatat, jangan sampai mematikan server.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

// Jaga koneksi tetap hidup: sambung ulang otomatis jika terputus.
ensureWaWatchdog();
