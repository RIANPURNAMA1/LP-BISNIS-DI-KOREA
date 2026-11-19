import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Sesi",
};

export default function JadwalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
