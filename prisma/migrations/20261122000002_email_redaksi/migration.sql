-- Samakan persis redaksi email dengan perintah: "Selamat anda sudah terdaftar silahkan login disini".
-- Hanya memperbarui nilai bawaan yang belum diubah admin.

UPDATE `pengaturan`
SET `value` = 'Selamat anda sudah terdaftar silahkan login disini'
WHERE `key` = 'email_subject'
  AND `value` = 'Selamat! Anda sudah terdaftar — silakan login di sini';

UPDATE `pengaturan`
SET `value` = 'Selamat anda sudah terdaftar silahkan login disini. Selesaikan pembayaran aktivasi akun terlebih dahulu sebelum masuk ke Ruang Member Bisnis di Korea.'
WHERE `key` = 'email_message'
  AND `value` = 'Selamat, anda sudah terdaftar. Silahkan login disini untuk melanjutkan ke halaman peserta. Selesaikan pembayaran aktivasi akun terlebih dahulu sebelum masuk ke ruang member.';

UPDATE `pengaturan`
SET `value` = 'Pembayaran aktivasi akun Anda dikonfirmasi'
WHERE `key` = 'email_pembayaran_subject'
  AND `value` = 'Pembayaran Konsultasi Online Anda Dikonfirmasi';

UPDATE `pengaturan`
SET `value` = 'Halo {nama}, pembayaran aktivasi akun sudah kami verifikasi. Terima kasih! Silakan login ke Ruang Member Bisnis di Korea untuk menonton video dan melanjutkan konsultasi lanjutan.'
WHERE `key` = 'email_pembayaran_message'
  AND `value` = 'Halo {nama}, pembayaran Rp49.000 untuk Konsultasi Online sudah kami verifikasi. Terima kasih! Silakan login ke halaman peserta untuk melihat detail konsultasi Anda.';
