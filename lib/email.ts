import crypto from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { formatRupiah, HARGA_KONSULTASI } from "@/lib/pembayaran";

/**
 * Notifikasi email ke peserta yang baru mendaftar.
 * Akun pengirim (SMTP) diatur lewat halaman admin dan disimpan di tabel `pengaturan`.
 * Password SMTP dienkripsi (AES-256-GCM) dengan kunci turunan AUTH_SECRET.
 */

const K = {
  enabled: "email_enabled",
  host: "email_smtp_host",
  port: "email_smtp_port",
  secure: "email_smtp_secure",
  user: "email_smtp_user",
  pass: "email_smtp_pass",
  fromName: "email_from_name",
  fromEmail: "email_from_email",
  subject: "email_subject",
  message: "email_message",
  paymentSubject: "email_pembayaran_subject",
  paymentMessage: "email_pembayaran_message",
} as const;

export const DEFAULT_SUBJECT = "Selamat anda sudah terdaftar silahkan login disini";
export const DEFAULT_MESSAGE =
  "Selamat anda sudah terdaftar silahkan login disini. Selesaikan pembayaran aktivasi akun terlebih dahulu sebelum masuk ke Ruang Member Bisnis di Korea.";

export const DEFAULT_PAYMENT_SUBJECT = "Pembayaran aktivasi akun Anda dikonfirmasi";
export const DEFAULT_PAYMENT_MESSAGE =
  "Halo {nama}, pembayaran aktivasi akun sudah kami verifikasi. Terima kasih! Silakan login ke Ruang Member Bisnis di Korea untuk menonton video dan melanjutkan konsultasi lanjutan.";

export type EmailSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  paymentSubject: string;
  paymentMessage: string;
  /** Password sudah tersimpan atau belum (nilainya tidak pernah dikirim ke browser). */
  hasPassword: boolean;
};

/* ---------------- enkripsi password SMTP ---------------- */

function key() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (!secret) throw new Error("AUTH_SECRET belum diatur.");
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

/* ---------------- pengaturan ---------------- */

async function readRaw() {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: Object.values(K) } },
  });
  return new Map(rows.map((r) => [r.key, r.value]));
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const m = await readRaw();
  const port = parseInt(m.get(K.port) ?? "", 10);
  return {
    enabled: m.get(K.enabled) === "1",
    host: m.get(K.host) ?? "",
    port: Number.isFinite(port) ? port : 587,
    secure: m.get(K.secure) === "1",
    user: m.get(K.user) ?? "",
    fromName: m.get(K.fromName) ?? SITE_NAME,
    fromEmail: m.get(K.fromEmail) ?? "",
    subject: m.get(K.subject) || DEFAULT_SUBJECT,
    message: m.get(K.message) || DEFAULT_MESSAGE,
    paymentSubject: m.get(K.paymentSubject) || DEFAULT_PAYMENT_SUBJECT,
    paymentMessage: m.get(K.paymentMessage) || DEFAULT_PAYMENT_MESSAGE,
    hasPassword: !!m.get(K.pass),
  };
}

/** Simpan pengaturan. `password` kosong/undefined = pertahankan password lama. */
export async function saveEmailSettings(
  s: Omit<EmailSettings, "hasPassword">,
  password?: string
) {
  const entries: [string, string][] = [
    [K.enabled, s.enabled ? "1" : "0"],
    [K.host, s.host],
    [K.port, String(s.port)],
    [K.secure, s.secure ? "1" : "0"],
    [K.user, s.user],
    [K.fromName, s.fromName],
    [K.fromEmail, s.fromEmail],
    [K.subject, s.subject],
    [K.message, s.message],
    [K.paymentSubject, s.paymentSubject],
    [K.paymentMessage, s.paymentMessage],
  ];
  if (password) entries.push([K.pass, encrypt(password)]);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.pengaturan.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );
}

/* ---------------- pengiriman ---------------- */

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Ganti {nama} pada teks admin. */
const fill = (text: string, nama: string) => text.replace(/\{nama\}/gi, nama);

const loginUrl = () => `${(process.env.AUTH_URL || SITE_URL).replace(/\/+$/, "")}/login`;

function buildMail(s: EmailSettings, nama: string) {
  const url = loginUrl();
  const message = fill(s.message, nama);
  const text = `Halo ${nama},\n\n${message}\n\nLogin di sini: ${url}\n\n${SITE_NAME}`;
  const safeUrl = esc(url);
  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(fill(s.subject, nama))}</title></head>
<body style="margin:0;padding:0;background:#EEF1F8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F8"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0052A4;padding:26px 32px">
<p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#bfdbfe">${esc(SITE_NAME.toUpperCase())}</p>
<p style="margin:0;font-size:20px;line-height:1.35;font-weight:bold;color:#ffffff">Selamat datang di Ruang Member Bisnis di Korea</p>
</td></tr>
<tr><td style="height:4px;background:#E3081C;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:30px 32px 8px">
<p style="margin:0 0 16px;font-size:15px;color:#0f172a">Halo <b>${esc(nama)}</b>,</p>
<p style="margin:0 0 26px;font-size:15px;line-height:1.75;color:#334155;white-space:pre-line">${esc(message)}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" bgcolor="#0052A4" style="border-radius:999px">
<a href="${safeUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px">Login di sini &rarr;</a>
</td></tr></table>
<p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br><span style="color:#0052A4;word-break:break-all">${safeUrl}</span></p>
</td></tr>
<tr><td style="padding:20px 32px 26px">
<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Email ini dikirim otomatis oleh ${esc(SITE_NAME)}. Silakan abaikan jika Anda bukan penerima yang dituju.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
  return { subject: fill(s.subject, nama), text, html };
}

const pesertaUrl = () => `${(process.env.AUTH_URL || SITE_URL).replace(/\/+$/, "")}/peserta`;

/** Email kedua: bukti pembayaran konsultasi online sudah diverifikasi admin. */
function buildPaymentMail(
  s: EmailSettings,
  p: { nama: string; metode: string; namaChannel: string; namaPengirim: string }
) {
  const url = pesertaUrl();
  const message = fill(s.paymentMessage, p.nama);
  const metodeLabel = "Transfer bank";
  const rincian = [
    ["Layanan", "Konsultasi Online"],
    ["Jumlah", formatRupiah(HARGA_KONSULTASI)],
    ["Metode", `${metodeLabel} — ${p.namaChannel || "-"}`],
    ["Nama pengirim", p.namaPengirim || "-"],
    ["Status", "Lunas / Dikonfirmasi"],
  ];
  const text = `Halo ${p.nama},\n\n${message}\n\nRincian pembayaran:\n${rincian
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n\nLihat detail: ${url}\n\n${SITE_NAME}`;
  const rows = rincian
    .map(
      ([k, v], i) =>
        `<tr><td style="padding:9px 0;border-bottom:${
          i === rincian.length - 1 ? "0" : "1px solid #e2e8f0"
        };font-size:13px;color:#64748b;vertical-align:top;width:38%">${esc(
          k
        )}</td><td style="padding:9px 0;border-bottom:${
          i === rincian.length - 1 ? "0" : "1px solid #e2e8f0"
        };font-size:13px;font-weight:bold;color:#0f172a;text-align:right">${esc(v)}</td></tr>`
    )
    .join("");
  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
    fill(s.paymentSubject, p.nama)
  )}</title></head>
<body style="margin:0;padding:0;background:#EEF1F8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F8"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0052A4;padding:26px 32px">
<p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#bfdbfe">${esc(
    SITE_NAME.toUpperCase()
  )}</p>
<p style="margin:0;font-size:20px;line-height:1.35;font-weight:bold;color:#ffffff">Pembayaran Dikonfirmasi</p>
</td></tr>
<tr><td style="height:4px;background:#E3081C;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:30px 32px 8px">
<div style="margin:0 0 18px;display:inline-block;padding:8px 14px;background:#ecfdf5;border-radius:999px;color:#047857;font-size:12px;font-weight:bold">&#10003; LUNAS &middot; DIVERIFIKASI</div>
<p style="margin:0 0 10px;font-size:15px;color:#0f172a">Halo <b>${esc(
    p.nama
  )}</b>,</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#334155;white-space:pre-line">${esc(
    message
  )}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px">
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
</table>
<p style="margin:24px 0 0"><a href="${esc(
    url
  )}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;background:#0052A4">Lihat halaman peserta &rarr;</a></p>
<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br><span style="color:#0052A4;word-break:break-all">${esc(
    url
  )}</span></p>
</td></tr>
<tr><td style="padding:20px 32px 26px">
<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Email ini dikirim otomatis oleh ${esc(
    SITE_NAME
  )} setelah pembayaran Anda diverifikasi.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
  return {
    subject: fill(s.paymentSubject, p.nama),
    text,
    html,
  };
}

async function transport(s: EmailSettings, pass: string) {
  return nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
}

/** Kirim email ke satu penerima. Melempar error jika SMTP belum lengkap / gagal. */
export async function sendEmail(to: string, nama: string) {
  const [s, m] = await Promise.all([getEmailSettings(), readRaw()]);
  const rawPass = m.get(K.pass);
  if (!s.host || !s.user || !s.fromEmail || !rawPass) {
    throw new Error("Pengaturan email belum lengkap.");
  }
  const mail = buildMail(s, nama);
  const t = await transport(s, decrypt(rawPass));
  await t.sendMail({
    from: { name: s.fromName || SITE_NAME, address: s.fromEmail },
    to,
    ...mail,
  });
}

/** Dipanggil setelah pendaftaran: tidak pernah melempar error (hanya dicatat). */
export async function notifyPesertaTerdaftar(p: { nama: string; email: string }) {
  try {
    const s = await getEmailSettings();
    if (!s.enabled) return;
    await sendEmail(p.email, p.nama);
  } catch (e) {
    console.error("[email] gagal mengirim notifikasi pendaftaran:", e);
  }
}

/** Dipanggil setelah admin menyetujui pembayaran. Tidak pernah melempar error. */
export async function notifyPembayaranDikonfirmasi(p: {
  nama: string;
  email: string;
  metode: string;
  namaChannel: string;
  namaPengirim: string;
}) {
  try {
    // Email pembayaran bersifat transaksional: tetap dikirim walau notifikasi
    // pendaftaran otomatis dimatikan, selama SMTP sudah dikonfigurasi.
    const [s, m] = await Promise.all([getEmailSettings(), readRaw()]);
    const rawPass = m.get(K.pass);
    if (!s.host || !s.user || !s.fromEmail || !rawPass) {
      throw new Error("Pengaturan email belum lengkap.");
    }
    const mail = buildPaymentMail(s, p);
    const t = await transport(s, decrypt(rawPass));
    await t.sendMail({
      from: { name: s.fromName || SITE_NAME, address: s.fromEmail },
      to: p.email,
      ...mail,
    });
  } catch (e) {
    console.error("[email] gagal mengirim notifikasi pembayaran:", e);
  }
}

/* ---------------- email status pembayaran (gerbang akses) ---------------- */

async function kirimEmailTransaksional(p: {
  nama: string;
  email: string;
  subjek: string;
  judul: string;
  pesan: string;
  ctaLabel: string;
  ctaHref: string;
  label: string;
}) {
  try {
    const [s, m] = await Promise.all([getEmailSettings(), readRaw()]);
    const rawPass = m.get(K.pass);
    if (!s.host || !s.user || !s.fromEmail || !rawPass) {
      throw new Error("Pengaturan email belum lengkap.");
    }
    const url = `${SITE_URL}${p.ctaHref}`;
    const text = `${p.judul}\n\nHalo ${p.nama},\n\n${p.pesan}\n\n${p.ctaLabel}: ${url}`;
    const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.subjek)}</title></head>
<body style="margin:0;padding:0;background:#EEF1F8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F8"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0052A4;padding:26px 32px">
<p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:#bfdbfe">${esc(SITE_NAME.toUpperCase())}</p>
<p style="margin:0;font-size:20px;line-height:1.35;font-weight:bold;color:#ffffff">${esc(p.judul)}</p>
</td></tr>
<tr><td style="height:4px;background:#E3081C;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:30px 32px 8px">
<p style="margin:0 0 10px;font-size:15px;color:#0f172a">Halo <b>${esc(p.nama)}</b>,</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#334155;white-space:pre-line">${esc(p.pesan)}</p>
<p style="margin:24px 0 0"><a href="${esc(url)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px;background:#0052A4">${esc(p.ctaLabel)} &rarr;</a></p>
<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">Jika tombol tidak berfungsi, salin tautan ini ke browser:<br><span style="color:#0052A4;word-break:break-all">${esc(url)}</span></p>
</td></tr>
<tr><td style="padding:20px 32px 26px">
<p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8">Email ini dikirim otomatis oleh ${esc(SITE_NAME)} terkait status pembayaran Anda.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
    const t = await transport(s, decrypt(rawPass));
    await t.sendMail({
      from: { name: s.fromName || SITE_NAME, address: s.fromEmail },
      to: p.email,
      subject: p.subjek,
      text,
      html,
    });
  } catch (e) {
    console.error(`[email] gagal mengirim notifikasi ${p.label}:`, e);
  }
}

/** Dipanggil saat peserta mengirim bukti transfer. Tidak pernah melempar error. */
export async function notifyBuktiDiterima(p: { nama: string; email: string }) {
  await kirimEmailTransaksional({
    ...p,
    subjek: "Bukti pembayaran diterima — menunggu verifikasi",
    judul: "Bukti Pembayaran Diterima",
    pesan:
      "Terima kasih. Bukti transfer Anda sudah kami terima dan sedang diverifikasi admin. Setelah disetujui, akun Anda aktif dan Anda bisa masuk ke halaman peserta.",
    ctaLabel: "Cek status pembayaran",
    ctaHref: "/pembayaran",
    label: "bukti diterima",
  });
}

/** Dipanggil saat admin menolak bukti pembayaran. Tidak pernah melempar error. */
export async function notifyPembayaranDitolak(p: {
  nama: string;
  email: string;
  catatan: string;
}) {
  await kirimEmailTransaksional({
    nama: p.nama,
    email: p.email,
    subjek: "Bukti pembayaran perlu diperbaiki",
    judul: "Pembayaran Belum Diverifikasi",
    pesan: `Mohon maaf, bukti pembayaran Anda belum dapat diverifikasi.\n\nAlasan admin: ${p.catatan}\n\nSilakan unggah ulang bukti transfer yang benar di halaman pembayaran.`,
    ctaLabel: "Unggah ulang bukti",
    ctaHref: "/pembayaran",
    label: "pembayaran ditolak",
  });
}

/* ---------------- konsultasi lanjutan ---------------- */

/** Jadwal konsultasi lanjutan berhasil dipilih peserta. */
export async function notifyJadwalKonsultasi(p: {
  nama: string;
  email: string;
  tanggal: string;
  jam: string;
}) {
  try {
    await kirimEmailTransaksional({
      nama: p.nama,
      email: p.email,
      subjek: "Jadwal konsultasi lanjutan Anda dikonfirmasi",
      judul: "Jadwal Konsultasi Dikonfirmasi",
      pesan: `Jadwal konsultasi lanjutan Anda pada ${p.tanggal} pukul ${p.jam} WIB sudah dikonfirmasi. Admin akan menghubungi Anda untuk informasi selanjutnya.`,
      ctaLabel: "Lihat halaman peserta",
      ctaHref: "/peserta",
      label: "jadwal konsultasi",
    });
  } catch (e) {
    console.error("[email] notifikasi jadwal gagal:", e);
  }
}

/** Peserta masuk waitinglist karena slot jadwal sudah penuh. */
export async function notifyWaitinglistDiterima(p: { nama: string; email: string }) {
  try {
    await kirimEmailTransaksional({
      nama: p.nama,
      email: p.email,
      subjek: "Anda masuk waitinglist konsultasi lanjutan",
      judul: "Waitinglist Konsultasi",
      pesan: "Semua jadwal sudah penuh. Data Anda sudah kami simpan di waitinglist dan akan kami prioritaskan. Admin akan menghubungi Anda untuk informasi selanjutnya.",
      ctaLabel: "Lihat halaman peserta",
      ctaHref: "/peserta",
      label: "waitinglist",
    });
  } catch (e) {
    console.error("[email] notifikasi waitinglist gagal:", e);
  }
}

/* ---------------- afiliasi ---------------- */

/** Affiliate baru mendaftar (langsung aktif tanpa persetujuan admin). */
export async function notifyAfiliasiTerdaftar(p: {
  nama: string;
  email: string;
  kode: string;
}) {
  await kirimEmailTransaksional({
    nama: p.nama,
    email: p.email,
    subjek: "Akun affiliate Anda sudah aktif",
    judul: "Selamat Bergabung sebagai Affiliate",
    pesan: `Pendaftaran affiliate Anda berhasil. Kode undangan Anda: ${p.kode}\n\nBagikan tautan undangan Anda dari dashboard affiliate. Komisi dihitung otomatis saat pembayaran peserta yang Anda undang terverifikasi admin.`,
    ctaLabel: "Buka Dashboard Affiliate",
    ctaHref: "/afiliasi/dashboard",
    label: "afiliasi terdaftar",
  });
}

/** Komisi affiliate muncul setelah pembayaran referral disetujui admin. */
export async function notifyKomisiDiperoleh(p: {
  nama: string;
  email: string;
  whatsapp: string;
  jumlah: number;
  referralNama: string;
}) {
  await kirimEmailTransaksional({
    nama: p.nama,
    email: p.email,
    subjek: "Komisi affiliate baru untuk Anda",
    judul: "Komisi Affiliate Diterima",
    pesan: `Selamat! Pembayaran peserta ${p.referralNama} yang mendaftar melalui tautan Anda sudah terverifikasi. Komisi sebesar ${formatRupiah(p.jumlah)} telah ditambahkan ke saldo Anda.\n\nSaldo dapat diajukan pencairan setelah mencapai minimal yang ditetapkan admin.`,
    ctaLabel: "Lihat saldo affiliate",
    ctaHref: "/afiliasi/dashboard",
    label: "komisi affiliate",
  });
}

/** Affiliate mengajukan pencairan saldo. */
export async function notifyPencairanDiajukan(p: {
  nama: string;
  email: string;
  jumlah: number;
  bankNama: string;
  bankNo: string;
}) {
  await kirimEmailTransaksional({
    nama: p.nama,
    email: p.email,
    subjek: "Pengajuan pencairan komisi diterima",
    judul: "Pencairan Komisi Diajukan",
    pesan: `Pengajuan pencairan sebesar ${formatRupiah(p.jumlah)} ke rekening ${p.bankNama} ${p.bankNo} sudah kami terima. Admin akan memproses transfer dan mengunggah buktinya.`,
    ctaLabel: "Cek status pencairan",
    ctaHref: "/afiliasi/dashboard",
    label: "pencairan diajukan",
  });
}

/** Admin memproses pencairan (dibayar / ditolak). */
export async function notifyPencairanDiproses(p: {
  nama: string;
  email: string;
  status: "dibayar" | "ditolak";
  jumlah: number;
  bukti?: string | null;
  catatan?: string;
}) {
  const dibayar = p.status === "dibayar";
  const bukti = p.bukti ? `\n\nBukti transfer: ${SITE_URL}${p.bukti}` : "";
  await kirimEmailTransaksional({
    nama: p.nama,
    email: p.email,
    subjek: dibayar
      ? "Komisi affiliate sudah ditransfer"
      : "Pengajuan pencairan komisi ditolak",
    judul: dibayar ? "Pencairan Komisi Berhasil" : "Pencairan Komisi Ditolak",
    pesan: dibayar
      ? `Pencairan komisi Anda sebesar ${formatRupiah(p.jumlah)} sudah ditransfer admin. Terima kasih atas kerjasamanya.${bukti}`
      : `Pengajuan pencairan komisi sebesar ${formatRupiah(p.jumlah)} belum dapat diproses.${p.catatan ? `\n\nCatatan admin: ${p.catatan}` : ""}\n\nKomisi Anda dikembalikan ke saldo dan dapat diajukan kembali.`,
    ctaLabel: "Buka Dashboard Affiliate",
    ctaHref: "/afiliasi/dashboard",
    label: "pencairan diproses",
  });
}
