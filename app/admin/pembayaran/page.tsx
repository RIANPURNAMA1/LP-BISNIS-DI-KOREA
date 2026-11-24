"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
  type LucideIcon,
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

// Sama seperti halaman pendaftaran: tinggi baris & footer dipakai untuk
// menjaga tinggi tabel tetap penuh walau datanya sedikit.
const ROW_H = 53;
const FOOTER_H = 57;
const HEAD_H_FALLBACK = 42;

function tanggal(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function waLink(raw: string) {
  let n = raw.replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "62" + n.slice(1);
  return `https://wa.me/${n}`;
}

const COLUMNS: {
  key: string;
  label: string;
  width: number;
  get: (r: Pembayaran) => string;
}[] = [
  { key: "nama", label: "Nama", width: 170, get: (r) => r.nama ?? "" },
  { key: "whatsapp", label: "WhatsApp", width: 140, get: (r) => r.whatsapp ?? "" },
  { key: "email", label: "Email", width: 210, get: (r) => r.email ?? "" },
  { key: "jumlah", label: "Jumlah", width: 120, get: (r) => formatRupiah(r.jumlah) },
  { key: "channel", label: "Metode", width: 140, get: (r) => `Transfer · ${r.namaChannel}` },
  { key: "pengirim", label: "Nama Pengirim", width: 150, get: (r) => r.namaPengirim ?? "" },
  { key: "dikirim", label: "Waktu Kirim", width: 150, get: (r) => tanggal(r.createdAt) },
  {
    key: "diverifikasi",
    label: "Diverifikasi",
    width: 150,
    get: (r) => (r.verifiedAt ? tanggal(r.verifiedAt) : ""),
  },
  { key: "status", label: "Status", width: 130, get: (r) => STATUS_BAYAR[r.status] ?? r.status },
  {
    key: "akses",
    label: "Akses Member",
    width: 130,
    get: (r) => (r.pendaftaran?.aksesAktifAt ? "Aktif" : "Terkunci"),
  },
  { key: "catatan", label: "Catatan Admin", width: 190, get: (r) => r.catatanAdmin ?? "" },
];

function StatusBadge({ status }: { status: StatusBayar }) {
  const style =
    status === "dikonfirmasi"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "menunggu"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-red-50 text-red-700 ring-red-200";
  return (
    <span
      className={`inline-block max-w-full truncate rounded-full px-2.5 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide ring-1 ${style}`}
    >
      {STATUS_BAYAR[status]}
    </span>
  );
}

/** Status akses member: hanya aktif setelah admin mengonfirmasi pembayaran. */
function AksesBadge({ aktif }: { aktif: boolean }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide ring-1 ${
        aktif
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {aktif ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
      <span className="truncate">{aktif ? "Aktif" : "Terkunci"}</span>
    </span>
  );
}

export default function AdminPembayaran() {
  const router = useRouter();
  const [items, setItems] = useState<Pembayaran[]>([]);
  const [counts, setCounts] = useState<Counts>(countKosong);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const [limit, setLimit] = useState(0);
  const limitRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const calc = () => {
      const toolbarH = toolbarRef.current?.offsetHeight ?? 76;
      const headH =
        card.querySelector("thead")?.getBoundingClientRect().height || HEAD_H_FALLBACK;
      const space = card.clientHeight - toolbarH - FOOTER_H - headH - 8;
      const n = Math.max(5, Math.floor(space / ROW_H));
      if (limitRef.current !== n) {
        limitRef.current = n;
        setLimit(n);
      }
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

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
        type: json.emailTerkirim === false ? "error" : "success",
        text:
          status === "dikonfirmasi"
            ? json.emailTerkirim === false
              ? "Pembayaran dikonfirmasi, tetapi email ke peserta GAGAL terkirim. Periksa pengaturan SMTP di Pengaturan > Email."
              : `Pembayaran dikonfirmasi. Email konfirmasi telah dikirim ke ${dialog.item.email}.`
            : "Pembayaran ditolak. Email pemberitahuan dikirim ke peserta.",
      });
      setDialog(null);
      setCatatan("");
      await muat();
      // Sidebar memantau event ini supaya badge "menunggu verifikasi" langsung update.
      window.dispatchEvent(new Event("pembayaran:berubah"));
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Gagal menyimpan status.",
      });
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Filter; label: string; icon: LucideIcon; badge: string }[] = [
    { key: "all", label: "Semua pembayaran", icon: CreditCard, badge: "bg-[#0052A4]" },
    { key: "menunggu", label: "Menunggu", icon: Clock, badge: "bg-amber-500" },
    { key: "dikonfirmasi", label: "Dikonfirmasi", icon: CheckCircle2, badge: "bg-emerald-600" },
    { key: "ditolak", label: "Ditolak", icon: XCircle, badge: "bg-rose-500" },
  ];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[520px] flex-col gap-4">
      {/* Judul */}
      <div className="flex shrink-0 items-start gap-3 px-1">
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
          className={`flex shrink-0 items-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ${
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

      {/* Tab filter — mengikuti gaya tab Data Pendaftar */}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const aktif = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2 text-sm transition-colors ${
                aktif
                  ? "bg-white font-semibold text-[#0052A4] shadow-sm"
                  : "bg-white/60 font-medium text-slate-500 hover:bg-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
                  counts[tab.key] > 0 ? tab.badge : "bg-slate-400"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={cardRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
      >
        {/* Toolbar */}
        <div
          ref={toolbarRef}
          className="flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <form
            onSubmit={handleSearch}
            className="flex h-11 w-full items-center gap-2 rounded-full border border-slate-200 bg-white pl-4 pr-1.5 transition-colors focus-within:border-[#0052A4]/50 sm:max-w-sm"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, email, atau pengirim..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Hapus pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="grid h-8 w-8 place-items-center rounded-full bg-[#0052A4]/10 text-[#0052A4] transition-colors hover:bg-[#0052A4]/20"
              aria-label="Cari"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <button
            onClick={() => void muat()}
            disabled={loading}
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
          </button>
        </div>

        {loadError && (
          <div className="flex shrink-0 items-start gap-2 border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {loadError}
          </div>
        )}

        {/* Tabel */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-[#0052A4]" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto pl-3">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr className="text-xs font-medium text-slate-500">
                  <th className="w-12 rounded-l-lg border-y border-l border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-4 py-3">
                    #
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      style={{ minWidth: c.width }}
                      className="whitespace-nowrap border-y border-r border-slate-200 sticky top-0 z-10 bg-slate-100 px-3 py-3 font-medium"
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-y border-l border-slate-200 bg-slate-100 px-3 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const bg = "bg-white group-hover:bg-slate-50";
                  return (
                    <tr key={item.id} className="group h-[53px]">
                      <td className={`border-b border-l border-r border-slate-200 px-4 py-3.5 text-slate-400 ${bg}`}>
                        {i + 1}
                      </td>
                      {COLUMNS.map((c) => {
                        const text = c.get(item);
                        let content: React.ReactNode = text || <span className="text-slate-400">-</span>;
                        if (c.key === "nama") {
                          content = (
                            <Link
                              href={`/admin/pendaftaran/${item.pendaftaranId}`}
                              className="font-medium text-slate-900 hover:text-[#0052A4]"
                            >
                              {text}
                            </Link>
                          );
                        } else if (c.key === "whatsapp" && waLink(text)) {
                          content = (
                            <a
                              href={waLink(text)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0052A4] hover:underline"
                            >
                              {text}
                            </a>
                          );
                        } else if (c.key === "jumlah") {
                          content = <span className="font-semibold text-[#0052A4]">{text}</span>;
                        } else if (c.key === "status") {
                          content = <StatusBadge status={item.status} />;
                        } else if (c.key === "akses") {
                          content = <AksesBadge aktif={!!item.pendaftaran?.aksesAktifAt} />;
                        } else if (c.key === "catatan" && item.catatanAdmin) {
                          content = (
                            <span title={item.catatanAdmin} className="text-red-600">
                              {text}
                            </span>
                          );
                        }
                        return (
                          <td
                            key={c.key}
                            title={text}
                            className={`border-b border-r border-slate-200 px-3 py-3.5 align-middle text-slate-600 ${bg}`}
                            style={{ minWidth: c.width, maxWidth: c.width }}
                          >
                            <div className="truncate">{content}</div>
                          </td>
                        );
                      })}
                      <td
                        className={`sticky right-0 z-10 whitespace-nowrap border-b border-l border-slate-200 px-3 py-3.5 ${bg}`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <TableAction
                            onClick={() => {
                              setDialog({ item, mode: "bukti" });
                              setCatatan("");
                            }}
                            icon={Eye}
                            label="Lihat bukti"
                          />
                          {item.status !== "dikonfirmasi" && (
                            <>
                              <TableAction
                                onClick={() => {
                                  setDialog({ item, mode: "konfirmasi" });
                                  setCatatan("");
                                }}
                                icon={CheckCircle2}
                                label="Konfirmasi"
                                variant="primary"
                              />
                              <TableAction
                                onClick={() => {
                                  setDialog({ item, mode: "tolak" });
                                  setCatatan("");
                                }}
                                icon={XCircle}
                                label="Tolak"
                                variant="danger"
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={COLUMNS.length + 2}
                      className="h-[53px] border-b border-l border-r border-slate-200 bg-white px-4 text-center text-xs text-slate-400"
                    >
                      Belum ada pembayaran. Data baru akan muncul setelah peserta mengirim bukti.
                    </td>
                  </tr>
                )}
                {Array.from({ length: Math.max(0, limit - items.length) }).map((_, k) => (
                  <tr key={`empty-${k}`}>
                    <td className="h-[53px] border-b border-l border-r border-slate-200 bg-white" />
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="border-b border-r border-slate-200 bg-white" />
                    ))}
                    <td className="sticky right-0 z-10 border-b border-l border-slate-200 bg-white" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !loadError && (
          <div className="flex h-[57px] shrink-0 items-center justify-between border-t border-slate-100 px-4 text-xs text-slate-500">
            <span>
              {items.length === 0
                ? "0 pembayaran"
                : `Menampilkan ${items.length} pembayaran`}
            </span>
            <span>Total terfilter: {counts[filter]}</span>
          </div>
        )}
      </div>

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
                    email pemberitahuan dan akses Ruang Member aktif.
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

function TableAction({
  onClick,
  disabled,
  icon: Icon,
  label,
  variant = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  variant?: "default" | "primary" | "danger";
}) {
  const cls = `grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors disabled:opacity-50 ${
    variant === "danger"
      ? "hover:bg-rose-50 hover:text-rose-600"
      : variant === "primary"
        ? "hover:bg-emerald-50 hover:text-emerald-600"
        : "hover:bg-[#0052A4]/10 hover:text-[#0052A4]"
  }`;
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className={cls}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
