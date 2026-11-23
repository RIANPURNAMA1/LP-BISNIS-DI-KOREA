import { redirect } from "next/navigation";

/**
 * Checkout konsultasi Rp29.900 sudah dihapus dari alur member.
 * Semua tahap konsultasi lanjutan sekarang ada di /peserta.
 */
export default function KonsultasiLanjutanRedirect() {
  redirect("/peserta");
}
