-- Sesuaikan default jumlah pembayaran aktivasi menjadi Rp29.900.
-- Data pembayaran lama sengaja tidak diubah agar riwayat tetap akurat.
ALTER TABLE `pembayaran_konsultasi` MODIFY `jumlah` INTEGER NOT NULL DEFAULT 29900;
