import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran Konsultasi",
};

export default function PembayaranLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
