import { redirect } from "next/navigation";

/**
 * Halaman login affiliate lama. Sekarang semua peran (admin, peserta, affiliate)
 * masuk lewat satu form di /login.
 */
export default function AfiliasiLoginLama() {
  redirect("/login?callbackUrl=%2Fafiliasi%2Fdashboard");
}
