-- CreateTable
CREATE TABLE `pendaftaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(255) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `provinsi` VARCHAR(100) NOT NULL,
    `kabupaten` VARCHAR(100) NOT NULL,
    `kecamatan` VARCHAR(100) NOT NULL,
    `desa` VARCHAR(100) NOT NULL,
    `alamat` TEXT NULL,
    `status` VARCHAR(100) NOT NULL,
    `ide` VARCHAR(100) NOT NULL,
    `cerita` TEXT NULL,
    `pendapatan` VARCHAR(50) NULL,
    `tujuan` JSON NOT NULL,
    `sumber` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
