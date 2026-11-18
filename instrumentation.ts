// Dijalankan sekali saat server Next.js start.
// Kode khusus Node (WhatsApp) dipisah ke file lain supaya tidak ikut ke runtime edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
