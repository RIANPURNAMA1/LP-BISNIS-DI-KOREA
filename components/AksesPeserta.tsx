"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";

const VIA_LABEL: Record<string, string> = {
  pembayaran: "Pembayaran",
  kupon: "Kupon",
  manual: "Manual oleh admin",
};

/** Aktifkan / cabut akses member peserta secara manual oleh admin. */
export default function AksesPeserta({
  id,
  aksesAktifAt,
  aksesVia,
  aksesCatatan,
}: {
  id: number;
  aksesAktifAt?: string | null;
  aksesVia?: string | null;
  aksesCatatan?: string | null;
}) {
  const [aktifAt, setAktifAt] = useState(aksesAktifAt ?? null);
  const [via, setVia] = useState(aksesVia ?? null);
  const [catatanSimpan, setCatatanSimpan] = useState(aksesCatatan ?? null);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function kirim(aksi: "aktifkan" | "cabut") {
    if (aksi === "cabut" && !confirm("Cabut akses peserta ini? Progres peserta tetap tersimpan.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pendaftaran/akses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], aksi, catatan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Gagal memproses.");
      if (aksi === "aktifkan") {
        setAktifAt(new Date().toISOString());
        setVia("manual");
        setCatatanSimpan(catatan.trim() || null);
      } else {
        setAktifAt(null);
        setVia(null);
        setCatatanSimpan(null);
      }
      setCatatan("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          aktifAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {aktifAt ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
        Akses {aktifAt ? "aktif" : "terkunci"}
      </span>

      {aktifAt ? (
        <>
          <span className="text-xs text-gray-500">
            {via ? `Via ${VIA_LABEL[via] ?? via}` : ""}
            {aktifAt ? ` · ${new Date(aktifAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}` : ""}
            {catatanSimpan ? ` · ${catatanSimpan}` : ""}
          </span>
          <button
            onClick={() => kirim("cabut")}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-1.5 font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Cabut akses
          </button>
        </>
      ) : (
        <>
          <input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            maxLength={255}
            placeholder="Catatan (opsional), mis. peserta undangan"
            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20 sm:max-w-sm"
          />
          <button
            onClick={() => kirim("aktifkan")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-[#0052A4] px-4 py-1.5 font-semibold text-white transition-colors hover:bg-[#004080] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Aktifkan akses
          </button>
        </>
      )}
      {error && <span className="w-full text-xs text-red-600">{error}</span>}
    </div>
  );
}
