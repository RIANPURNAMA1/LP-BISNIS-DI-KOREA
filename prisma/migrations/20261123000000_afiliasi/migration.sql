-- Fitur afiliasi mandiri: pendaftar affiliate terpisah dari peserta,
-- atribusi referral 1 level, komisi saat pembayaran terverifikasi,
-- dan pencairan manual oleh admin dengan bukti transfer.

-- CreateTable: akun affiliate
CREATE TABLE `affiliate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `kode` VARCHAR(30) NOT NULL,
    `bank_nama` VARCHAR(100) NOT NULL DEFAULT '',
    `bank_no` VARCHAR(100) NOT NULL DEFAULT '',
    `bank_atas_nama` VARCHAR(150) NOT NULL DEFAULT '',
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `affiliate_email_key`(`email`),
    UNIQUE INDEX `affiliate_kode_key`(`kode`),
    INDEX `affiliate_aktif_idx`(`aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: atribusi referral (satu pendaftaran hanya satu affiliate)
CREATE TABLE `referral` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `pendaftaran_id` INTEGER NOT NULL,
    `pembayaran_id` INTEGER NULL,
    `kode` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'terdaftar',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `referral_pendaftaran_id_key`(`pendaftaran_id`),
    UNIQUE INDEX `referral_pembayaran_id_key`(`pembayaran_id`),
    INDEX `referral_affiliate_id_idx`(`affiliate_id`),
    INDEX `referral_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: pengajuan pencairan
CREATE TABLE `payout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `bank_nama` VARCHAR(100) NOT NULL,
    `bank_no` VARCHAR(100) NOT NULL,
    `bank_atas_nama` VARCHAR(150) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'menunggu',
    `bukti` VARCHAR(500) NULL,
    `catatan_admin` TEXT NULL,
    `diproses_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payout_affiliate_id_idx`(`affiliate_id`),
    INDEX `payout_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: jurnal komisi
CREATE TABLE `komisi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `referral_id` INTEGER NOT NULL,
    `pembayaran_id` INTEGER NOT NULL,
    `payout_id` INTEGER NULL,
    `jumlah` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'tersedia',
    `keterangan` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `komisi_pembayaran_id_key`(`pembayaran_id`),
    INDEX `komisi_affiliate_id_status_idx`(`affiliate_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `referral` ADD CONSTRAINT `referral_affiliate_id_fkey`
    FOREIGN KEY (`affiliate_id`) REFERENCES `affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `referral` ADD CONSTRAINT `referral_pendaftaran_id_fkey`
    FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `referral` ADD CONSTRAINT `referral_pembayaran_id_fkey`
    FOREIGN KEY (`pembayaran_id`) REFERENCES `pembayaran_konsultasi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `komisi` ADD CONSTRAINT `komisi_affiliate_id_fkey`
    FOREIGN KEY (`affiliate_id`) REFERENCES `affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `komisi` ADD CONSTRAINT `komisi_referral_id_fkey`
    FOREIGN KEY (`referral_id`) REFERENCES `referral`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `komisi` ADD CONSTRAINT `komisi_pembayaran_id_fkey`
    FOREIGN KEY (`pembayaran_id`) REFERENCES `pembayaran_konsultasi`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `komisi` ADD CONSTRAINT `komisi_payout_id_fkey`
    FOREIGN KEY (`payout_id`) REFERENCES `payout`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payout` ADD CONSTRAINT `payout_affiliate_id_fkey`
    FOREIGN KEY (`affiliate_id`) REFERENCES `affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Konfigurasi awal: nominal komisi per referral terverifikasi dan minimal pencairan.
-- Admin dapat mengubah keduanya di halaman Pengaturan.
INSERT INTO `pengaturan` (`key`, `value`, `updated_at`)
VALUES ('afiliasi_komisi', '10000', CURRENT_TIMESTAMP(3)),
       ('afiliasi_minimal_pencairan', '50000', CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `key` = `key`;
