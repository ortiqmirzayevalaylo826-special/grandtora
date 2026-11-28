'use client';
import { useQuery } from '@/lib/client';
import { Badge, useL } from './admin/kit';

interface Chk { id: string; ok: boolean; value: string | null }

/** Admin: ishga tushirishga tayyorlik ro'yxati — nima sozlanmagan va qanday tuzatiladi. */
export default function Readiness() {
  const L = useL();
  const { data, error } = useQuery<{ checks: Chk[]; students: number }>('/admin/panel/readiness');
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-muted">…</p>;
  const info: Record<string, { t: string; fix: string }> = {
    mail: { t: L('Email yuborish (kirish kodi, ro‘yxatdan o‘tish)', 'Отправка email (коды входа, регистрация)', 'Email sending (login codes, sign-up)'), fix: L("Render → grantora-api → Environment: MAIL_PROVIDER=brevo va BREVO_API_KEY (yoki gmail + EMAIL_RELAY_URL/TOKEN). Keyin «Til va ilova» bo'limida test xat yuboring.", 'Render → grantora-api → Environment: MAIL_PROVIDER=brevo и BREVO_API_KEY (или gmail + EMAIL_RELAY_URL/TOKEN). Затем отправьте тестовое письмо.', 'Render → grantora-api → Environment: MAIL_PROVIDER=brevo and BREVO_API_KEY (or gmail + EMAIL_RELAY_URL/TOKEN). Then send a test email.') },
    storage: { t: L('Hujjatlar ombori', 'Хранилище документов', 'Document storage'), fix: L("Lokal disk deploy'da o'chadi. SUPABASE_URL va SUPABASE_SERVICE_KEY bering yoki UPLOAD_DIR ni olib tashlang (baza ishlatiladi).", 'Локальный диск стирается при деплое. Укажите SUPABASE_URL и SUPABASE_SERVICE_KEY или уберите UPLOAD_DIR (будет база).', 'Local disk is wiped on deploy. Set SUPABASE_URL and SUPABASE_SERVICE_KEY or remove UPLOAD_DIR (database is used).') },
    secrets: { t: L('Maxfiy kalitlar (JWT, OTP)', 'Секретные ключи (JWT, OTP)', 'Secret keys (JWT, OTP)'), fix: L("JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (24+ belgi) va OTP_PEPPER (16+) ni Render'da uzun tasodifiy qiymat bilan to'ldiring.", 'Заполните JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (24+ символов) и OTP_PEPPER (16+) длинными случайными значениями.', 'Set JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (24+ chars) and OTP_PEPPER (16+) to long random values.') },
    cookie: { t: L('Xavfsiz cookie (HTTPS)', 'Безопасные cookie (HTTPS)', 'Secure cookies (HTTPS)'), fix: 'COOKIE_SECURE=true' },
    origin: { t: L('Sayt manzili (WEB_ORIGIN)', 'Адрес сайта (WEB_ORIGIN)', 'Site origin (WEB_ORIGIN)'), fix: L("WEB_ORIGIN = saytingiz manzili, masalan https://grantora-web.onrender.com", 'WEB_ORIGIN = адрес вашего сайта, например https://grantora-web.onrender.com', 'WEB_ORIGIN = your site URL, e.g. https://grantora-web.onrender.com') },
    demo: { t: L('Demo akkauntlar o‘chirilgan', 'Демо-аккаунты отключены', 'Demo accounts removed'), fix: L("Ishga tushirishdan oldin SEED_DEMO_USERS=false qiling va «Foydalanuvchilar» bo'limidan @grantora.demo akkauntlarni o'chiring.", 'Перед запуском: SEED_DEMO_USERS=false и удалите аккаунты @grantora.demo в «Пользователях».', 'Before launch: SEED_DEMO_USERS=false and delete @grantora.demo accounts in Users.') },
    catalog: { t: L("Katalog hajmi (e'lon qilingan / jami, kamida 15)", 'Объём каталога (опубликовано / всего, минимум 15)', 'Catalog size (published / total, min 15)'), fix: L("Grantlar bo'limida haqiqiy stipendiyalarni qo'shing va «Dolzarblik» orqali tekshirib turing.", 'Добавьте реальные стипендии и проверяйте их в «Актуальности».', 'Add real scholarships and keep them verified under Freshness.') },
  };
  const bad = data.checks.filter((c) => !c.ok).length;
  return (
    <div className="space-y-3 text-sm">
      <p className={`rounded-xl p-3 font-semibold ${bad ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
        {bad ? L(`${bad} ta band e'tibor talab qiladi`, `Требуют внимания: ${bad}`, `${bad} item(s) need attention`) : L('Hammasi tayyor', 'Всё готово', 'All set')}
      </p>
      <ul className="divide-y divide-navy/10">
        {data.checks.map((c) => (
          <li key={c.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              {c.ok ? <Badge tone="green">OK</Badge> : <Badge tone="red">{L('Tuzatish kerak', 'Исправить', 'Fix')}</Badge>}
              <b className="text-navy">{info[c.id]?.t ?? c.id}</b>
              {c.value && <span className="text-xs text-muted">({c.value})</span>}
            </div>
            {!c.ok && <p className="mt-1 text-muted">{info[c.id]?.fix}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
