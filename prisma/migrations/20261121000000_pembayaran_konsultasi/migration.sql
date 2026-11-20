-- CreateTable
CREATE TABLE `pembayaran_konsultasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pendaftaran_id` INTEGER NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `metode` VARCHAR(20) NOT NULL,
    `nama_channel` VARCHAR(100) NOT NULL,
    `nama_pengirim` VARCHAR(255) NOT NULL,
    `bukti_bayar` VARCHAR(500) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 49000,
    `status` VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    `catatan_admin` TEXT NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pembayaran_konsultasi_pendaftaran_id_idx`(`pendaftaran_id`),
    INDEX `pembayaran_konsultasi_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pembayaran_konsultasi` ADD CONSTRAINT `pembayaran_konsultasi_pendaftaran_id_fkey` FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
