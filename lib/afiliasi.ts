import crypto from "node:crypto";
import prisma from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import {
  DEFAULT_KOMISI,
  DEFAULT_MIN_PENCAIRAN,
  KEY_AFILIASI_KOMISI,
  KEY_AFILIASI_MIN_PENCAIRAN,
} from "./afiliasi-konstanta";

export * from "./afiliasi-konstanta";

/** Konfigurasi komisi & minimal pencairan dari tabel pengaturan. */
export async function getAfiliasiSettings(): Promise<{
  komisi: number;
  minimalPencairan: number;
}> {
  const rows = await prisma.pengaturan.findMany({
    where: {
      key: { in: [KEY_AFILIASI_KOMISI, KEY_AFILIASI_MIN_PENCAIRAN] },
    },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const toInt = (value: string | undefined, fallback: number) => {
    const n = parseInt(value ?? "", 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    komisi: toInt(map.get(KEY_AFILIASI_KOMISI), DEFAULT_KOMISI),
    minimalPencairan: toInt(
      map.get(KEY_AFILIASI_MIN_PENCAIRAN),
      DEFAULT_MIN_PENCAIRAN
    ),
  };
}

/** Kode unik contoh: IK7K3M9Q (tanpa huruf/angka yang mudah tertukar). */
export function buatKodeAfiliasi(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `IK${suffix}`;
}

export function linkAfiliasi(kode: string): string {
  return `${SITE_URL}/daftar?ref=${encodeURIComponent(kode)}`;
}

/** Saldo komisi yang bisa dicairkan (belum diproses/dibayar/dibatalkan). */
export async function getSaldoAfiliasi(affiliateId: number) {
  const agg = await prisma.komisi.aggregate({
    where: { affiliateId, status: "tersedia" },
    _sum: { jumlah: true },
    _count: true,
  });
  return { saldo: agg._sum.jumlah ?? 0, jumlahKomisi: agg._count };
}
