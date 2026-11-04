# Deployment (Tanpa Docker)

## 1. Prasyarat Server
- Node.js 20+
- MySQL 8+
- PM2 (opsional, untuk process manager)
- Nginx (opsional, reverse proxy)

## 2. Clone & Install
```bash
git clone <repo-url>
cd "BISNIS DI KOREA"
npm ci
```

## 3. Environment
Buat `.env` (dan `.env.local` jika perlu):
```
DATABASE_URL="mysql://user:password@localhost:3306/bisnis_korea"
NEXTAUTH_SECRET="<random-32-bytes-base64>"
NEXTAUTH_URL="https://domain-anda.com"
```
Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4. Database
```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## 5. Build
```bash
npm run build
```

## 6. Jalankan
### Langsung
```bash
npm run start
```
### Dengan PM2
```bash
pm2 start npm --name bisnis-korea -- start
pm2 save
pm2 startup
```

## 7. Nginx (opsional)
```nginx
server {
  listen 80;
  server_name domain-anda.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Aktifkan:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Update / Redeploy
```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart bisnis-korea
```

## 9. Catatan
- Pastikan port 3000 tidak bentrok.
- Backup database secara berkala.
- Gunakan HTTPS (Let's Encrypt) untuk production.

## 10. SEO & Google Search Console
Tambahkan ke `.env` (production):
```
NEXT_PUBLIC_SITE_URL="https://domain-anda.com"
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="kode-verifikasi-google"
```
- `NEXT_PUBLIC_SITE_URL` dipakai untuk canonical, Open Graph, sitemap, dan robots.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` opsional, isi dengan token meta dari Search Console.
- `/admin` dan `/api` otomatis diberi header `X-Robots-Tag: noindex, nofollow`.

Setelah deploy:
1. Buka `https://domain-anda.com/robots.txt` dan `https://domain-anda.com/sitemap.xml`, pastikan domain sudah benar.
2. Tambahkan website sebagai property di [Google Search Console](https://search.google.com/search-console).
3. Verifikasi kepemilikan (meta tag / DNS / file HTML).
4. Buka menu **Sitemaps**, submit `sitemap.xml`.
5. Gunakan **URL Inspection** untuk meminta indexing halaman `/` dan `/daftar`.
6. Pastikan website sudah HTTPS dan dapat diakses tanpa login.
