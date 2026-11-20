import { redirect } from "next/navigation";

/**
 * Kompatibilitas untuk bookmark/link lama: halaman admin kini digabung
 * dengan halaman login peserta di /login.
 */
export default function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl;
  const query =
    callbackUrl && callbackUrl.startsWith("/admin")
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
  redirect(`/login${query}`);
}
