"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

type Profile = {
  id: number;
  name: string;
  email: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

function Alert({ message }: { message: Message }) {
  const isSuccess = message.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
        isSuccess
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message.text}</span>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
    >
      <Icon className="h-3.5 w-3.5 text-gray-400" />
      {children}
    </label>
  );
}

export default function AdminProfile() {
  const router = useRouter();
  const { update } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form informasi akun
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);

  // Form password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/profile")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/admin/login");
          throw new Error("Sesi berakhir. Silakan login kembali.");
        }
        if (!res.ok) throw new Error("Gagal memuat data profil.");
        return res.json();
      })
      .then((json: { success: boolean; data: Profile }) => {
        if (!active) return;
        setProfile(json.data);
        setName(json.data.name);
        setEmail(json.data.email);
      })
      .catch((err) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Gagal memuat data profil."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setProfileMessage({
        type: "error",
        text: "Nama dan email wajib diisi.",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan perubahan.");
      }

      setProfile((prev) =>
        prev ? { ...prev, name: trimmedName, email: trimmedEmail } : prev
      );
      setName(trimmedName);
      setEmail(trimmedEmail);

      // Perbarui sesi agar nama/email di navbar langsung berubah.
      // Kalau gagal, data di database tetap tersimpan dan sesi akan
      // tersinkron otomatis saat login berikutnya.
      try {
        await update({ name: trimmedName, email: trimmedEmail });
      } catch {
        // abaikan kegagalan refresh sesi
      }

      setProfileMessage({
        type: "success",
        text: "Informasi akun berhasil diperbarui.",
      });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Gagal menyimpan perubahan.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Password lama wajib diisi.",
      });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password baru minimal 6 karakter.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Konfirmasi password tidak cocok.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengubah password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        type: "success",
        text: "Password berhasil diubah. Gunakan password baru saat login berikutnya.",
      });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mengubah password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0052A4]" />
          <p className="mt-3 text-sm text-gray-500">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            {loadError || "Gagal memuat data profil."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const initial = (profile.name || profile.email || "A")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Profil Admin</h2>
        <p className="mt-1 text-sm text-gray-500">
          Kelola informasi akun dan keamanan akun admin Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informasi Akun */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0052A4] text-lg font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Informasi Akun
              </h3>
              <p className="truncate text-xs text-gray-500">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 p-5">
            <div>
              <FieldLabel htmlFor="name" icon={User}>
                Nama
              </FieldLabel>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama admin"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
              />
            </div>

            <div>
              <FieldLabel htmlFor="email" icon={Mail}>
                Email
              </FieldLabel>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Gunakan email baru ini untuk login berikutnya.
              </p>
            </div>

            {profileMessage && <Alert message={profileMessage} />}

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </section>

        {/* Ubah Password */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Ubah Password</h3>
              <p className="text-xs text-gray-500">
                Minimal 6 karakter. Password lama wajib diisi.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5">
            <div>
              <FieldLabel htmlFor="currentPassword" icon={KeyRound}>
                Password Lama
              </FieldLabel>
              <input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
              />
            </div>

            <div>
              <FieldLabel htmlFor="newPassword" icon={KeyRound}>
                Password Baru
              </FieldLabel>
              <input
                id="newPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
              />
            </div>

            <div>
              <FieldLabel htmlFor="confirmPassword" icon={KeyRound}>
                Konfirmasi Password Baru
              </FieldLabel>
              <input
                id="confirmPassword"
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                minLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0052A4] focus:outline-none focus:ring-2 focus:ring-[#0052A4]/20"
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#0052A4] focus:ring-[#0052A4]/20"
              />
              {showPasswords ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Tampilkan password
            </label>

            {passwordMessage && <Alert message={passwordMessage} />}

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0052A4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004080] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {savingPassword ? "Menyimpan..." : "Ubah Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
