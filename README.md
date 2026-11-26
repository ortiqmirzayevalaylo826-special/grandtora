# Grantora — xalqaro stipendiya va grantlar platformasi

Talabalar uchun dunyo bo'ylab grant/stipendiyalar katalogi, shaxsiy kabinet va admin panel. 3 til (uz, ru, en), PWA (ilova sifatida o'rnatiladi).

> **Holat:** kod yozilgan, lekin hali bir marta ham ishga tushirib sinalmagan. Birinchi lokal ishga tushirishda kichik xatolar chiqishi mumkin — ularni birga tuzatamiz.

## Tuzilma
| Papka | Vazifa |
|---|---|
| `backend` | **Backend** — NestJS + Prisma + PostgreSQL (auth, RBAC, grantlar, kabinet, admin, eslatmalar, hujjatlar) |
| `frontend` | **Frontend** — Next.js 15 + TypeScript + Tailwind + next-intl (sayt, kabinet `/app`, admin `/admin`) |
| `docker-compose.yml` | Lokal PostgreSQL, Redis, Mailpit (test pochta) |
| `render.yaml` | Render uchun avtomatik joylash sozlamasi |

## Lokal ishga tushirish (Windows)
Kerak: Node.js 20+, Docker Desktop, Git.

```powershell
cd D:\Projects\stipendiya\grantora
npm install
npm run setup             # .env fayllarini yaratadi, maxfiy kalitlarni to'ldiradi, admin parolini ko'rsatadi
npm run infra:up          # PostgreSQL + Mailpit ishga tushadi
npm run db:push           # jadvallarni yaratadi
npm run db:seed           # davlatlar, kategoriyalar, namunaviy grantlar, admin
npm run backend           # 1-terminal: API  http://localhost:4000/api/health
npm run frontend          # 2-terminal: sayt http://localhost:3000
```
- `npm run setup` `backend/.env` va `frontend/.env.local` ni yaratadi (mavjudiga tegmaydi). Admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`backend/.env`).
- Ro'yxatdan o'tishda kelgan 6 xonali kodni **Mailpit** da ko'rasiz: http://localhost:8025
- Talaba hisobi — saytdagi «Ro'yxatdan o'tish» orqali; admin — `/login` da admin email bilan kiring (`/admin` ochiladi).

## Xavfsizlik qoidalari
Parollar bcrypt(12); JWT httpOnly cookie + aylanuvchi refresh token; OTP hash bilan, 5 daqiqa, 5 urinish; 5 xato kirishdan keyin 15 daqiqa blok; admin yo'llari backendda `RolesGuard` bilan himoyalangan; fayllar maxfiy omborda, faqat egasi yuklab oladi; CSV eksportda formula-injeksiya himoyasi.

## Deploy: GitHub → Supabase (baza) → Render (sayt + API)

### 1. Supabase (PostgreSQL)
1. supabase.com → New organization (Free) → **New project** (region: Frankfurt yoki Mumbai/Singapore — foydalanuvchilarga yaqin), Database Password o'ylab toping va saqlab qo'ying.
2. Project → **Connect** tugmasi → ikki qator oling:
   - **Transaction pooler** (port 6543) → `DATABASE_URL` (oxiriga `?pgbouncer=true` qo'shing)
   - **Session pooler** (port 5432) → `DIRECT_URL`
   (Render IPv4, Supabase "Direct connection" esa IPv6 — shuning uchun faqat pooler ishlatiladi.)

### 2. Render
1. dashboard.render.com → **New → Blueprint** → GitHub repo `grandtora` ni tanlang (`render.yaml` avtomatik o'qiladi).
2. `grantora-api` env: `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGIN` (web manzili), `MAIL_FROM`, `BREVO_API_KEY`.
3. `grantora-web` env: `API_URL` (api manzili), `NEXT_PUBLIC_SITE_URL` (web manzili).
4. Birinchi deploydan keyin jadvalar `prisma db push` bilan yaratiladi. Admin va namunaviy ma'lumotlar uchun bir marta lokal kompyuterdan (`.env` da Supabase `DIRECT_URL` bilan): `npm run db:seed`.

### 3. Email (OTP kodlari)
- Lokal: `MAIL_PROVIDER=smtp` + Mailpit (http://localhost:8025).
- **Render bepul rejasi SMTP portlarini (25/465/587) bloklaydi** — Gmail SMTP u yerda ishlamaydi. Variantlar:
  - bepul: `MAIL_PROVIDER=brevo` (HTTPS API; brevo.com'da ro'yxatdan o'ting, Sender tasdiqlang, API key yarating);
  - yoki Render pullik reja ($7/oy) + `MAIL_PROVIDER=smtp`, Gmail uchun App Password (2 bosqichli tasdiqlash yoqilgan bo'lishi kerak), `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.

### 4. Ilova sifatida o'rnatish (PWA)
HTTPS saytda (Render beradi) Chrome/Edge: manzil satrida «O'rnatish» yoki sayt sarlavhasidagi «Ilovani o'rnatish» tugmasi. iPhone: Safari → Ulashish → Bosh ekranga qo'shish.

> Bepul Render xizmati 15 daqiqa harakatsizlikdan keyin uxlaydi — birinchi ochilish ~30-60 s.
> `.env` va parollarni HECH QACHON GitHub'ga yuklamang (`.gitignore` da bor).
