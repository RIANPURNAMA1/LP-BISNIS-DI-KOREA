"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  HARGA_KONSULTASI,
  STATUS_BAYAR,
  formatRupiah,
  type StatusBayar,
} from "@/lib/pembayaran-konstanta";

type Pembayaran = {
  id: number;
  pendaftaranId: number;
  nama: string;
  whatsapp: string;
  email: string;
  metode: string;
  namaChannel: string;
  namaPengirim: string;
  buktiBayar: string;
  jumlah: number;
  status: StatusBayar;
  catatanAdmin: string | null;
  createdAt: string;
  verifiedAt: string | null;
  pendaftaran: {
    id: number;
    wilayah: string;
    konsultasiAt: string | null;
    aksesAktifAt: string | null;
  };
};

type Counts = Record<StatusBayar | "all", number>;
type Filter = StatusBayar | "all";
type Dialog = { item: Pembayaran; mode: "bukti" | "konfirmasi" | "tolak" } | null;
type Toast = { type: "success" | "error"; text: string } | null;

const countKosong: Counts = { all: 0, menunggu: 0, dikonfirmasi: 0, ditolak: 0 };

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

// Tombol ringkas khusus baris tabel.
const btnTableGhost =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50";
const btnTablePrimary =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#0052A4] px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#004080]";
const btnTableDanger =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50";

function tanggal(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: StatusBayar }) {
  const style =
    status === "dikonfirmasi"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "menunggu"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${style}`}>
      {STATUS_BAYAR[status]}
    </span>
  );
}

/** Status akses member: hanya aktif setelah admin mengonfirmasi pembayaran. */
function AksesBadge({ aktif }: { aktif: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
        aktif
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {aktif ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {aktif ? "Aktif" : "Terkunci"}
    </span>
  );
}

export default function AdminPembayaran() {
  const router = useRouter();
  const [items, setItems] = useState<Pembayaran[]>([]);
  const [counts, setCounts] = useState<Counts>(countKosong);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const muat = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ status: filter });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/pembayaran?${params}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal memuat data.");
      setItems(json.data ?? []);
      setCounts({ ...countKosong, ...(json.counts ?? {}) });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [filter, search, router]);

  useEffect(() => {
    void muat();
  }, [muat]);

  async function proses(status: "dikonfirmasi" | "ditolak") {
    if (!dialog) return;
    if (status === "ditolak" && !catatan.trim()) {
      setToast({ type: "error", text: "Alasan penolakan wajib diisi." });
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/pembayaran/${dialog.item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatan: status === "ditolak" ? catatan : "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan status.");
      setToast({
        type: "success",
        text:
          status === "dikonfirmasi"
            ? "Pembayaran dikonfirmasi. Email konfirmasi telah dikirim ke peserta."
            : "Pembayaran ditolak.",
      });
      setDialog(null);
      setCatatan("");
      await muat();
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal menyimpan status.",
      });
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "menunggu", label: "Menunggu" },
    { key: "dikonfirmasi", label: "Dikonfirmasi" },
    { key: "ditolak", label: "Ditolak" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
          <CreditCard className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pembayaran Konsultasi Online</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Periksa bukti transfer peserta ({formatRupiah(HARGA_KONSULTASI)}), lalu verifikasi atau
            tolak. Peserta akan mendapat email setelah disetujui.
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition-colors ${
              filter === tab.key
                ? "ring-2 ring-[#0052A4]/40"
                : "ring-slate-200/60 hover:ring-[#0052A4]/20"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">{tab.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts[tab.key]}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / email / pengirim..."
            className={`${inputCls} pl-10`}
          />
        </div>
        <button onClick={() => void muat()} className={btnGhost} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
        </button>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/60">
          <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada pembayaran</p>
          <p className="mt-1 text-xs text-slate-500">
            Pembayaran baru akan muncul di sini setelah peserta mengirim bukti.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Peserta</th>
                  <th className="px-4 py-3 font-semibold">Pembayaran</th>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Akses</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex min-w-[190px] items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0052A4]/10 text-sm font-bold text-[#0052A4]">
                          {item.nama.trim().charAt(0).toUpperCase() || "P"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{item.nama}</p>
                          <p className="truncate text-[11px] text-slate-500">{item.whatsapp}</p>
                          <p className="truncate text-[11px] text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex min-w-[180px] items-start gap-2">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0052A4]/10 text-[#0052A4]">
                          <Banknote className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0052A4]">{formatRupiah(item.jumlah)}</p>
                          <p className="text-[11px] text-slate-600">Transfer · {item.namaChannel}</p>
                          <p className="text-[11px] text-slate-500">Pengirim: {item.namaPengirim}</p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-[11px]">
                      <p className="text-slate-400">Dikirim</p>
                      <p className="font-medium text-slate-700">{tanggal(item.createdAt)}</p>
                      <p className="mt-2 text-slate-400">Diverifikasi</p>
                      <p className="font-medium text-slate-700">
                        {item.verifiedAt ? tanggal(item.verifiedAt) : "-"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                      {item.catatanAdmin && (
                        <p
                          className="mt-2 max-w-[220px] rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] leading-4 text-red-700"
                          title={item.catatanAdmin}
                        >
                          Catatan: {item.catatanAdmin}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <AksesBadge aktif={!!item.pendaftaran?.aksesAktifAt} />
                      <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                        {item.pendaftaran?.aksesAktifAt
                          ? "Boleh masuk ruang member"
                          : "Menunggu verifikasi"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setDialog({ item, mode: "bukti" });
                            setCatatan("");
                          }}
                          className={btnTableGhost}
                        >
                          <Eye className="h-3.5 w-3.5" /> Bukti
                        </button>
                        {item.status !== "dikonfirmasi" && (
                          <>
                            <button
                              onClick={() => {
                                setDialog({ item, mode: "konfirmasi" });
                                setCatatan("");
                              }}
                              className={btnTablePrimary}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Konfirmasi
                            </button>
                            <button
                              onClick={() => {
                                setDialog({ item, mode: "tolak" });
                                setCatatan("");
                              }}
                              className={btnTableDanger}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-500">
            Menampilkan {items.length} pembayaran
          </div>
        </div>
      )}

      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && !busy && setDialog(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {dialog.mode === "bukti"
                    ? "Bukti pembayaran"
                    : dialog.mode === "konfirmasi"
                      ? "Konfirmasi pembayaran"
                      : "Tolak pembayaran"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {dialog.item.nama} · {formatRupiah(dialog.item.jumlah)}
                </p>
              </div>
              <button
                onClick={() => setDialog(null)}
                disabled={busy}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {dialog.mode === "bukti" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dialog.item.buktiBayar}
                  alt="Bukti pembayaran"
                  className="mx-auto max-h-[60vh] w-auto rounded-xl border border-slate-200"
                />
              )}

              {dialog.mode === "konfirmasi" && (
                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Pastikan bukti transfer sesuai. Setelah dikonfirmasi, peserta akan mendapat
                    email pemberitahuan dan sesi konsultasi online aktif.
                  </p>
                  <div className="flex justify-center rounded-xl bg-slate-50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dialog.item.buktiBayar}
                      alt="Bukti pembayaran"
                      className="max-h-48 w-auto rounded-lg"
                    />
                  </div>
                </>
              )}

              {dialog.mode === "tolak" && (
                <>
                  <p className="text-sm leading-6 text-slate-600">
                    Berikan alasan penolakan agar peserta bisa memperbaiki bukti pembayaran.
                  </p>
                  <textarea
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Bukti transfer kurang jelas, mohon unggah ulang."
                    className={`${inputCls} resize-y`}
                  />
                </>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => setDialog(null)} disabled={busy} className={btnGhost}>
                  Batal
                </button>
                {dialog.mode === "konfirmasi" && (
                  <button
                    onClick={() => void proses("dikonfirmasi")}
                    disabled={busy}
                    className={btnPrimary}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {busy ? "Memproses..." : "Ya, konfirmasi"}
                  </button>
                )}
                {dialog.mode === "tolak" && (
                  <button
                    onClick={() => void proses("ditolak")}
                    disabled={busy || !catatan.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {busy ? "Memproses..." : "Tolak pembayaran"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
