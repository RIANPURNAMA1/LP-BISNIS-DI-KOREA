import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Admin",
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
