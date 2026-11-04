Login ke VPS
ssh root@IP_SERVER


Perbarui package server:
apt update && apt upgrade -y
apt install -y curl git nginx mysql-server


Periksa versi Ubuntu:
lsb_release -a


3. Instalasi Node.js dan PM2
Gunakan Node.js 20 atau versi LTS yang kompatibel dengan project.
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v
npm -v


Instal PM2:
npm install -g pm2
pm2 -v


4. Clone project dan instalasi dependency
Gunakan direktori khusus untuk aplikasi:
mkdir -p /var/www/bisnis-korea
cd /var/www/bisnis-korea


Clone repository:
git clone <REPO_URL> .


Jika repository private, autentikasi GitHub terlebih dahulu menggunakan SSH key atau metode autentikasi yang aman.

Instal dependency:
npm ci


Pastikan package.json memiliki script berikut:
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}


Sesuaikan script dengan konfigurasi project yang sebenarnya.
5. Konfigurasi environment
Buat file .env di root project:
nano .env


Isi dengan konfigurasi production:
DATABASE_URL="mysql://bisnis_user:PASSWORD_DATABASE@127.0.0.1:3306/bisnis_korea"

NEXTAUTH_SECRET="GENERATED_SECRET"
NEXTAUTH_URL="https://bisnisdikorea.com"

NEXT_PUBLIC_SITE_URL="https://bisnisdikorea.com"
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=""


Generate secret:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"


Lindungi file environment:
chmod 600 .env


Penting: Ganti password database dan secret dengan nilai yang kuat. Jangan commit .env ke GitHub.
6. Setup database MySQL
Masuk ke MySQL:
sudo mysql


Buat database dan user:
CREATE DATABASE bisnis_korea
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'bisnis_user'@'localhost'
IDENTIFIED BY 'PASSWORD_DATABASE';

GRANT ALL PRIVILEGES ON bisnis_korea.*
TO 'bisnis_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;


Pastikan DATABASE_URL menggunakan username, password, dan nama database yang sesuai.
Migrasi Prisma
Di direktori project:
npx prisma generate
npx prisma migrate deploy


Jika project memiliki seed script:
npx prisma db seed


Jalankan seed hanya jika diperlukan. Hindari menjalankannya berulang kali jika proses seed tidak idempotent.

Verifikasi koneksi database:
npx prisma db pull


Jangan menjalankan db pull jika project menggunakan schema Prisma sebagai sumber utama dan database sudah memiliki struktur production yang benar.
7. Build aplikasi Next.js
npm run build


Jika build berhasil, jalankan aplikasi pada port 3002:
PORT=3002 npm run start


Buka terminal kedua dan uji:
curl -I http://127.0.0.1:3002


Jika mendapatkan respons HTTP, hentikan proses foreground dengan Ctrl+C sebelum menjalankan PM2.
8. Menjalankan aplikasi dengan PM2
Buat file konfigurasi:
nano ecosystem.config.js


Isi:
module.exports = {
  apps: [
    {
      name: "bisnis-korea",
      cwd: "/var/www/bisnis-korea",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      time: true
    }
  ]
};


Jalankan aplikasi:
pm2 start ecosystem.config.js
pm2 save
pm2 startup


Jalankan perintah tambahan yang diberikan oleh pm2 startup agar PM2 otomatis aktif setelah reboot.

Periksa status:
pm2 status
pm2 logs bisnis-korea


9. Konfigurasi Nginx
Buat virtual host:
nano /etc/nginx/sites-available/bisnisdikorea.com


Konfigurasi HTTP:
server {
    listen 80;
    listen [::]:80;

    server_name bisnisdikorea.com www.bisnisdikorea.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}


Aktifkan konfigurasi:
ln -s /etc/nginx/sites-available/bisnisdikorea.com \
/etc/nginx/sites-enabled/bisnisdikorea.com


Uji dan reload:
nginx -t
systemctl reload nginx


10. Aktivasi HTTPS
Instal Certbot:
apt install -y certbot python3-certbot-nginx


Terbitkan sertifikat SSL:
certbot --nginx \
  -d bisnisdikorea.com \
  -d www.bisnisdikorea.com


Pilih redirect HTTP ke HTTPS jika diminta.

Periksa sertifikat:
certbot certificates


Uji pembaruan otomatis:
certbot renew --dry-run


Setelah selesai, website dapat diakses melalui:
- https://bisnisdikorea.com
- https://www.bisnisdikorea.com
11. Konfigurasi firewall
Pastikan port publik yang dibutuhkan terbuka:
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw status


Jangan membuka port 3002 atau 3306 ke publik. Next.js hanya perlu diakses melalui Nginx, dan MySQL cukup menerima koneksi lokal.
12. Update dan redeployment
Setiap kali ada perubahan kode di repository:
cd /var/www/bisnis-korea

git pull
npm ci

npx prisma generate
npx prisma migrate deploy

npm run build
pm2 restart bisnis-korea


Periksa status:
pm2 status
pm2 logs bisnis-korea --lines 100


Jika build gagal, jangan restart aplikasi production sebelum memastikan build berhasil.
13. Backup database
Buat backup manual:
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  bisnis_korea \
  > /root/bisnis_korea_backup.sql


Untuk backup terkompresi:
mysqldump --single-transaction bisnis_korea \
  | gzip > /root/bisnis_korea_backup_$(date +%F).sql.gz


Simpan salinan backup di luar VPS secara berkala dan uji proses restore sebelum mengandalkan backup untuk pemulihan production.
14. SEO dan Google Search Console
Pastikan environment production berisi:
NEXT_PUBLIC_SITE_URL="https://bisnisdikorea.com"
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="TOKEN_VERIFIKASI"


Setelah deployment, periksa:
- https://bisnisdikorea.com/robots.txt
- https://bisnisdikorea.com/sitemap.xml
- Canonical URL menggunakan domain HTTPS yang benar.
- Halaman publik dapat diakses tanpa login.
- Halaman /admin dan /api tidak diindeks mesin pencari.
Di Google Search Console:
1. Tambahkan property https://bisnisdikorea.com atau property Domain.
2. Verifikasi kepemilikan melalui DNS atau metode lain yang tersedia.
3. Submit sitemap.xml.
4. Gunakan URL Inspection untuk memeriksa halaman utama dan /daftar.
5. Minta indexing untuk halaman publik yang penting.
15. Troubleshooting
Masalah	Pemeriksaan / solusi
Website 502 Bad Gateway	pm2 status, pm2 logs bisnis-korea, cek port 3002
Port sudah digunakan	ss -lntp \| grep 3002
Prisma gagal koneksi	Periksa DATABASE_URL, kredensial, dan status MySQL
Build gagal	npm ci, periksa environment dan error build
Domain tidak bisa diakses	Periksa DNS, firewall, dan konfigurasi Nginx
SSL gagal	Pastikan DNS mengarah ke VPS dan port 80 terbuka
PM2 tidak aktif setelah reboot	Jalankan ulang pm2 startup, kemudian pm2 save

<!-- backup -->

bisnisdikorea.com
A
185.249.224.250
Proxied
Auto
—
—
—

bisnisdikorea.com
AAAA
2a02:4780:4a:b7ed:5f22:2e66:e0cd:e6ca
Proxied
Auto
—
—
—

bisnisdikorea.com
AAAA
2a02:4780:4b:469e:6e76:d84f:9025:5538
Proxied
Auto
—
—
—

www.bisnisdikorea.com
CNAME
www.bisnisdikorea.com.cdn.hstgr.net
Proxied
Auto
—
—
—
Showing 1-5 of 5

## 11. Troubleshooting VPS

### `/api/pendaftaran/stats` 500
Penyebab umum: route statistik ikut di-*render* statis saat `npm run build`, lalu
respons 500 dari proses build tersimpan di `.next` dan terus disajikan oleh
`npm start`. Route ini sekarang dipaksa dinamis (`force-dynamic`) dan wajib login,
jadi query dijalankan ulang setiap request.

Jika masih 500 setelah update:
```bash
cd "BISNIS DI KOREA"
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
rm -rf .next
npm run build
pm2 restart bisnis-korea --update-env
pm2 logs bisnis-korea --lines 100
```

Pastikan:
- `DATABASE_URL` bisa diakses dari VPS (`mysql -u user -p -h host db`).
- `.env` berada di root project dan sudah dimuat saat `npm run build`.
- Database sudah dimigrasi dan admin sudah di-seed.
- Setelah mengubah `.env`, jalankan `pm2 restart bisnis-korea --update-env`.

### `/admin` tidak bisa dibuka / redirect terus
- Pastikan `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, dan `AUTH_URL` sudah diisi domain
  production (`https://bisnisdikorea.com`), bukan `localhost`.
- Hapus cookie lama di browser, lalu login ulang di `/admin/login`.
- Cek `pm2 logs bisnis-korea` jika login gagal.
