import prisma from "@/lib/db";
import { KEY_REKENING, REKENING_KOSONG, type Rekening } from "./pembayaran-konstanta";

export * from "./pembayaran-konstanta";

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
