'use client';
import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { PageTitle, Tabs, useL } from '@/components/admin/kit';
import MailCheck from '@/components/MailCheck';
import LockSettings from '@/components/LockSettings';
import LangSwitch from '@/components/LangSwitch';
import PwaClient from '@/components/PwaClient';
import { AvatarUploader, NameLangForm, PasswordForm, SessionsList, SettingsCard as Card } from '@/components/AccountParts';

export default function AdminSettings() {
  const L = useL();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'profile' | 'security' | 'app'>('profile');
  return (
    <div className="max-w-3xl">
      <PageTitle title={L('Sozlamalar', 'Настройки', 'Settings')} sub={user?.email} />
      <Tabs value={tab} onChange={setTab} items={[
        { v: 'profile', label: L('Profil', 'Профиль', 'Profile') },
        { v: 'security', label: L('Xavfsizlik', 'Безопасность', 'Security') },
        { v: 'app', label: L('Til va ilova', 'Язык и приложение', 'Language & app') },
      ]} />
      {tab === 'profile' && (
        <div className="space-y-5">
          <Card title={L('Profil rasmi', 'Фото профиля', 'Profile photo')}><AvatarUploader /></Card>
          <Card title={L("Shaxsiy ma'lumotlar", 'Личные данные', 'Personal details')}><NameLangForm /></Card>
        </div>
      )}
      {tab === 'security' && (
        <div className="space-y-5">
          <Card title={L('PIN-kod va barmoq izi', 'PIN-код и отпечаток', 'PIN & fingerprint')}><LockSettings /></Card>
          <Card title={L("Parolni o'zgartirish", 'Смена пароля', 'Change password')}><PasswordForm /></Card>
          <Card title={L('Faol qurilmalar', 'Активные устройства', 'Active devices')} hint={L('Admin hisobiga kirgan qurilmalar. Notanishini darhol chiqarib yuboring.', 'Устройства с входом в админ-аккаунт. Незнакомые завершите сразу.', 'Devices signed in to this admin account. End unknown ones immediately.')}><SessionsList /></Card>
          <Card title={L('Seans', 'Сеанс', 'Session')}><button className="btn btn-ghost" onClick={async () => { await logout(); router.replace('/login'); }}>{L('Chiqish', 'Выйти', 'Log out')}</button></Card>
        </div>
      )}
      {tab === 'app' && (
        <div className="space-y-5">
        <Card title={L('Til va ilova', 'Язык и приложение', 'Language & app')} hint={L("Tanlangan til butun saytga qo'llanadi. Ilovani o'rnatsangiz, telefoningizda alohida ochiladi.", 'Выбранный язык действует на всём сайте. Установленное приложение открывается отдельно.', 'The chosen language applies site-wide. An installed app opens on its own.')}>
          <div className="flex flex-wrap gap-3"><LangSwitch full /><PwaClient /></div>
        </Card>
        <Card title={L('Pochta (email) holati', 'Состояние почты', 'Email status')} hint={L('Kirish kodlari shu orqali yuboriladi. Kod kelmasa, sababi shu yerda ko‘rinadi.', 'Коды входа отправляются через неё. Если код не приходит, причина будет здесь.', 'Login codes are sent through it. If codes do not arrive, the reason shows here.')}><MailCheck /></Card>
        </div>
      )}
    </div>
  );
}
