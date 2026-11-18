// Memulihkan koneksi WhatsApp otomatis jika sebelumnya sudah pernah scan QR.
import { hasSavedSession, startWhatsApp } from "@/lib/whatsapp";

if (hasSavedSession()) {
  void startWhatsApp();
}
