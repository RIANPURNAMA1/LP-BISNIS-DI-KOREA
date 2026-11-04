import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

const title = "Pendaftaran Program Bisnis di Korea Selatan";
const description =
  "Daftar Program Inkubasi Bisnis Startup Indonesia-Korea. Isi formulir pendaftaran untuk mendapatkan pendampingan bisnis, mentoring praktisi, dan panduan pendirian perusahaan di Korea Selatan.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/daftar",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/daftar",
    siteName: SITE_NAME,
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Formulir pendaftaran program bisnis di Korea Selatan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: ["/hero.png"],
  },
};

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
