-- AlterTable
ALTER TABLE `pendaftaran` ADD COLUMN `wilayah` VARCHAR(30) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `pengaturan` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
