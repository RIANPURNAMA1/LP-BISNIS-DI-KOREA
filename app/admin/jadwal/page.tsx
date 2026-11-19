"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { STATUS_LABEL, formatTanggal } from "@/lib/jadwal-format";

type Item = {
  id: number;
  tanggal: string;
  jam: string;
  catatan: string | null;
  status: string;
  pendaftaran: { id: number; nama: string; whatsapp: string; email: string };
};
type Konten = { videoUrl: string; arahan: string; jam: string[] };

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

function KontenForm() {
  const [form, setForm] = useState<{ videoUrl: string; arahan: string; jam: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/konten", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { data: Konten }) =>
        setForm({ videoUrl: j.data.videoUrl, arahan: j.data.arahan, jam: j.data.jam.join(", ") }),
      )
      .catch(() => setMsg({ ok: false, text: "Gagal memuat pengaturan." }));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/konten", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      setMsg(
        res.ok
          ? { ok: true, text: "Pengaturan tersimpan." }
          : { ok: false, text: json?.error || "Gagal menyimpan." },
      );
    } catch {
      setMsg({ ok: false, text: "Gagal menyimpan. Periksa koneksi." });
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className={`${card} grid h-32 place-items-center`}><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;

  return (
    <form onSubmit={save} className={`${card} space-y-4 p-5`}>
      <div>
        <h2 className="text-sm font-bold text-slate-900">Konten halaman peserta</h2>
        <p className="text-xs text-slate-500">Video, teks arahan, dan jam sesi yang bisa dipilih peserta.</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Link video (YouTube / Vimeo)</span>
        <input
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className={input}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Teks arahan</span>
        <textarea
          value={form.arahan}
          onChange={(e) => setForm({ ...form, arahan: e.target.value })}
          rows={3}
          maxLength={1000}
          className={input}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Jam sesi (WIB, pisahkan dengan koma; hari kerja Senin–Jumat)
        </span>
        <input
          value={form.jam}
          onChange={(e) => setForm({ ...form, jam: e.target.value })}
          placeholder="09:00, 10:00, 13:00"
          className={input}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0052A4] px-5 text-sm font-semibold text-white hover:bg-[#00438a] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
        </button>
        {msg && (
          <span className={`flex items-center gap-1.5 text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

export default function AdminJadwal() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/jadwal", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setItems(json.data);
      setError("");
    } catch {
      setError("Gagal memuat jadwal.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/jadwal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setError((await res.json().catch(() => null))?.error || "Gagal mengubah status.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  const btn = "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Jadwal Sesi</h2>
        <p className="text-sm text-slate-500">Sesi meeting online yang dijadwalkan peserta.</p>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <section className={`${card} overflow-hidden`}>
        {!items ? (
          <div className="grid h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Belum ada jadwal masuk.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((j) => (
              <li key={j.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatTanggal(j.tanggal)} · {j.jam} WIB
                  </p>
                  <Link
                    href={`/admin/pendaftaran/${j.pendaftaran.id}`}
                    className="text-sm text-[#0052A4] hover:underline"
                  >
                    {j.pendaftaran.nama}
                  </Link>
                  <span className="text-sm text-slate-500"> · {j.pendaftaran.whatsapp}</span>
                  {j.catatan && <p className="mt-1 text-xs text-slate-500">Catatan: {j.catatan}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABEL[j.status]?.tone}`}>
                    {STATUS_LABEL[j.status]?.label}
                  </span>
                  {j.status === "menunggu" && (
                    <>
                      <button disabled={busy === j.id} onClick={() => setStatus(j.id, "dikonfirmasi")} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                        Konfirmasi
                      </button>
                      <button disabled={busy === j.id} onClick={() => setStatus(j.id, "ditolak")} className={`${btn} text-red-600 ring-1 ring-red-200 hover:bg-red-50`}>
                        Tolak
                      </button>
                    </>
                  )}
                  {j.status === "dikonfirmasi" && (
                    <button disabled={busy === j.id} onClick={() => setStatus(j.id, "selesai")} className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
                      Tandai selesai
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <KontenForm />
    </div>
  );
}
