-- Slot jadwal kini dibuat per kategori konsultasi A–D.
-- Slot lama tetap dipakai peserta kategori A.

ALTER TABLE `jadwal_slot`
    ADD COLUMN `kategori` VARCHAR(1) NOT NULL DEFAULT 'A';

ALTER TABLE `jadwal_slot`
    DROP INDEX `jadwal_slot_tanggal_jam_key`,
    ADD UNIQUE INDEX `jadwal_slot_kategori_tanggal_jam_key`(`kategori`, `tanggal`, `jam`);
