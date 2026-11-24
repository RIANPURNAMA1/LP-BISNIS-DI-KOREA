-- Domisili affiliate (provinsi, kabupaten/kota, kecamatan, desa/kelurahan).
ALTER TABLE `affiliate`
    ADD COLUMN `provinsi` VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN `kabupaten` VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN `kecamatan` VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN `desa` VARCHAR(100) NOT NULL DEFAULT '';
