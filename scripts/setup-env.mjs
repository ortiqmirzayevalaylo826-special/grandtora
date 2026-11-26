// .env fayllarini .example dan yaratadi va maxfiy kalitlarni tasodifiy to'ldiradi. Mavjud fayllarga TEGMAYDI.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const secret = () => randomBytes(48).toString('base64url');
const strong = () => `Gt-${randomBytes(6).toString('hex')}-${randomBytes(3).toString('hex').toUpperCase()}!`;

function make(from, to, fill) {
  if (existsSync(to)) return console.log(`• ${to} allaqachon bor — tegilmadi`);
  copyFileSync(from, to);
  if (fill) writeFileSync(to, fill(readFileSync(to, 'utf8')));
  console.log(`✓ ${to} yaratildi`);
}

let adminPass = '';
make('backend/.env.example', 'backend/.env', (s) => {
  adminPass = strong();
  return s
    .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET="${secret()}"`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET="${secret()}"`)
    .replace(/^OTP_PEPPER=.*$/m, `OTP_PEPPER="${secret()}"`)
    .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD="${adminPass}"`);
});
make('frontend/.env.example', 'frontend/.env.local');
if (adminPass) console.log(`\nAdmin kirishi:  admin@grantora.local  /  ${adminPass}\n(backend/.env faylida ADMIN_EMAIL va ADMIN_PASSWORD ni o'zgartirishingiz mumkin)`);
