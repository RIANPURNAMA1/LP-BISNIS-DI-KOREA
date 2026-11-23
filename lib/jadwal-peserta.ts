import prisma from "@/lib/db";
import { notifyJadwalKonsultasi, notifyWaitinglistDiterima } from "@/lib/email";
import { notifyJadwalBaru, notifyWaitinglistBaru } from "@/lib/wa-notif";
import { getSlotTersedia, kursiTersedia, slotSeatKey } from "@/lib/jadwal";

/** Data peserta yang diperlukan untuk memilih jadwal / waitinglist. */
export type PesertaKonsultasi = {
  id: number;
  nama: string;
  whatsapp: string;
  email: string;
  videoSelesaiAt: Date | null;
  posisiKonsultasi: string | null;
};

export async function ambilPesertaKonsultasi(id: number) {
  return prisma.pendaftaran.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      whatsapp: true,
      email: true,
      videoSelesaiAt: true,
      posisiKonsultasi: true,
    },
  });
}

/** Amankan satu kursi di slot. Null berarti slot penuh (termasuk race condition). */
export async function pesanKursi({
  peserta,
  tanggal,
  jam,
  kategori,
  catatan,
}: {
  peserta: PesertaKonsultasi;
  tanggal: string;
  jam: string;
  kategori: string;
  catatan?: string;
}) {
  const kursi = await kursiTersedia(tanggal, jam, kategori);
  if (!kursi.length) return null;

  for (const nomor of kursi) {
    try {
      return await prisma.jadwalSesi.create({
        data: {
          pendaftaranId: peserta.id,
          tanggal,
          jam,
          catatan: catatan?.trim() || null,
          // Langsung dikonfirmasi, tanpa verifikasi admin.
          status: "dikonfirmasi",
          slotKey: slotSeatKey(tanggal, jam, nomor, kategori),
        },
        select: { id: true, tanggal: true, jam: true, catatan: true },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }
  return null;
}

export function kirimNotifikasiJadwal(
  peserta: PesertaKonsultasi,
  jadwal: { tanggal: string; jam: string; catatan?: string | null },
) {
  void notifyJadwalBaru({
    nama: peserta.nama,
    whatsapp: peserta.whatsapp,
    tanggal: jadwal.tanggal,
    jam: jadwal.jam,
    catatan: jadwal.catatan,
  });
  void notifyJadwalKonsultasi({
    nama: peserta.nama,
    email: peserta.email,
    tanggal: jadwal.tanggal,
    jam: jadwal.jam,
  });
}

/** Masukkan peserta ke waitinglist saat semua slot kategorinya penuh. */
export async function daftarWaitinglist(peserta: PesertaKonsultasi, catatan?: string) {
  try {
    const row = await prisma.waitinglist.create({
      data: {
        pendaftaranId: peserta.id,
        posisi: peserta.posisiKonsultasi,
        catatan: catatan?.trim() || null,
      },
      select: { id: true },
    });

    void notifyWaitinglistBaru({
      nama: peserta.nama,
      whatsapp: peserta.whatsapp,
      posisi: peserta.posisiKonsultasi,
      catatan: catatan?.trim() || null,
    });
    void notifyWaitinglistDiterima({ nama: peserta.nama, email: peserta.email });
    return row;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      const sudah = await prisma.waitinglist.findUnique({
        where: { pendaftaranId: peserta.id },
        select: { id: true },
      });
      if (sudah) return sudah;
    }
    throw e;
  }
}

/**
 * Pilih slot pertama yang masih kosong untuk kategori peserta.
 * Jika tidak ada slot / semua penuh, peserta otomatis masuk waitinglist.
 */
export async function pilihJadwalOtomatis(peserta: PesertaKonsultasi, catatan = "") {
  const kategori = peserta.posisiKonsultasi;
  if (!kategori) return null;

  const slots = await getSlotTersedia(kategori);
  for (const slot of slots) {
    if (slot.sisa <= 0) continue;
    const jadwal = await pesanKursi({
      peserta,
      tanggal: slot.tanggal,
      jam: slot.jam,
      kategori: slot.kategori,
      catatan,
    });
    if (jadwal) {
      kirimNotifikasiJadwal(peserta, jadwal);
      return { jenis: "jadwal" as const, id: jadwal.id, tanggal: jadwal.tanggal, jam: jadwal.jam };
    }
  }

  const waiting = await daftarWaitinglist(peserta, catatan);
  return { jenis: "waitinglist" as const, id: waiting.id };
}
