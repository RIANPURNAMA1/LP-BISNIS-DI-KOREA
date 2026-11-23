/** Ringkasan affiliate yang mengklaim satu pendaftaran (atribusi 1 level). */
export type AfiliasiInfo = {
  id: number;
  nama: string;
  kode: string;
  status: string;
} | null;

/** Teks ringkas untuk kolom tabel/ekspor: "Nama (KODE)". */
export function afiliasiLabel(a: AfiliasiInfo) {
  return a ? `${a.nama} (${a.kode})` : "-";
}
