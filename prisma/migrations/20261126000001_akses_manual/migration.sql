-- Asal akses member (pembayaran | kupon | manual) dan catatan admin.
ALTER TABLE `pendaftaran`
    ADD COLUMN `akses_via` VARCHAR(20) NULL,
    ADD COLUMN `akses_catatan` VARCHAR(255) NULL;

-- Akses yang sudah aktif sebelum fitur ini hanya bisa berasal dari pembayaran terverifikasi.
UPDATE `pendaftaran` SET `akses_via` = 'pembayaran' WHERE `akses_aktif_at` IS NOT NULL;
