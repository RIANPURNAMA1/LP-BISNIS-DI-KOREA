"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileVideo,
  Link2,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";

type Mode = "file" | "link";
type Msg = { ok: boolean; text: string } | null;
type ProgresUnggah = {
  persen: number;
  terkirim: number;
  total: number;
  kecepatan: number; // byte/detik
  tahap: "unggah" | "simpan" | "selesai";
  bagian?: string; // mis. "Bagian 3/23"
};

const card = "rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60";
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";
const primary =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0052A4] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#00438a] disabled:cursor-not-allowed disabled:opacity-60";

const formatMB = (byte: number) => `${(byte / 1024 / 1024).toFixed(1)} MB`;
const formatKecepatan = (bps: number) =>
  bps >= 1024 * 1024
    ? `${(bps / 1024 / 1024).toFixed(1)} MB/s`
    : `${Math.round(bps / 1024)} KB/s`;
const formatSisa = (detik: number) =>
  detik >= 60 ? `${Math.floor(detik / 60)}m ${String(detik % 60).padStart(2, "0")}s` : `${detik}s`;

type ResponsUnggah = {
  status: number;
  json: { success?: boolean; videoUrl?: string; error?: string; diterima?: number } | null;
};

/** Potongan 5 MB: aman dari batas 100 MB Cloudflare dan memory PM2. */
const UKURAN_POTONGAN = 5 * 1024 * 1024;
const BATAS_POTONGAN = 20 * 1024 * 1024;

const idUnggahBaru = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

/**
 * fetch() tidak menyediakan progres upload. XMLHttpRequest.upload.onprogress
 * memberi byte yang sudah terkirim secara real-time.
 */
function kirimFormData(
  url: string,
  body: FormData,
  onProgres: (terkirim: number) => void,
): Promise<ResponsUnggah> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgres(e.loaded);
    };
    xhr.onload = () => {
      let json: ResponsUnggah["json"] = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* respons bukan JSON */
      }
      resolve({ status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

export default function AdminVideo() {
  const [arahan, setArahan] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mode, setMode] = useState<Mode>("link");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [progres, setProgres] = useState<ProgresUnggah | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/konten", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error();
      const data = json.data as { videoUrl: string; arahan: string };
      const url = (data.videoUrl ?? "").trim();
      setVideoUrl(url);
      setArahan(data.arahan ?? "");
      const uploaded = url.startsWith("/api/video/");
      setMode(uploaded ? "file" : "link");
      if (!uploaded) setLink(url);
      setMsg(null);
    } catch {
      setMsg({ ok: false, text: "Gagal memuat pengaturan video." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function unggahFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMsg({ ok: false, text: "Pilih file video terlebih dahulu." });
      return;
    }

    const mulai = Date.now();
    let uploadId = "";
    const update = (terkirim: number, tahap: ProgresUnggah["tahap"], bagian?: string) => {
      const detik = Math.max((Date.now() - mulai) / 1000, 0.1);
      setProgres({
        persen: Math.min(100, Math.round((terkirim / file.size) * 100)),
        terkirim,
        total: file.size,
        kecepatan: terkirim / detik,
        tahap,
        bagian,
      });
    };

    setSaving(true);
    setMsg(null);
    update(0, "unggah");
    try {
      let videoUrlBaru = "";

      if (file.size > BATAS_POTONGAN) {
        // File besar dipecah per 5 MB agar tidak mentok di Cloudflare (100 MB),
        // Nginx timeout, atau batas memory PM2.
        uploadId = idUnggahBaru();
        const jumlah = Math.ceil(file.size / UKURAN_POTONGAN);
        for (let i = 0; i < jumlah; i++) {
          const awal = i * UKURAN_POTONGAN;
          const akhir = Math.min(awal + UKURAN_POTONGAN, file.size);
          const body = new FormData();
          body.append("uploadId", uploadId);
          body.append("index", String(i));
          body.append("total", String(jumlah));
          body.append("nama", file.name);
          body.append("chunk", file.slice(awal, akhir), `bagian-${i}`);
          const res = await kirimFormData("/api/admin/video/chunk", body, (loaded) =>
            update(awal + loaded, "unggah", `Bagian ${i + 1}/${jumlah}`),
          );
          if (res.status < 200 || res.status >= 300 || !res.json?.success) {
            throw new Error(res.json?.error || `Gagal mengunggah bagian ${i + 1}.`);
          }
        }
        update(file.size, "simpan");
        const res = await fetch("/api/admin/video/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, nama: file.name, arahan, total: jumlah }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.videoUrl)
          throw new Error(json?.error || "Gagal menyimpan video.");
        videoUrlBaru = json.videoUrl;
      } else {
        const body = new FormData();
        body.append("file", file);
        body.append("arahan", arahan);
        const res = await kirimFormData("/api/admin/video", body, (loaded) =>
          update(loaded, "unggah"),
        );
        update(file.size, "simpan");
        if (res.status < 200 || res.status >= 300 || !res.json?.videoUrl) {
          throw new Error(res.json?.error || "Gagal mengunggah video.");
        }
        videoUrlBaru = res.json.videoUrl;
      }

      setVideoUrl(videoUrlBaru);
      setFile(null);
      update(file.size, "selesai");
      setMsg({ ok: true, text: "Video berhasil diunggah dan ditampilkan ke peserta." });
    } catch (err) {
      if (uploadId) {
        await fetch(`/api/admin/video/chunk?uploadId=${encodeURIComponent(uploadId)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
      setProgres(null);
      setMsg({
        ok: false,
        text:
          err instanceof Error
            ? err.message
            : "Gagal mengunggah. Periksa koneksi Anda.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function simpanLink(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: link, arahan }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ ok: false, text: json?.error || "Gagal menyimpan link." });
        return;
      }
      setVideoUrl(json.videoUrl);
      setMsg({ ok: true, text: "Link video tersimpan dan ditampilkan ke peserta." });
    } catch {
      setMsg({ ok: false, text: "Gagal menyimpan. Periksa koneksi Anda." });
    } finally {
      setSaving(false);
    }
  }

  async function hapusVideo() {
    if (!confirm("Hapus video ini? File yang diunggah juga akan terhapus.")) return;
    setDeleting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/video", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setVideoUrl("");
      setLink("");
      setFile(null);
      setMsg({ ok: true, text: "Video dihapus." });
    } catch {
      setMsg({ ok: false, text: "Gagal menghapus video." });
    } finally {
      setDeleting(false);
    }
  }

  const fileVideo = videoUrl.startsWith("/api/video/");

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">Kelola Video</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Video wajib tonton peserta. Unggah file atau tempel link YouTube.
        </p>
      </div>

      {msg && (
        <p
          role="status"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            msg.ok
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {msg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {msg.text}
        </p>
      )}

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Video saat ini</h3>
          {videoUrl && !loading && (
            <button
              onClick={hapusVideo}
              disabled={deleting}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              Hapus
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid h-16 place-items-center">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : !videoUrl ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
            Belum ada video. Peserta akan melihat pesan &ldquo;Video belum tersedia&rdquo;.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {fileVideo ? (
              <video
                src={videoUrl}
                controls
                playsInline
                className="max-h-48 w-full rounded-lg bg-black object-contain"
              />
            ) : (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-[#0052A4] ring-1 ring-slate-200 hover:bg-slate-100"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{videoUrl}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {fileVideo ? <FileVideo className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              {fileVideo ? "File video" : "Link video"}
            </span>
          </div>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ganti video</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pilih upload file atau link YouTube.
          </p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Teks arahan peserta</span>
          <textarea
            value={arahan}
            onChange={(e) => setArahan(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Contoh: Tonton video sampai selesai, lalu konfirmasi data diri."
            className={input}
          />
        </label>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              mode === "file" ? "bg-white text-[#0052A4] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" /> Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              mode === "link" ? "bg-white text-[#0052A4] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" /> Link YouTube
          </button>
        </div>

        {mode === "file" ? (
          <form onSubmit={unggahFile} className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov,.m4v"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setProgres(null);
                  setMsg(null);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 file:mr-2 file:rounded-full file:border-0 file:bg-[#0052A4]/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#0052A4]"
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                {file
                  ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
                  : "MP4, WebM, OGG, MOV, M4V · maksimal 200 MB. File besar dikirim otomatis per 5 MB agar tidak mentok di VPS/Cloudflare."}
              </span>
            </label>

            {progres && (
              <div className="space-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-medium text-slate-700">
                    {progres.tahap === "unggah"
                      ? `${progres.bagian ? `${progres.bagian} · ` : ""}Mengunggah ${formatMB(progres.terkirim)} / ${formatMB(progres.total)} · ${formatKecepatan(progres.kecepatan)}`
                      : progres.tahap === "simpan"
                        ? "Upload selesai — menyimpan video di server…"
                        : "Upload selesai"}
                  </span>
                  <span className="shrink-0 font-bold text-[#0052A4]">{progres.persen}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${
                      progres.tahap === "selesai" ? "bg-emerald-500" : "bg-[#0052A4]"
                    }`}
                    style={{ width: `${progres.persen}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {progres.tahap === "unggah" && progres.kecepatan > 0
                    ? `Perkiraan selesai ± ${formatSisa(
                        Math.max(0, Math.round((progres.total - progres.terkirim) / progres.kecepatan)),
                      )}. Jangan tutup halaman selama proses.`
                    : progres.tahap === "simpan"
                      ? "Mohon tunggu beberapa saat, video sedang ditulis ke penyimpanan."
                      : "Video siap ditonton peserta."}
                </p>
              </div>
            )}

            <button type="submit" disabled={saving || !file} className={primary}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving && progres?.tahap === "unggah"
                ? `Mengunggah ${progres.persen}%`
                : saving && progres?.tahap === "simpan"
                  ? "Menyimpan..."
                  : "Unggah & tampilkan"}
            </button>
          </form>
        ) : (
          <form onSubmit={simpanLink} className="space-y-2">
            <label className="block">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={input}
                required
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Mendukung YouTube (watch, youtu.be, shorts) dan Vimeo.
              </span>
            </label>
            <button type="submit" disabled={saving || !link.trim()} className={primary}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan link
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
