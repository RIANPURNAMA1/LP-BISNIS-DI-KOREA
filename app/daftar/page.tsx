"use client";

import DaftarPage from "@/components/DaftarPage";
import type { RegistrationPayload } from "@/components/DaftarPage";

export default function Daftar() {
  async function handleSubmit(data: RegistrationPayload) {
    const res = await fetch("/api/pendaftaran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || "Gagal mengirim pendaftaran");
    }
  }

  return <DaftarPage onSubmit={handleSubmit} />;
}
