/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Dibutuhkan untuk instrumentation.ts (pulihkan koneksi WhatsApp saat start)
    instrumentationHook: true,
    // Library WhatsApp harus dimuat apa adanya oleh Node, bukan di-bundle.
    serverComponentsExternalPackages: ["@whiskeysockets/baileys", "pino", "qrcode"],
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};
export default nextConfig;
