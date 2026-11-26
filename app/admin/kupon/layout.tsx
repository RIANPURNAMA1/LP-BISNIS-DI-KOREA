import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kupon Aktivasi",
};

export default function KuponLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
