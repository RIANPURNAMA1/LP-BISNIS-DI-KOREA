import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Judul untuk tab browser dan pratinjau saat link dibagikan (WhatsApp, dll).
// `absolute` supaya template judul situs tidak menambahkan nama situs di belakangnya.
const JUDUL = "Bisnis di Korea | Program Inkubasi & Pengembangan Bisnis di Korea";

export const metadata: Metadata = {
  title: { absolute: JUDUL },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: `${SITE_URL}/login`,
    siteName: SITE_NAME,
    title: JUDUL,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Program inkubasi bisnis dan pendirian perusahaan di Korea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: JUDUL,
    description: SITE_DESCRIPTION,
    images: ["/hero.png"],
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
