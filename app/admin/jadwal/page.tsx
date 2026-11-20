import { redirect } from "next/navigation";

/** Jadwal sudah diganti halaman Kelola Video. */
export default function AdminJadwalRedirect() {
  redirect("/admin/video");
}
