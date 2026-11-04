export type Pendaftaran = {
  id: number;
  nama: string;
  whatsapp: string;
  email: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  status: string;
  ide: string;
  cerita: string;
  tujuan: string[];
  sumber: string;
  created_at: string;
  updated_at: string;
};

export type PendaftaranInput = Omit<Pendaftaran, "id" | "created_at" | "updated_at">;

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
};
