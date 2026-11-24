"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Link2,
  Loader2,
  MessageCircle,
  Save,
  Gift,
} from "lucide-react";
import type { Rekening } from "@/lib/pembayaran-konstanta";
import {
  DEFAULT_KOMISI,
  DEFAULT_MIN_PENCAIRAN,
} from "@/lib/afiliasi-konstanta";

type Settings = {
  umum: string;
  grupKonsultasi: string;
  rekening: Rekening;
  afiliasi: { komisi: number; minimalPencairan: number };
};
type Message = { type: "success" | "error"; text: string };

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const labelCls = "mb-1.5 block text-xs font-semibold text-slate-600";
const card = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60";
const cardHead = "flex items-center gap-3 border-b border-slate-100 px-5 py-4";
const iconBox = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]";

const rekeningKosong: Rekening = {
  bankNama: "",
  bankNo: "",
  bankAtasNama: "",
};

export default function PengaturanGrup() {
  const router = useRouter();
  const [form, setForm] = useState<Settings>({
    umum: "",
    grupKonsultasi: "",
    rekening: rekeningKosong,
    afiliasi: { komisi: DEFAULT_KOMISI, minimalPencairan: DEFAULT_MIN_PENCAIRAN },
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/pengaturan")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/admin/login");
          throw new Error("Sesi berakhir. Silakan login kembali.");
        }
        if (!res.ok) throw new Error("Gagal memuat pengaturan.");
        return res.json();
      })
      .then((json: { data: Partial<Settings> }) => {
        if (!active) return;
        setForm({
          umum: json.data.umum ?? "",
          grupKonsultasi: json.data.grupKonsultasi ?? "",
          rekening: { ...rekeningKosong, ...(json.data.rekening ?? {}) },
          afiliasi: {
            komisi: json.data.afiliasi?.komisi ?? DEFAULT_KOMISI,
            minimalPencairan:
              json.data.afiliasi?.minimalPencairan ?? DEFAULT_MIN_PENCAIRAN,
          },
        });
      })
      .catch((err) => {
        if (active)
          setLoadError(err instanceof Error ? err.message : "Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  function setRek(field: keyof Rekening, value: string) {
    setForm((prev) => ({ ...prev, rekening: { ...prev.rekening, [field]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umum: form.umum.trim(),
          grupKonsultasi: form.grupKonsultasi.trim(),
          rekening: form.rekening,
          afiliasi: {
            komisi: Number(form.afiliasi.komisi) || 0,
            minimalPencairan: Number(form.afiliasi.minimalPencairan) || 0,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok || !json.success)
        throw new Error(json.error || "Gagal menyimpan pengaturan.");
      setMessage({ type: "success", text: "Pengaturan berhasil disimpan." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0052A4]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {loadError}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3">
        <span className={iconBox}>
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pengaturan Peserta</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Link grup umum dan rekening tujuan pembayaran aktivasi akun.
          </p>
        </div>
      </div>

      <section className={card}>
        <div className={cardHead}>
          <span className={iconBox}>
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Grup WhatsApp</h3>
            <p className="text-[11px] text-slate-500">Satu grup untuk seluruh peserta.</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="max-w-2xl">
            <label htmlFor="grup-umum" className={labelCls}>
              Link grup Korean Bisnis Klub
            </label>
            <input
              id="grup-umum"
              type="url"
              value={form.umum}
              onChange={(e) => setForm({ ...form, umum: e.target.value })}
              placeholder="https://chat.whatsapp.com/XXXXXXXX"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Berlaku untuk semua peserta, tanpa pembagian wilayah.
            </p>
          </div>

          <div className="max-w-2xl border-t border-slate-100 pt-4">
            <label htmlFor="grup-konsultasi" className={labelCls}>
              Link grup Jadwal Konsultasi Online
            </label>
            <input
              id="grup-konsultasi"
              type="url"
              value={form.grupKonsultasi}
              onChange={(e) => setForm({ ...form, grupKonsultasi: e.target.value })}
              placeholder="https://chat.whatsapp.com/XXXXXXXX"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Grup ini muncul di dashboard peserta setelah akun aktif (pembayaran terverifikasi).
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
            <h3 className="text-sm font-bold text-slate-900">Rekening bank</h3>
            <p className="text-[11px] text-slate-500">
              Tampil di halaman checkout sebelum peserta mengunggah bukti.
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="bank-nama">Nama bank</label>
            <input
              id="bank-nama"
              className={inputCls}
              value={form.rekening.bankNama}
              placeholder="BCA"
              onChange={(e) => setRek("bankNama", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="bank-no">Nomor rekening</label>
            <input
              id="bank-no"
              inputMode="numeric"
              className={inputCls}
              value={form.rekening.bankNo}
              placeholder="1234567890"
              onChange={(e) => setRek("bankNo", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="bank-atas">Atas nama</label>
            <input
              id="bank-atas"
              className={inputCls}
              value={form.rekening.bankAtasNama}
              placeholder="Nama pemilik rekening"
              onChange={(e) => setRek("bankAtasNama", e.target.value)}
            />
          </div>
        </div>
      </section>

      {message && (
        <div
          role="status"
          className={`flex max-w-2xl items-start gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ${
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

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0052A4] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
