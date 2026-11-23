-- Alur konsultasi lanjutan: konfirmasi posisi peserta, jadwal fix dari admin
-- dengan kuota 5 per slot, dan waitinglist saat slot penuh.

-- AlterTable
ALTER TABLE `pendaftaran`
    ADD COLUMN `posisi_konsultasi` VARCHAR(10) NULL,
    ADD COLUMN `posisi_dijawab_at` DATETIME(3) NULL,
    ADD COLUMN `ijazah_s1` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: slot jadwal yang ditetapkan admin
CREATE TABLE `jadwal_slot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tanggal` VARCHAR(10) NOT NULL,
    `jam` VARCHAR(5) NOT NULL,
    `kuota` INTEGER NOT NULL DEFAULT 5,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jadwal_slot_tanggal_jam_key`(`tanggal`, `jam`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: waitinglist
CREATE TABLE `waitinglist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pendaftaran_id` INTEGER NOT NULL,
    `posisi` VARCHAR(10) NULL,
    `catatan` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `waitinglist_pendaftaran_id_key`(`pendaftaran_id`),
    INDEX `waitinglist_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `waitinglist` ADD CONSTRAINT `waitinglist_pendaftaran_id_fkey`
    FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Slot lama memakai format "tanggal_jam". Sekarang tiap peserta mendapat kursi
-- "tanggal_jam_1" ... "tanggal_jam_5" agar 5 orang bisa berbagi satu slot.
UPDATE `jadwal_sesi`
SET `slot_key` = CONCAT(`slot_key`, '_1')
WHERE `slot_key` IS NOT NULL AND `slot_key` NOT REGEXP '_[0-9]+$';

-- Samakan teks email pendaftaran dengan redaksi yang diminta.
UPDATE `pengaturan`
SET `value` = 'Selamat! Anda sudah terdaftar — silakan login di sini'
WHERE `key` = 'email_subject'
  AND `value` = 'Selamat! Anda sudah terdaftar di Program Bisnis di Korea';

UPDATE `pengaturan`
SET `value` = 'Selamat, anda sudah terdaftar. Silahkan login disini untuk melanjutkan ke halaman peserta. Selesaikan pembayaran aktivasi akun terlebih dahulu sebelum masuk ke ruang member.'
WHERE `key` = 'email_message'
  AND `value` LIKE 'Selamat, pendaftaran Anda sudah kami terima%';
