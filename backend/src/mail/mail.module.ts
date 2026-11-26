import { Global, Injectable, Logger, Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const T: Record<string, { otp: (c: string) => [string, string]; reminder: (t: string, n: number) => [string, string] }> = {
  uz: {
    otp: (c) => ['Grantora: tasdiqlash kodi', `Grantora\n\nSizning kodingiz: ${c}\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang.`],
    reminder: (t, n) => [`Grantora: muddat yaqinlashmoqda — ${t}`, `Grantora\n\n"${t}" arizasi muddati ${n} kundan keyin tugaydi.`],
  },
  ru: {
    otp: (c) => ['Grantora: код подтверждения', `Grantora\n\nВаш код: ${c}\nКод действует 5 минут. Никому его не сообщайте.`],
    reminder: (t, n) => [`Grantora: срок приближается — ${t}`, `Grantora\n\nПриём заявок на «${t}» заканчивается через ${n} дн.`],
  },
  en: {
    otp: (c) => ['Grantora: your verification code', `Grantora\n\nYour code: ${c}\nIt is valid for 5 minutes. Never share it with anyone.`],
    reminder: (t, n) => [`Grantora: deadline approaching — ${t}`, `Grantora\n\nApplications for "${t}" close in ${n} day(s).`],
  },
};

/**
 * Pochta yuborish. MAIL_PROVIDER:
 *  - "smtp"  : oddiy SMTP (lokal: Mailpit; Gmail App Password; pullik hosting). DIQQAT: Render BEPUL rejasi
 *              25/465/587 portlarni bloklaydi, shuning uchun u yerda SMTP ishlamaydi.
 *  - "gmail" : Gmail ko'prigi (Google Apps Script web app, backend/scripts/gmail_relay.gs). HTTPS orqali, bepul, Render bepul rejasida
 *              ishlaydi. EMAIL_RELAY_URL va EMAIL_RELAY_TOKEN kerak. Xat sizning Gmail akkauntingizdan ketadi (kuniga ~100 ta).
 *  - "brevo" : Brevo HTTP API (HTTPS 443 orqali) — Render bepul rejasida ishlaydi. SMTP login/parol emas, API kalit kerak.
 */
@Injectable()
export class MailService {
  private log = new Logger('Mail');
  private provider = (process.env.MAIL_PROVIDER ?? 'smtp').toLowerCase();
  private from = process.env.MAIL_FROM ?? 'Grantora <no-reply@grantora.local>';

  private tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: Number(process.env.SMTP_PORT) === 465,          // 465: SSL; 587: STARTTLS
    requireTLS: Number(process.env.SMTP_PORT) === 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });

  private parseFrom() {
    const m = this.from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    return m ? { name: m[1].trim() || 'Grantora', email: m[2].trim() } : { name: 'Grantora', email: this.from.trim() };
  }

  private async send(to: string, subject: string, text: string) {
    try {
      if (this.provider === 'gmail') {
        const url = process.env.EMAIL_RELAY_URL;
        if (!url) return this.log.error('EMAIL_RELAY_URL sozlanmagan');
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'text/plain;charset=utf-8' }, // Apps Script uchun oddiy so'rov (preflight yo'q)
          body: JSON.stringify({ token: process.env.EMAIL_RELAY_TOKEN ?? '', to, subject, body: text, name: this.parseFrom().name }),
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        });
        const j = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!res.ok || !j?.ok) this.log.error(`Gmail ko'prigi xato ${res.status}: ${j?.error ?? 'javob yo\'q'}`);
        return;
      }
      if (this.provider === 'brevo') {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': process.env.BREVO_API_KEY ?? '', 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ sender: this.parseFrom(), to: [{ email: to }], subject, textContent: text }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) this.log.error(`Brevo xato ${res.status}: ${(await res.text()).slice(0, 200)}`);
        return;
      }
      await this.tx.sendMail({ from: this.from, to, subject, text });
    } catch (e) {
      // Kod/parol logga yozilmaydi — faqat xato turi
      this.log.error(`Email yuborilmadi (${this.provider}): ${(e as Error).message}`);
    }
  }
  sendOtp(to: string, code: string, locale = 'uz') {
    const [s, b] = (T[locale] ?? T.uz).otp(code);
    return this.send(to, s, b);
  }
  sendReminder(to: string, title: string, days: number, locale = 'uz') {
    const [s, b] = (T[locale] ?? T.uz).reminder(title, days);
    return this.send(to, s, b);
  }
}

@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
