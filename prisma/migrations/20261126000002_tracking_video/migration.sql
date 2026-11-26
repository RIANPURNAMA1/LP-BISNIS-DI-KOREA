-- Tracking tonton video peserta.
ALTER TABLE `pendaftaran`
    ADD COLUMN `video_mulai_at` DATETIME(3) NULL,
    ADD COLUMN `video_terakhir_at` DATETIME(3) NULL,
    ADD COLUMN `video_persen` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `video_posisi_detik` INTEGER NOT NULL DEFAULT 0;

-- Peserta yang sudah selesai sebelum fitur ini ada dianggap 100%.
UPDATE `pendaftaran` SET `video_persen` = 100, `video_mulai_at` = `video_selesai_at`
WHERE `video_selesai_at` IS NOT NULL;
