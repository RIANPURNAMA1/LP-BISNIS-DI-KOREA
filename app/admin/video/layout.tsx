import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Video",
};

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
