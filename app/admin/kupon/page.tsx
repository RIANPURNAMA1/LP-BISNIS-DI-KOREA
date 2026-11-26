"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus, Ticket, Trash2, Users } from "lucide-react";

type Kupon = {
  id: number;
  kode: string;
  kuota: number;
  terpakai: number;
  aktif: boolean;
  berlakuSampai: string | null;
  catatan: string | null;
  createdAt: string;
};

type Pemakai = {
  id: number;
  createdAt: string;
  pendaftaran: { id: number; nama: string; email: string; whatsapp: string };
};

const input =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

const waktu = (v: string) =>
  new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const tanggalWib = (v: string) =>
  new Date(v).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

// Nilai <input type="date"> (WIB) dari timestamp.
const keInputDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }) : "";

function statusKupon(k: Kupon) {
  if (!k.aktif) return { label: "Nonaktif", cls: "bg-slate-100 text-slate-600" };
  if (k.berlakuSampai && new Date(k.berlakuSampai) < new Date())
    return { label: "Kedaluwarsa", cls: "bg-rose-50 text-rose-600" };
  if (k.terpakai >= k.kuota) return { label: "Habis", cls: "bg-amber-50 text-amber-700" };
  return { label: "Aktif", cls: "bg-emerald-50 text-emerald-700" };
}

export default function KuponPage() {
  const [list, setList] = useState<Kupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [kode, setKode] = useState("");
  const [kuota, setKuota] = useState("10");
  const [berlaku, setBerlaku] = useState("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [buka, setBuka] = useState<number | null>(null);
  const [pemakai, setPemakai] = useState<Pemakai[] | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [editKuota, setEditKuota] = useState("");
  const [editBerlaku, setEditBerlaku] = useState("");
  const [editCatatan, setEditCatatan] = useState("");

  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kupon", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error();
      setList(json.data);
      setError("");
    } catch {
      setError("Gagal memuat kupon.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/kupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode, kuota: Number(kuota), berlakuSampai: berlaku, catatan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal membuat kupon.");
      setKode("");
      setCatatan("");
      setBerlaku("");
      await muat();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat kupon.");
    } finally {
      setSaving(false);
    }
  }

  async function ubah(id: number, body: object) {
    const res = await fetch(`/api/admin/kupon/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      alert(json.error || "Gagal menyimpan perubahan.");
      return false;
    }
    await muat();
    return true;
  }

  async function hapus(k: Kupon) {
    if (!confirm(`Hapus kupon ${k.kode}?`)) return;
    const res = await fetch(`/api/admin/kupon/${k.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) alert(json.error || "Gagal menghapus kupon.");
    else await muat();
  }

  async function togglePemakai(id: number) {
    if (buka === id) {
      setBuka(null);
      return;
    }
    setBuka(id);
    setPemakai(null);
    try {
      const res = await fetch(`/api/admin/kupon/${id}`, { cache: "no-store" });
      const json = await res.json();
      setPemakai(res.ok && json.success ? json.data : []);
    } catch {
      setPemakai([]);
    }
  }

  function mulaiEdit(k: Kupon) {
    setEdit(k.id);
    setEditKuota(String(k.kuota));
    setEditBerlaku(keInputDate(k.berlakuSampai));
    setEditCatatan(k.catatan ?? "");
  }

  async function simpanEdit(id: number) {
    const ok = await ubah(id, {
      kuota: Number(editKuota),
      berlakuSampai: editBerlaku,
      catatan: editCatatan,
    });
    if (ok) setEdit(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">Kupon Aktivasi</h1>
            <p className="text-xs text-slate-500">
              Peserta yang memasukkan kupon valid langsung aktif tanpa transfer.
            </p>
          </div>
        </div>

        <form
          onSubmit={buat}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_1fr_1.4fr_auto]"
        >
          <label className="text-xs font-medium text-slate-600">
            Kode (kosongkan untuk otomatis)
            <input
              value={kode}
              onChange={(e) => setKode(e.target.value.toUpperCase())}
              maxLength={40}
              placeholder="mis. KOREA2026"
              className={`${input} mt-1 uppercase`}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Kuota
            <input
              type="number"
              min={1}
              value={kuota}
              onChange={(e) => setKuota(e.target.value)}
              required
              className={`${input} mt-1`}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Berlaku sampai (opsional)
            <input
              type="date"
              value={berlaku}
              onChange={(e) => setBerlaku(e.target.value)}
              className={`${input} mt-1`}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Catatan (opsional)
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              maxLength={255}
              placeholder="mis. Peserta seminar Cianjur"
              className={`${input} mt-1`}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-full bg-[#0052A4] px-5 text-sm font-semibold text-white hover:bg-[#004080] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Buat
          </button>
        </form>
        {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-600">{error}</p>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">Belum ada kupon.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-100 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-3 py-3">Pemakaian</th>
                  <th className="px-3 py-3">Berlaku sampai</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Catatan</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((k) => {
                  const st = statusKupon(k);
                  const sisa = Math.max(0, k.kuota - k.terpakai);
                  return (
                    <Fragment key={k.id}>
                      <tr className="border-t border-slate-100">
                        <td className="px-4 py-3 font-mono text-sm font-bold text-slate-900">
                          {k.kode}
                        </td>
                        <td className="px-3 py-3">
                          {edit === k.id ? (
                            <input
                              type="number"
                              min={Math.max(1, k.terpakai)}
                              value={editKuota}
                              onChange={(e) => setEditKuota(e.target.value)}
                              className={`${input} w-24`}
                            />
                          ) : (
                            <div className="min-w-[140px]">
                              <span className="font-semibold text-slate-800">
                                {k.terpakai} / {k.kuota}
                              </span>
                              <span className="ml-1 text-xs text-slate-400">(sisa {sisa})</span>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#0052A4]"
                                  style={{
                                    width: `${Math.min(100, (k.terpakai / k.kuota) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {edit === k.id ? (
                            <input
                              type="date"
                              value={editBerlaku}
                              onChange={(e) => setEditBerlaku(e.target.value)}
                              className={`${input} w-40`}
                            />
                          ) : k.berlakuSampai ? (
                            tanggalWib(k.berlakuSampai)
                          ) : (
                            "Tanpa batas"
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-slate-500">
                          {edit === k.id ? (
                            <input
                              value={editCatatan}
                              onChange={(e) => setEditCatatan(e.target.value)}
                              maxLength={255}
                              className={input}
                            />
                          ) : (
                            <span className="block truncate" title={k.catatan ?? ""}>
                              {k.catatan || "-"}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          {edit === k.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => simpanEdit(k.id)}
                                className="rounded-full bg-[#0052A4] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#004080]"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEdit(null)}
                                className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => togglePemakai(k.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Users className="h-3.5 w-3.5" />
                                Riwayat
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    buka === k.id ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              <button
                                onClick={() => mulaiEdit(k)}
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() => ubah(k.id, { aktif: !k.aktif })}
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                {k.aktif ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                              <button
                                onClick={() => hapus(k)}
                                disabled={k.terpakai > 0}
                                title={k.terpakai > 0 ? "Sudah dipakai, nonaktifkan saja" : "Hapus"}
                                aria-label="Hapus"
                                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {buka === k.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-4 py-3">
                            {pemakai === null ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : pemakai.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                Belum ada yang memakai kupon ini.
                              </p>
                            ) : (
                              <ul className="divide-y divide-slate-200 text-xs">
                                {pemakai.map((m) => (
                                  <li
                                    key={m.id}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-0.5 py-1.5"
                                  >
                                    <span className="font-medium text-slate-800">
                                      {m.pendaftaran.nama}
                                    </span>
                                    <span className="text-slate-500">{m.pendaftaran.email}</span>
                                    <span className="text-slate-500">{m.pendaftaran.whatsapp}</span>
                                    <span className="ml-auto text-slate-400">
                                      {waktu(m.createdAt)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
