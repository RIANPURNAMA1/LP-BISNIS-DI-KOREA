-- Waktu peserta ditandai "Sudah join" oleh admin.
ALTER TABLE `pendaftaran` ADD COLUMN `join_at` DATETIME(3) NULL;
