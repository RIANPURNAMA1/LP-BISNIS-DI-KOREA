// Redaksi opsi posisi konsultasi lanjutan. Dipakai di form peserta maupun di
// tampilan admin supaya label yang tampil selalu sama dengan yang dipilih peserta.
export const POSISI_OPSI = [
  { kode: "A", label: "Modal di atas 2M & Punya Ide Bisnis di Korea" },
  { kode: "B", label: "Modal 100jt - 1M & Minat Indonesia-Korea Business Project" },
  { kode: "C", label: "Modal 50 sd. 100jt, Minat I-K Business Project Fulltime" },
  {
    kode: "D",
    label:
      "Modal 50 sd. 100jt, Minat I-K Business Project dan Kerja Part-time di Korea (wajib punya ijazah S1 untuk ini)",
  },
] as const;

/** Label lengkap opsi (tanpa kode), mis. untuk ditampilkan di admin. */
export function posisiLabel(kode?: string | null): string {
  if (!kode) return "";
  const upper = kode.toUpperCase();
  return POSISI_OPSI.find((o) => o.kode === upper)?.label ?? "";
}

/** Tampilan tabel: "A. Modal di atas 2M & ...". */
export function formatPosisi(kode?: string | null): string {
  const label = posisiLabel(kode);
  return label ? `${kode?.toUpperCase()}. ${label}` : "";
}
