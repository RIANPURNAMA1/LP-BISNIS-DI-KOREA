import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Grup WhatsApp",
};

export default function PengaturanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
