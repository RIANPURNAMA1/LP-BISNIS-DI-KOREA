import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SITE_NAME } from "@/lib/site";
import "./seminar-cianjur.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const title = "Seminar Bisnis Cianjur – Indonesia-Korea Business Project";
const description =
  "Seminar offline Indonesia-Korea Business Project di Cianjur, Rabu 11 November 2026. Gratis, terpilih, dan tempat terbatas. Belajar mengembangkan bisnis Indonesia-Korea bersama Kang Gilar dan Kang Bara.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/seminarcianjur",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/seminarcianjur",
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: "/poster.jpg",
        alt: "Poster Seminar Indonesia-Korea Business Project Cianjur",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/poster.jpg"],
  },
};

export default function SeminarCianjurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${plusJakartaSans.className} seminar-cianjur`}>{children}</div>
  );
}
