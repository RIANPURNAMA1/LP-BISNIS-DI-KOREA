-- Kupon aktivasi akun (kuota diatur admin) dan riwayat pemakaiannya.
CREATE TABLE `kupon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(40) NOT NULL,
    `kuota` INTEGER NOT NULL,
    `terpakai` INTEGER NOT NULL DEFAULT 0,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `berlaku_sampai` DATETIME(3) NULL,
    `catatan` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kupon_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `pemakaian_kupon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kupon_id` INTEGER NOT NULL,
    `pendaftaran_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pemakaian_kupon_pendaftaran_id_key`(`pendaftaran_id`),
    INDEX `pemakaian_kupon_kupon_id_idx`(`kupon_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pemakaian_kupon` ADD CONSTRAINT `pemakaian_kupon_kupon_id_fkey`
    FOREIGN KEY (`kupon_id`) REFERENCES `kupon`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pemakaian_kupon` ADD CONSTRAINT `pemakaian_kupon_pendaftaran_id_fkey`
    FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
