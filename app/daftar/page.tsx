"use client";

import DaftarPage from "@/components/DaftarPage";
import { RegistrationFieldError } from "@/components/DaftarPage";
import type {
  RegistrationPayload,
  RegistrationResult,
} from "@/components/DaftarPage";

export default function Daftar() {
  async function handleSubmit(
    data: RegistrationPayload,
  ): Promise<RegistrationResult> {
    const res = await fetch("/api/pendaftaran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      if (res.status === 409 && err?.field === "email") {
        throw new RegistrationFieldError("email", err.error);
      }
      throw new Error(
        "Pendaftaran belum terkirim. Periksa koneksi Anda lalu coba lagi.",
      );
    }
    const json = await res.json().catch(() => null);
    return {
      groupUrl: typeof json?.groupUrl === "string" ? json.groupUrl : "",
    };
  }

  return <DaftarPage onSubmit={handleSubmit} />;
}
