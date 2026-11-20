import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifikasi Email",
};

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
