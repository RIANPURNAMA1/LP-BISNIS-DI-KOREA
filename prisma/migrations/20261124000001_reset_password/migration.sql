-- Token reset password lewat email (admin, affiliate, peserta).
-- Hanya hash SHA-256 token yang disimpan; token asli hanya ada di email.
CREATE TABLE `password_reset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipe` VARCHAR(20) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_token_hash_key`(`token_hash`),
    INDEX `password_reset_tipe_user_id_idx`(`tipe`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
