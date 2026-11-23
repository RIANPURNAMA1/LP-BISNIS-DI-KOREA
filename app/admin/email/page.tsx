"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  LogIn,
  Mail,
  Save,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Form = {
  enabled: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  paymentSubject: string;
  paymentMessage: string;
};

type Message = { type: "success" | "error"; text: string };

const card = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";
const cardHead = "flex items-center gap-3 border-b border-slate-100 px-5 py-4";
const iconBox = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";
const hintCls = "mt-1.5 text-[11px] leading-5 text-slate-500";
const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export default function NotifikasiEmail() {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [testTo, setTestTo] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/email", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/admin/login");
          throw new Error("Sesi berakhir. Silakan login kembali.");
        }
        if (!res.ok) throw new Error("Gagal memuat pengaturan.");
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const d = json.data;
        setHasPassword(d.hasPassword);
        setForm({
          enabled: d.enabled,
          host: d.host,
          port: String(d.port),
          secure: d.secure,
          user: d.user,
          password: "",
          fromName: d.fromName,
          fromEmail: d.fromEmail,
          subject: d.subject,
          message: d.message,
          paymentSubject: d.paymentSubject,
          paymentMessage: d.paymentMessage,
        });
      })
      .catch((e) => active && setLoadError(e instanceof Error ? e.message : "Gagal memuat."));
    return () => {
      active = false;
    };
  }, [router]);

  if (loadError)
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError}
      </div>
    );
  if (!form)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#0052A4]" />
      </div>
    );

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy("save");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan.");
      if (form.password) setHasPassword(true);
      setForm({ ...form, password: "" });
      setMessage({ type: "success", text: "Pengaturan email berhasil disimpan." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengirim email uji.");
      setMessage({ type: "success", text: `Email uji terkirim ke ${testTo}.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengirim." });
    } finally {
      setBusy(null);
    }
  }

  const previewSubject = form.subject.replace(/\{nama\}/gi, "Nama Peserta");
  const previewMessage = form.message.replace(/\{nama\}/gi, "Nama Peserta");

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className={iconBox}>
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notifikasi Email</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Email otomatis untuk peserta baru dan email konfirmasi setelah pembayaran konsultasi
            online diverifikasi.
          </p>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        <section className={card}>
          <div className={cardHead}>
            <span className={iconBox}>
              <Server className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Akun pengirim (SMTP)</h3>
              <p className="text-[11px] text-slate-500">Digunakan untuk mengirim email otomatis.</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Aktifkan email otomatis
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Dikirim saat ada pendaftar baru.
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#0052A4]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
              <div>
                <label className={labelCls} htmlFor="host">Host SMTP</label>
                <input
                  id="host"
                  className={inputCls}
                  value={form.host}
                  placeholder="smtp.gmail.com"
                  onChange={(e) => set("host", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="port">Port</label>
                <input
                  id="port"
                  inputMode="numeric"
                  className={inputCls}
                  value={form.port}
                  placeholder="587"
                  onChange={(e) => set("port", e.target.value)}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.secure}
                onChange={(e) => set("secure", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#0052A4]"
              />
              <span className="text-xs text-slate-600">
                SSL langsung (centang untuk port 465, kosongkan untuk 587)
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="user">Username / email login</label>
                <input
                  id="user"
                  autoComplete="off"
                  className={inputCls}
                  value={form.user}
                  placeholder="akun@gmail.com"
                  onChange={(e) => set("user", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pass">Password / App Password</label>
                <input
                  id="pass"
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={form.password}
                  placeholder={hasPassword ? "Tersimpan — kosongkan jika tidak diubah" : "Password SMTP"}
                  onChange={(e) => set("password", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="fromName">Nama pengirim</label>
                <input
                  id="fromName"
                  className={inputCls}
                  value={form.fromName}
                  onChange={(e) => set("fromName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="fromEmail">Email pengirim</label>
                <input
                  id="fromEmail"
                  type="email"
                  className={inputCls}
                  value={form.fromEmail}
                  placeholder="info@domainanda.com"
                  onChange={(e) => set("fromEmail", e.target.value)}
                />
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-xl bg-[#0052A4]/[0.06] px-3.5 py-2.5 text-[11px] leading-5 text-slate-600 ring-1 ring-[#0052A4]/10">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0052A4]" />
              <span>
                Untuk Gmail: host <b>smtp.gmail.com</b>, port <b>587</b>, dan gunakan{" "}
                <b>App Password</b> (verifikasi 2 langkah aktif), bukan password biasa. Password
                disimpan terenkripsi.
              </span>
            </p>
          </div>
        </section>

        <section className={card}>
          <div className={cardHead}>
            <span className={iconBox}>
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Isi email</h3>
              <p className="text-[11px] text-slate-500">Teks yang diterima peserta.</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className={labelCls} htmlFor="subject">Subjek</label>
              <input
                id="subject"
                className={inputCls}
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="message">Pesan</label>
              <textarea
                id="message"
                rows={4}
                className={`${inputCls} resize-y`}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
              <p className={hintCls}>
                Gunakan <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">{"{nama}"}</code>{" "}
                untuk nama peserta. Tombol <b>Login di sini</b> ditambahkan otomatis di bawah pesan.
              </p>
            </div>
          </div>
        </section>

        <section className={card}>
          <div className={cardHead}>
            <span className={iconBox}>
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Email konfirmasi pembayaran</h3>
              <p className="text-[11px] text-slate-500">
                Dikirim otomatis setelah pembayaran aktivasi akun terverifikasi.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className={labelCls} htmlFor="paymentSubject">Subjek</label>
              <input
                id="paymentSubject"
                className={inputCls}
                value={form.paymentSubject}
                onChange={(e) => set("paymentSubject", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="paymentMessage">Pesan</label>
              <textarea
                id="paymentMessage"
                rows={3}
                className={`${inputCls} resize-y`}
                value={form.paymentMessage}
                onChange={(e) => set("paymentMessage", e.target.value)}
              />
              <p className={hintCls}>
                Rincian pembayaran dan tombol <b>Lihat halaman peserta</b> ditambahkan otomatis.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy !== null} className={btnPrimary}>
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {busy === "save" ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
          <span className="text-[11px] text-slate-500">
            Perubahan berlaku untuk email yang dikirim setelahnya.
          </span>
        </div>
      </form>

      <section className={card}>
        <div className={cardHead}>
          <span className={iconBox}>
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pratinjau email</h3>
            <p className="text-[11px] text-slate-500">Tampilan yang akan diterima peserta.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#0052A4] px-5 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-200">
                {SITE_NAME}
              </p>
              <p className="mt-1 text-sm font-bold text-white">Selamat datang di Ruang Member Bisnis di Korea</p>
            </div>
            <div className="h-1 bg-[#E3081C]" />
            <div className="space-y-3 px-5 py-5">
              <p className="truncate text-[11px] text-slate-400">
                Subjek: <b className="text-slate-600">{previewSubject || "-"}</b>
              </p>
              <p className="text-sm text-slate-800">Halo <b>Nama Peserta</b>,</p>
              <p className="min-h-[3rem] whitespace-pre-line text-sm leading-6 text-slate-600">
                {previewMessage || "Tulis pesan di atas untuk melihat pratinjau."}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0052A4] px-5 py-2.5 text-xs font-bold text-white">
                <LogIn className="h-3.5 w-3.5" /> Login di sini &rarr;
              </span>
              <p className="break-all text-[10px] text-slate-400">{SITE_URL}/login</p>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[10px] leading-4 text-slate-400">
              Email ini dikirim otomatis oleh {SITE_NAME}.
            </p>
          </div>
        </div>
      </section>

      <section className={card}>
        <div className={cardHead}>
          <span className={iconBox}>
            <Send className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kirim email uji</h3>
            <p className="text-[11px] text-slate-500">Cek hasil pengiriman sebelum dipakai.</p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              className={inputCls}
              value={testTo}
              placeholder="email@tujuan.com"
              onChange={(e) => setTestTo(e.target.value)}
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={busy !== null || !testTo}
              className={btnGhost}
            >
              {busy === "test" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {busy === "test" ? "Mengirim..." : "Kirim"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Simpan pengaturan dulu, lalu kirim contoh email ke alamat Anda.
          </p>
        </div>
      </section>
    </div>
  );
}
