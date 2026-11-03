import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import FlowbiteInit from "@/components/FlowbiteInit";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Indonesia-Korea Business Project — Forum Bilateral 2025",
  description:
    "Forum kemitraan strategis dan dialog bilateral industri Indonesia-Korea.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${manrope.variable} font-sans antialiased`}>
        {children}
        <FlowbiteInit />
      </body>
    </html>
  );
}
