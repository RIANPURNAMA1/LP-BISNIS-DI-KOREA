-- Jadwal konsultasi lanjutan langsung aktif tanpa verifikasi admin.
UPDATE `jadwal_sesi` SET `status` = 'dikonfirmasi' WHERE `status` = 'menunggu';

ALTER TABLE `jadwal_sesi` MODIFY `status` VARCHAR(20) NOT NULL DEFAULT 'dikonfirmasi';
