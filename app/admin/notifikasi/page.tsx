"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

type WaStatus = "disconnected" | "connecting" | "qr" | "connected";

type Resp = {
  status: WaStatus;
  qr: string | null;
  number: string | null;
  settings: { enabled: boolean; numbers: string[] };
};

type Message = { type: "success" | "error"; text: string };

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const STATUS_LABEL: Record<WaStatus, string> = {
  disconnected: "Belum terhubung",
  connecting: "Menghubungkan...",
  qr: "Menunggu scan QR",
  connected: "Terhubung",
};

export default function NotifikasiWA() {
  const router = useRouter();
  const [wa, setWa] = useState<Resp | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"connect" | "disconnect" | "save" | "test" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [numbersText, setNumbersText] = useState("");
  const formInit = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat status WhatsApp.");
      const json = (await res.json()) as Resp;
      setWa(json);
      setLoadError("");
      // isi form dari server sekali saja, supaya ketikan admin tidak tertimpa polling
      if (!formInit.current) {
        formInit.current = true;
        setEnabled(json.settings.enabled);
        setNumbersText(json.settings.numbers.join("\n"));
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Gagal memuat status.");
    }
  }, [router]);

  // Polling status (QR berganti & status berubah otomatis)
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [refresh]);

  const status: WaStatus = wa?.status ?? "disconnected";
  const connected = status === "connected";

  function numbersList() {
    return numbersText
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);
  }

  async function act(action: "connect" | "disconnect") {
    if (
      action === "disconnect" &&
      !confirm("Putuskan WhatsApp? Notifikasi akan dimatikan dan Anda perlu scan QR lagi untuk menyambung.")
    )
      return;
    setMessage(null);
    setBusy(action);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Aksi gagal. Coba lagi.");
      if (action === "disconnect") setEnabled(false);
      await refresh();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Aksi gagal." });
    } finally {
      setBusy(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy("save");
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, numbers: numbersList() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan.");
      setNumbersText((json.settings.numbers as string[]).join("\n"));
      setMessage({ type: "success", text: "Pengaturan notifikasi disimpan." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setMessage(null);
    setBusy("test");
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", numbers: numbersList() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Pesan tes gagal.");
      setMessage({ type: "success", text: "Pesan tes terkirim. Cek WhatsApp di nomor tujuan." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Pesan tes gagal." });
    } finally {
      setBusy(null);
    }
  }

  if (!wa && !loadError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Notifikasi WhatsApp</h2>
        <p className="text-sm text-slate-500">
          Hubungkan WhatsApp admin, lalu atur nomor yang menerima pemberitahuan setiap ada pendaftar baru.
        </p>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Langkah 1 */}
        <section className={card}>
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">1. Hubungkan WhatsApp</h3>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                connected ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? "bg-emerald-500"
                    : status === "disconnected"
                      ? "bg-slate-300"
                      : "animate-pulse bg-amber-400"
                }`}
              />
              {STATUS_LABEL[status]}
            </span>
          </header>

          <div className="space-y-4 px-5 py-5">
            {status === "disconnected" && (
              <>
                <p className="text-sm text-slate-600">
                  Klik tombol di bawah, lalu scan QR dari WhatsApp di HP yang akan dipakai sebagai pengirim
                  notifikasi. Disarankan memakai nomor khusus, bukan nomor pribadi.
                </p>
                <button onClick={() => act("connect")} disabled={busy !== null} className={btnPrimary}>
                  {busy === "connect" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Hubungkan WhatsApp
                </button>
              </>
            )}

            {status === "connecting" && (
              <div className="flex items-center gap-3 py-6 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-[#0052A4]" />
                Menyiapkan koneksi...
              </div>
            )}

            {status === "qr" && wa?.qr && (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wa.qr}
                  alt="QR WhatsApp"
                  className="h-64 w-64 shrink-0 rounded-xl border border-slate-200"
                />
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
                  <li>Buka WhatsApp di HP.</li>
                  <li>
                    Ketuk <b>Menu (⋮)</b> atau <b>Pengaturan</b> &rarr; <b>Perangkat tertaut</b>.
                  </li>
                  <li>
                    Ketuk <b>Tautkan perangkat</b>, lalu arahkan kamera ke QR ini.
                  </li>
                  <li className="text-xs text-slate-400">QR diperbarui otomatis. Jika kedaluwarsa, klik Hubungkan lagi.</li>
                </ol>
              </div>
            )}

            {connected && (
              <>
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Terhubung sebagai <b>+{wa?.number ?? "-"}</b>. Koneksi tersimpan di server dan pulih
                  otomatis jika server restart.
                </div>
                <button onClick={() => act("disconnect")} disabled={busy !== null} className={btnGhost}>
                  {busy === "disconnect" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Putuskan WhatsApp
                </button>
              </>
            )}
          </div>
        </section>

        {/* Langkah 2 */}
        <section className={`${card} ${connected ? "" : "opacity-60"}`}>
          <header className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">2. Notifikasi pendaftar baru</h3>
            {!connected && (
              <p className="mt-0.5 text-xs text-slate-500">Aktif setelah WhatsApp terhubung.</p>
            )}
          </header>

          <form onSubmit={save} className="space-y-4 px-5 py-5">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-800">
                Kirim notifikasi setiap ada pendaftar baru
              </span>
              <input
                type="checkbox"
                checked={enabled}
                disabled={!connected}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-[#0052A4]"
              />
            </label>

            <div>
              <label htmlFor="numbers" className="mb-1.5 block text-sm font-medium text-slate-800">
                Nomor tujuan admin
              </label>
              <textarea
                id="numbers"
                rows={4}
                disabled={!connected}
                value={numbersText}
                onChange={(e) => setNumbersText(e.target.value)}
                placeholder={"081234567890\n+6281298765432"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20 disabled:bg-slate-50"
              />
              <p className="mt-1 text-xs text-slate-500">
                Satu nomor per baris, maksimal 5. Format 08xx atau +62xx diterima.
              </p>
            </div>

            {message && (
              <div
                className={`flex items-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={!connected || busy !== null} className={btnPrimary}>
                {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </button>
              <button
                type="button"
                onClick={sendTest}
                disabled={!connected || busy !== null}
                className={btnGhost}
              >
                {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Kirim pesan tes
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className={card}>
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-900">Contoh pesan yang diterima admin</h3>
        </header>
        <pre className="whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-slate-700">{`*Pendaftar baru*
_17 Nov 2026, 10.46 WIB_

Nama: Rian Purnama
WhatsApp: +6282118364415 (https://wa.me/6282118364415)
Email: rian@example.com
Domisili: Kota Administrasi Jakarta Pusat, DKI Jakarta
Status: Karyawan
Ide bisnis: Sudah memiliki ide bisnis
Personal income: Under 5jt
Tujuan: Mencari peluang bisnis di Korea, Mengembangkan ide startup
Sumber info: TikTok

Detail: https://domain-anda/admin/pendaftaran/12`}</pre>
      </section>
    </div>
  );
}
