export type TipeSesi = "klinik" | "jamuan" | "meja";

export interface Sesi {
  id: number;
  tipe: TipeSesi;
  judul: string;
  deskripsi: string;
  durasi: number; // menit
  harga: number; // rupiah
  gambar: string; // path gambar (ganti dengan foto asli)
}

export const tipeLabel: Record<TipeSesi, string> = {
  klinik: "Klinik",
  jamuan: "Jamuan",
  meja: "Meja Bundar",
};

// Contoh data: ganti sesuai agenda sebenarnya.
export const sesiData: Sesi[] = [
  {
    id: 1,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/7xcz0d-4CCV4z5C9v5UuGzy.png",
    tipe: "klinik",
    judul: "Klinik Ekspor & Kepatuhan",
    deskripsi: "Konsultasi regulasi ekspor-impor dan kepatuhan hukum untuk delegasi korporasi.",
    durasi: 60,
    harga: 1500000,
  },
  {
    id: 2,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/7xcz0d-4CCV4z5C9v5UuGzy.png",
    tipe: "klinik",
    judul: "Klinik Insentif Fiskal",
    deskripsi: "Pemetaan insentif pajak dan fasilitas perizinan investasi industri prioritas.",
    durasi: 90,
    harga: 2500000,
  },
  {
    id: 3,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/qbzot4-fKOSe7SQJsN57Ruh.png",
    tipe: "jamuan",
    judul: "Jamuan Jejaring VIP",
    deskripsi: "Makan malam eksklusif untuk direksi terpilih dan penjajakan kemitraan awal.",
    durasi: 150,
    harga: 3500000,
  },
  {
    id: 4,
    gambar: "/sesi/sesi-4.svg",
    tipe: "jamuan",
    judul: "Jamuan Siang Delegasi",
    deskripsi: "Jamuan informal untuk mempertemukan delegasi Indonesia dan Korea lintas sektor.",
    durasi: 90,
    harga: 2500000,
  },
  {
    id: 5,
    gambar: "/sesi/sesi-5.svg",
    tipe: "meja",
    judul: "Meja Bundar Rantai Pasok",
    deskripsi: "Diskusi tertutup soal logistik lintas negara dan kemitraan pasokan bahan baku.",
    durasi: 90,
    harga: 2500000,
  },
  {
    id: 6,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/yrmq2h-swRwBF2c2EiN6o8I.png",
    tipe: "meja",
    judul: "Meja Bundar Transfer Teknologi",
    deskripsi: "Penjajakan adopsi otomasi pabrik dan teknologi hijau bersama mitra riset.",
    durasi: 60,
    harga: 1500000,
  },
  {
    id: 7,
    gambar: "/sesi/sesi-7.svg",
    tipe: "klinik",
    judul: "Klinik Perizinan Investasi",
    deskripsi: "Pendampingan proses perizinan dan pemenuhan persyaratan investasi bilateral.",
    durasi: 60,
    harga: 1500000,
  },
  {
    id: 8,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/0msrwl-kDJLUibCEJjVb4Ru.png",
    tipe: "jamuan",
    judul: "Jamuan Penutup Eksekutif",
    deskripsi: "Resepsi petang untuk memfinalisasi nota kesepahaman awal antar direksi.",
    durasi: 150,
    harga: 3500000,
  },
  {
    id: 9,
    gambar: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=960,fit=crop,q=100/IlTdzRvq2wu6tXAO/b02ble-ViLQFOFnu2ivFkNd.png",
    tipe: "meja",
    judul: "Meja Bundar Teknologi Hijau",
    deskripsi: "Diskusi kolaborasi riset terapan dan adopsi teknologi hijau ramah energi.",
    durasi: 90,
    harga: 2500000,
  },
];