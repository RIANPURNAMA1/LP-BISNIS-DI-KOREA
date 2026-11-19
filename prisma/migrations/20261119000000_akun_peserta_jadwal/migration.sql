-- AlterTable
ALTER TABLE `pendaftaran` ADD COLUMN `password` VARCHAR(255) NULL,
    ADD COLUMN `last_login_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `jadwal_sesi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pendaftaran_id` INTEGER NOT NULL,
    `tanggal` VARCHAR(10) NOT NULL,
    `jam` VARCHAR(5) NOT NULL,
    `catatan` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    `slot_key` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jadwal_sesi_slot_key_key`(`slot_key`),
    INDEX `jadwal_sesi_pendaftaran_id_idx`(`pendaftaran_id`),
    INDEX `jadwal_sesi_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jadwal_sesi` ADD CONSTRAINT `jadwal_sesi_pendaftaran_id_fkey` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
