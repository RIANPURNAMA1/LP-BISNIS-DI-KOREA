import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halaman Peserta",
  robots: { index: false, follow: false, nocache: true },
};

export default function PesertaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
