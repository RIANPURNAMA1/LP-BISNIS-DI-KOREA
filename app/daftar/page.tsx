"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import DaftarPage from "@/components/DaftarPage";
import { RegistrationFieldError } from "@/components/DaftarPage";
import type {
  RegistrationPayload,
  RegistrationResult,
} from "@/components/DaftarPage";

function DaftarDenganReferral() {
  const params = useSearchParams();
  const kodeAfiliasi = (params.get("ref") ?? "").trim().toUpperCase();

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
      // 400 = validasi gagal di server: tampilkan alasan pertamanya, bukan pesan koneksi.
      if (res.status === 400 && err?.errors) {
        const [kolom, pesan] =
          Object.entries(err.errors as Record<string, string[]>).find(
            ([, v]) => v?.length,
          ) ?? [];
        if (kolom && pesan?.[0])
          throw new Error(`Data belum valid (${kolom}): ${pesan[0]}`);
      }
      throw new Error(
        "Pendaftaran belum terkirim. Periksa koneksi Anda lalu coba lagi.",
      );
    }
    // Langsung masuk sebagai peserta; jika gagal, peserta diminta login manual.
    const login = await signIn("peserta", {
      email: data.email,
      password: data.password,
      redirect: false,
    }).catch(() => null);
    return { loggedIn: !!login && !login.error };
  }

  return <DaftarPage onSubmit={handleSubmit} kodeAfiliasi={kodeAfiliasi} />;
}

export default function Daftar() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <DaftarDenganReferral />
    </Suspense>
  );
}
