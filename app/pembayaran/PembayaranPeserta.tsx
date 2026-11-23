import { CreditCard } from "lucide-react";
import type { PembayaranRingkas } from "@/lib/pembayaran";
import LogoutButton from "@/app/peserta/LogoutButton";
import FormAktivasi from "./FormAktivasi";

type Props = {
  nama: string;
  whatsapp: string;
  email: string;
  rekening: { bankNama: string; bankNo: string; bankAtasNama: string };
  grupUmum: { nama: string; deskripsi: string; url: string };
  pembayaran: PembayaranRingkas | null;
};

export default function PembayaranPeserta(props: Props) {
  return (
    <div className="min-h-screen bg-[#EEF1F8] font-sans">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3 leading-tight">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0052A4]/10 text-[#0052A4]">
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Indonesia-Korea Business Project
              </p>
              <p className="truncate text-xs text-slate-500">{props.nama}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <FormAktivasi {...props} />
      </main>
    </div>
  );
}
