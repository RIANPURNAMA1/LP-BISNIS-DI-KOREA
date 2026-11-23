import prisma from "@/lib/db";
import { KEY_REKENING, REKENING_KOSONG, type Rekening } from "./pembayaran-konstanta";

export * from "./pembayaran-konstanta";

/** Bentuk ringkas pembayaran yang dipakai halaman pembayaran dan popup aktivasi. */
export type PembayaranRingkas = {
  id: number;
  status: string;
  catatanAdmin: string | null;
  namaChannel: string;
  namaPengirim: string;
  buktiBayar: string;
  jumlah: number;
  createdAt: string;
  verifiedAt: string | null;
};

type BarisPembayaran = {
  id: number;
  status: string;
  catatanAdmin: string | null;
  namaChannel: string;
  namaPengirim: string;
  buktiBayar: string;
  jumlah: number;
  createdAt: Date;
  verifiedAt: Date | null;
};

export function ringkasPembayaran(row: BarisPembayaran | null): PembayaranRingkas | null {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    catatanAdmin: row.catatanAdmin,
    namaChannel: row.namaChannel,
    namaPengirim: row.namaPengirim,
    buktiBayar: row.buktiBayar,
    jumlah: row.jumlah,
    createdAt: row.createdAt.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
  };
}

/** Ambil rekening tujuan pembayaran dari tabel pengaturan. */
export async function getRekening(): Promise<Rekening> {
  const rows = await prisma.pengaturan.findMany({
    where: { key: { in: [...Object.values(KEY_REKENING)] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    bankNama: map.get(KEY_REKENING.bankNama) ?? REKENING_KOSONG.bankNama,
    bankNo: map.get(KEY_REKENING.bankNo) ?? REKENING_KOSONG.bankNo,
    bankAtasNama: map.get(KEY_REKENING.bankAtasNama) ?? REKENING_KOSONG.bankAtasNama,
  };
}
