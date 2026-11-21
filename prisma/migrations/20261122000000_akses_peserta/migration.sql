-- Gerbang akses member: null = belum boleh masuk /peserta.
ALTER TABLE `pendaftaran` ADD COLUMN `akses_aktif_at` DATETIME(3) NULL;

-- Backfill: aktifkan hanya pendaftar yang benar-benar punya pembayaran terverifikasi.
UPDATE `pendaftaran` AS p
INNER JOIN `pembayaran_konsultasi` AS b
  ON b.`pendaftaran_id` = p.`id`
SET p.`akses_aktif_at` = COALESCE(b.`verified_at`, p.`konsultasi_at`, NOW())
WHERE b.`status` = 'dikonfirmasi'
  AND p.`akses_aktif_at` IS NULL;

-- Bersihkan flag konsultasi lama dari endpoint progres yang bisa di-set sendiri peserta.
UPDATE `pendaftaran` AS p
LEFT JOIN `pembayaran_konsultasi` AS b
  ON b.`pendaftaran_id` = p.`id` AND b.`status` = 'dikonfirmasi'
SET p.`konsultasi_at` = NULL
WHERE p.`akses_aktif_at` IS NULL
  AND p.`konsultasi_at` IS NOT NULL
  AND b.`id` IS NULL;
