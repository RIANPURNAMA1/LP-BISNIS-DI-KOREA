# Perintah Prisma

## Setup awal

```bash
npm install
npx prisma generate
```

## Database

```bash
# Buat/terapkan migrasi (development)
npx prisma migrate dev --name init

# Terapkan migrasi (production)
npx prisma migrate deploy

# Reset database (HAPUS semua data)
npx prisma migrate reset

# Push schema tanpa migrasi
npx prisma db push

# Pull schema dari database
npx prisma db pull
```

## Seed data

```bash
npx prisma db seed
```

## Studio (GUI)

```bash
npx prisma studio
```

## Generate client

```bash
npx prisma generate
```

## Validasi & format

```bash
npx prisma validate
npx prisma format
```

## Environment

Pastikan `DATABASE_URL` di `.env` / `.env.local`:

```
DATABASE_URL="mysql://root:@localhost:3306/bisnis_korea"
```
