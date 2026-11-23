import { redirect } from "next/navigation";

/**
 * Checkout konsultasi Rp49.000 sudah dihapus dari alur member.
 * Semua tahap konsultasi lanjutan sekarang ada di /peserta.
 */
export default function KonsultasiLanjutanRedirect() {
  redirect("/peserta");
}
