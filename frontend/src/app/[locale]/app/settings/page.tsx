'use client';
import { useEffect, useState } from 'react';
import { api, useQuery } from '@/lib/client';
import { ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';
import LockSettings from '@/components/LockSettings';
import NotifSettings from '@/components/NotifSettings';
import { useL } from '@/components/admin/kit';
import SettingsHub from '@/components/SettingsHub';
import PwaClient from '@/components/PwaClient';
import LangSwitch from '@/components/LangSwitch';
import { AvatarUploader, DeleteAccount, ExportData, NameLangForm, PasswordForm, SessionsList, SettingsCard as Card } from '@/components/AccountParts';

export default function Settings() {
  const L = useL();
  const err = useErr();
  const { data, error, loading, reload } = useQuery<{ emailReminders: boolean; email: string }>('/me/settings');
  const [rem, setRem] = useState(true);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => { if (data) setRem(data.emailReminders); }, [data]);
  async function toggle(v: boolean) {
    setRem(v); setMsg(null);
    try { await api('/me/settings', { method: 'PATCH', body: { emailReminders: v } }); setMsg({ kind: 'ok', text: L('Saqlandi', 'Сохранено', 'Saved') }); } catch (x: any) { setRem(!v); setMsg({ kind: 'err', text: err(x.code) }); }
  }
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div className="space-y-5">
      <PageHead title={L('Sozlamalar', 'Настройки', 'Settings')} />
      <SettingsHub sections={[
    { id: 'account', icon: 'user', title: L('Hisob', 'Аккаунт', 'Account'), sub: L('Rasm, ism, til, ilova', 'Фото, имя, язык, приложение', 'Photo, name, language, app'), body: (
        <div className="space-y-5">
          <Card title={L('Profil rasmi', 'Фото профиля', 'Profile photo')}><AvatarUploader /></Card>
          <Card title={L("Shaxsiy ma'lumotlar", 'Личные данные', 'Personal details')}><NameLangForm /></Card>
          <Card title={L('Ilova', 'Приложение', 'App')} hint={L("Grantora'ni telefon yoki kompyuter bosh ekraniga o'rnating — tezroq ochiladi.", 'Установите Grantora на главный экран — так она открывается быстрее.', 'Install Grantora on your home screen for faster access.')}>
            <div className="flex flex-wrap gap-3"><LangSwitch full /><PwaClient /></div>
          </Card>
        </div>
    ) },
    { id: 'notify', icon: 'bell', title: L('Bildirishnomalar', 'Уведомления', 'Notifications'), sub: L('Ilova va email eslatmalar', 'Напоминания в приложении и email', 'App and email reminders'), body: (
        <div className="space-y-5">
        <Card title={L('Ilova bildirishnomalari', 'Уведомления приложения', 'App notifications')}><NotifSettings /></Card>
        <Card title={L('Email eslatmalar', 'Напоминания по email', 'Email reminders')} hint={data.email}>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={rem} onChange={(e) => toggle(e.target.checked)} />
            <span><b className="text-navy">{L('Muddat eslatmalari', 'Напоминания о сроках', 'Deadline reminders')}</b><br /><span className="text-muted">{L("Saqlangan va kuzatilayotgan grantlar muddatidan 7, 3 va 1 kun oldin emailga xabar keladi.", 'За 7, 3 и 1 день до срока сохранённых и отслеживаемых грантов придёт письмо.', 'You get an email 7, 3 and 1 day before the deadline of saved and tracked grants.')}</span></span></label>
          {msg && <div className="mt-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
          <p className="mt-4 text-xs text-muted">{L("Administrator xabarlari va shikoyatlar natijasi «Bildirishnomalar» sahifasida doim ko'rinadi.", 'Сообщения администратора и результаты жалоб всегда видны на странице «Уведомления».', 'Admin messages and complaint outcomes always appear on the Notifications page.')}</p>
        </Card>
        </div>
    ) },
    { id: 'security', icon: 'lock', title: L('Xavfsizlik', 'Безопасность', 'Security'), sub: L('PIN, barmoq izi, parol, qurilmalar', 'PIN, отпечаток, пароль, устройства', 'PIN, fingerprint, password, devices'), body: (
        <div className="space-y-5">
          <Card title={L('PIN-kod va barmoq izi', 'PIN-код и отпечаток', 'PIN & fingerprint')}><LockSettings /></Card>
          <Card title={L("Parolni o'zgartirish", 'Смена пароля', 'Change password')}><PasswordForm /></Card>
          <Card title={L('Faol qurilmalar', 'Активные устройства', 'Active devices')} hint={L("Hisobingizga kirgan qurilmalar. Notanish qurilmani chiqarib yuboring.", 'Устройства, с которых выполнен вход. Завершите незнакомые сеансы.', 'Devices signed in to your account. End any you do not recognise.')}><SessionsList /></Card>
        </div>
    ) },
    { id: 'data', icon: 'folder', title: L("Ma'lumotlar", 'Данные', 'Data'), sub: L('Yuklab olish va hisobni o\'chirish', 'Скачать данные и удалить аккаунт', 'Download data and delete account'), body: (
        <div className="space-y-5">
          <Card title={L("Ma'lumotlarni yuklab olish", 'Скачать данные', 'Download your data')} hint={L('Profil, saqlanganlar, arizalar, hujjatlar ro‘yxati, sharh va shikoyatlaringiz.', 'Профиль, избранное, заявки, список документов, отзывы и жалобы.', 'Your profile, saved grants, applications, document list, reviews and complaints.')}><ExportData /></Card>
          <section className="rounded-2xl border border-red-200 bg-white p-5"><h2 className="mb-3 text-lg font-bold text-red-700">{L("Hisobni o'chirish", 'Удаление аккаунта', 'Delete account')}</h2><DeleteAccount /></section>
        </div>
    ) },
      ]} />
    </div>
  );
}
