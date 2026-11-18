"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Link2, Loader2, Save } from "lucide-react";

type Links = { jabodetabek: string; luarJabodetabek: string };
type Message = { type: "success" | "error"; text: string };

const inputCls =
  "w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20";

export default function PengaturanGrup() {
  const router = useRouter();
  const [links, setLinks] = useState<Links>({
    jabodetabek: "",
    luarJabodetabek: "",
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
      .then((json: { data: Links }) => {
        if (active) setLinks(json.data);
      })
      .catch((err) => {
        if (active)
          setLoadError(
            err instanceof Error ? err.message : "Gagal memuat pengaturan."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(links),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok || !json.success)
        throw new Error(json.error || "Gagal menyimpan pengaturan.");
      setLinks({
        jabodetabek: links.jabodetabek.trim(),
        luarJabodetabek: links.luarJabodetabek.trim(),
      });
      setMessage({ type: "success", text: "Link grup berhasil disimpan." });
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
      <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-sm font-medium text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Grup WhatsApp</h2>
        <p className="mt-1 text-sm text-gray-500">
          Link grup yang ditampilkan ke pendaftar setelah formulir terkirim,
          sesuai wilayah domisili mereka.
        </p>
      </div>

      <section className="max-w-2xl rounded-md border border-gray-300 bg-white">
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label
              htmlFor="jabodetabek"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
            >
              <Link2 className="h-3.5 w-3.5 text-gray-400" />
              Link grup Jabodetabek
            </label>
            <input
              id="jabodetabek"
              type="url"
              value={links.jabodetabek}
              onChange={(e) =>
                setLinks({ ...links, jabodetabek: e.target.value })
              }
              placeholder="https://chat.whatsapp.com/XXXXXXXX"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Untuk pendaftar dari Jakarta, Bogor, Depok, Tangerang, dan Bekasi.
            </p>
          </div>

          <div>
            <label
              htmlFor="luar"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
            >
              <Link2 className="h-3.5 w-3.5 text-gray-400" />
              Link grup Luar Jabodetabek
            </label>
            <input
              id="luar"
              type="url"
              value={links.luarJabodetabek}
              onChange={(e) =>
                setLinks({ ...links, luarJabodetabek: e.target.value })
              }
              placeholder="https://chat.whatsapp.com/XXXXXXXX"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Untuk pendaftar dari luar Jabodetabek, termasuk yang berdomisili
              di luar negeri.
            </p>
          </div>

          <p className="rounded-md bg-gray-50 px-3.5 py-2.5 text-xs text-gray-500">
            Jika dikosongkan, pendaftar akan melihat pesan bahwa link grup
            dikirim lewat WhatsApp.
          </p>

          {message && (
            <div
              role="alert"
              className={`flex items-start gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
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
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Menyimpan..." : "Simpan Link Grup"}
          </button>
        </form>
      </section>
    </div>
  );
}
